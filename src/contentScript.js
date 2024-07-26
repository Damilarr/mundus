console.log("Content script loaded");
let currentLang = "en";
let selectedLang = "en";

//translation parameters
const microsoftTranslate = async (text, langToTranslateTo) => {
  const url = "https://deep-translate1.p.rapidapi.com/language/translate/v2";
  const options = {
    method: "POST",
    headers: {
      "x-rapidapi-key": "8425a8bfe6mshd01d9504d2c7feep16d95ejsn3bf87ebd51c8",
      "x-rapidapi-host": "deep-translate1.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      target: langToTranslateTo,
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data.translations.translatedText;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//listeners for message from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("content script received message", message);
  if (message.type === "DISPLAY_SKELETON") {
    displaySkeleton();
  } else if (message.type === "DISPLAY_ERROR") {
    displayError(message.error);
  } else if (message.type === "DISPLAY_PRIVACY_SUMMARY") {
    displayPrivacySummary(message.privacySummary);
  }
});

//DISPLAY SKELETON
function displaySkeleton() {
  let container = document.createElement("div");
  container.classList.add("react-container");
  container.id = "skeleton-container";

  // attach shadow DOM to container
  const shadowRoot = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .container {
      position: fixed;
      display: flex;
      justify-content: center;
      align-items: center;
      top: 40px;
      right: 40px;
      width: 400px;
      height: 500px;
      background-color: #263038;
      border: 1px solid black;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: auto;
      z-index: 2147483647;
    }

    button {
      margin: 16px;
    }
    .loader {
      width: 48px;
      height: 48px;
      border: 3px dotted #FFF;
      border-style: solid solid dotted dotted;
      border-radius: 50%;
      display: inline-block;
      position: relative;
      box-sizing: border-box;
      animation: rotation 2s linear infinite;
    }
    .loader::after {
      content: '';  
      box-sizing: border-box;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: auto;
      border: 3px dotted #FF3D00;
      border-style: solid solid dotted;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      animation: rotationBack 1s linear infinite;
      transform-origin: center center;
    }
        
    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    } 
    @keyframes rotationBack {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(-360deg);
      }
    } 
  `;
  shadowRoot.appendChild(style);
  const divv = document.createElement("div");
  divv.classList.add("container");
  shadowRoot.appendChild(divv);

  const spanElement = document.createElement("span");
  spanElement.classList.add("loader");
  divv.appendChild(spanElement);

  document.body.appendChild(container);
}

//DISPLAY ERRORS
function displayError(error) {
  hideSkeleton();
  let container = document.createElement("div");
  container.classList.add("react-container");
  container.id = "skeleton-container";
  const shadowRoot = container.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
  .container {
    position: fixed;
    display: flex;
    color:#fff;
    top: 40px;
    right: 40px;
    width: 500px;
    height: 500px;
    background-color: #263038;
    border: 1px solid black;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: auto;
    z-index: 2147483647;
  }
`;
  shadowRoot.appendChild(style);
  const errorContainer = document.createElement("div");
  errorContainer.classList.add("container");
  errorContainer.innerHTML = `An Error Occured:<br> ${error}`;
  shadowRoot.appendChild(errorContainer);
  document.body.appendChild(container);
}

//TRANSLATE SUMMARY
async function translateSummary() {
  if (currentLang != selectedLang) {
    const parentContainer = document.getElementById(
      "privacy-summary-container"
    );
    displaySkeleton();
    parentContainer.style.display = "none";

    const shadowRoot = parentContainer.shadowRoot;
    console.log(shadowRoot);

    const summaryContent = shadowRoot.getElementById("privacy-summary-content");
    console.log(summaryContent);

    const originalTextElements = summaryContent.querySelectorAll("h2, h3, p");
    console.log(originalTextElements);
    const translationPromises = [];

    for (const element of originalTextElements) {
      const originalText = element.textContent;
      translationPromises.push(
        await microsoftTranslate(originalText, selectedLang)
      );
    }

    try {
      const translatedTexts = await Promise.all(translationPromises);
      originalTextElements.forEach((element, index) => {
        element.textContent = translatedTexts[index];
      });

      hideSkeleton();
      parentContainer.style.display = "block";

      currentLang = selectedLang;
    } catch (error) {
      console.error("Translation failed:", error);
    }
  } else {
    console.log("");
  }
}

//HIDE SKELETON
function hideSkeleton() {
  const skeletonContainer = document.getElementById("skeleton-container");
  if (skeletonContainer) {
    skeletonContainer.remove();
  }
}

//CLOSE SUMMARY
function closeSummary() {
  const Parentcontainer = document.getElementById("privacy-summary-container");
  if (Parentcontainer) {
    Parentcontainer.remove();
  }
}

//DISPLAY SUMMARY
function displayPrivacySummary(privacySummary) {
  hideSkeleton();
  const Parentcontainer = document.createElement("div");
  Parentcontainer.id = "privacy-summary-container";
  const container = document.createElement("div");
  container.id = "privacy-summary-content";
  container.classList.add("container");
  container.innerHTML = `<h2>Privacy Summary</h2>
    <h3>What type of data does this site collect?</h3>
    <p>${privacySummary.dataCollected}</p>
    <h3>What is the data collected used for?</h3>
    <p>${privacySummary.purposeOfCollection}</p>
    <h3>With whom is the collected data Shared</h3>
    <p>${privacySummary.sharing}</p>
    <h3>What right do you have regarding your data?</h3>
    <p>${privacySummary.userRights}</p>
    <h3>What measures are in place to protect your data</h3>
    <p>${privacySummary.dataSecurity}</p>
    <h3>How long is your data being kept?</h3>
    <p>${privacySummary.dataRetention}</p>
    <h3>Does this site use trackers (e.g cookies)</h3>
    <p>${privacySummary.tracking}</p>
    <h3>What measures are in place to protect your data</h3>
    <p>${privacySummary.dataSecurity}</p>
    <h3>How to contact this website for questions or concerns</h3>
    <p>${privacySummary.contactInfo}</p>
    <h3>How compliant is the website's policy with the General Data Protection Regulation (GDPR)</h3>
    <p>${privacySummary.complianceScore}/10</p>
    `;
  const closeSummaryBtn = document.createElement("button");
  closeSummaryBtn.id = "close-summary-btn";
  closeSummaryBtn.textContent = "close";
  closeSummaryBtn.addEventListener("click", closeSummary);
  container.insertBefore(closeSummaryBtn, container.firstChild);
  //
  const langSelectContainer = document.createElement("div");
  langSelectContainer.classList.add("lang-list");
  //
  const btn = document.createElement("button");
  btn.classList.add("transBtn");
  btn.textContent = "Translate";
  btn.addEventListener("click", translateSummary);
  //
  langSelectContainer.appendChild(btn);

  fetch(chrome.runtime.getURL("/data/languages.json"))
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch languages.json");
      }
      return response.json();
    })
    .then((data) => {
      const languages = data.languages;

      const select = document.createElement("select");
      select.id = "languageSelect";
      languages.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang.language;
        option.textContent = lang.name;
        if (lang.language === "en") {
          option.selected = true;
        }
        select.appendChild(option);
      });
      select.addEventListener("change", (event) => {
        selectedLang = event.target.value;
      });
      langSelectContainer.appendChild(select);
    })
    .catch((error) => {
      console.error("Error loading languages.json:", error);
    });

  const shadowRoot = Parentcontainer.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
  @font-face {
    font-family: exo;
    font-style: normal;
    font-weight: 400;
    src: url('/fonts/Exo-VariableFont_wght.ttf'); 
   }
  .container {
    position: fixed;
    display: flex;
    flex-direction: column;
    padding: 16px;
    top: 40px;
    right: 40px;
    width: 400px;
    height: 85%;
    font-style: exo;
    background-color: #263038;
    border: 1px solid black;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow-y: scroll;
    z-index: 2047483647;
  }

    #privacy-summary-content {
      color: white;
      padding:10px 10px 10px 10px;
      font-style: exo;

    }
    h2 {
      color:#f9511d;
      font-size: 24px;
    }
    h3 {
      color: #f9511d;
      font-size: 18px;
      margin:0px;
    }
    p {
      color: white;
      font-size: 16px;
    }
    button.transBtn{
      background-color:#f9511d;
      color:#fff;
      border-radius:8px;
      font-size:16px;
      padding:10px 24px;
      cursor:pointer;
    }
    .lang-list{
      display:flex;
      align-items:center;
      justify-content: space-between;
      width:100%;
      position:sticky;
      bottom:0px;
      padding:4px 0;
      background: rgba(255, 255, 255, 0.0);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    button#close-summary-btn{
      background-color:#fff;
      position:sticky;
      top:0px;
      padding:10px 14px;
      border-radius:8px;
      font-size:16px;
      cursor:pointer;
      color:#000;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }
    #languageSelect{
      padding:10px;
      outline:none;
      font-size:16px;
      border-radius:8px;
    }
    #privacy-summary-content::-webkit-scrollbar {
      display: none;
    }
    #privacy-summary-content {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `;
  container.appendChild(langSelectContainer);
  shadowRoot.appendChild(style);
  shadowRoot.appendChild(container);

  document.body.appendChild(Parentcontainer);
}
