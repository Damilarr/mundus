import { analyze } from "../Utils/Gemini";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.contextMenus.create({
    id: "mainMenu",
    title: "Mundus - privacy-policy,cache clearer",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "clearCacheAndCookies",
    parentId: "mainMenu",
    title: "Clear Cache and Cookies for this site",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "privacyPolicy",
    parentId: "mainMenu",
    title: "Analyze the privacy policy of this site",
    contexts: ["link"],
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clearBrowsingData") {
    clearSiteData(request.site, sendResponse);
    return true;
  }
});

function clearSiteData(site, callback) {
  chrome.cookies.getAll({ url: site }, (cookies) => {
    if (cookies.length === 0) {
      callback({ result: "no_cookies" });
      return;
    }
  });
  const removalOptions = {
    origins: [site],
  };

  const dataToRemove = {
    cache: true,
    cookies: true,
  };

  chrome.browsingData.remove(removalOptions, dataToRemove, () => {
    console.log(`Cache and cookies cleared for ${site}`);
    callback({ result: "success" });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "clearCacheAndCookies") {
    clearSiteData(tab.url, (response) => {
      let title, message;
      if (response.result === "success") {
        title = "Cache & Cookies Cleared";
        message = `Cache and cookies cleared for ${tab.url}`;
      } else if (response.result === "no_cookies") {
        title = "No Cookies Found";
        message = `No cookies found for ${tab.url}`;
      } else {
        title = "Failed to Clear Cache & Cookies";
        message = "Failed to clear cache and cookies.";
      }
      const notificationOptions = {
        type: "basic",
        iconUrl: "48icon.png",
        title: title,
        message: message,
      };
      chrome.notifications.create(notificationOptions);
    });
  } else if (info.menuItemId === "privacyPolicy") {
    const linkUrl = info.linkUrl;
    chrome.tabs.sendMessage(tab.id, { type: "DISPLAY_SKELETON" });
    try {
      const privacySummary = await analyze(linkUrl);

      chrome.tabs.sendMessage(tab.id, {
        type: "DISPLAY_PRIVACY_SUMMARY",
        privacySummary: privacySummary,
      });
    } catch (error) {
      console.error("Error analyzing privacy policy:", error);

      chrome.tabs.sendMessage(tab.id, {
        type: "DISPLAY_ERROR",
        error: error.message,
      });
    }
  }
});
