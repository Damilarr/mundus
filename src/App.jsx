import React, { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import CustomTooltip from "./Components/CustomToolTip";
import { analyze } from "./Utils/Gemini";
function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tabsInfo, setTabsInfo] = useState([]);
  const [link, setLink] = useState("");

  const clearBrowsingData = () => {
    console.log("btn clicked");
    setIsClearing(true);
    setMessage("Clearing cache and cookies...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        let url = new URL(tabs[0].url);
        let site = `${url.protocol}//${url.hostname}`;
        chrome.runtime.sendMessage(
          { action: "clearBrowsingData", site: site },
          (response) => {
            let title, message;
            if (response.result === "success") {
              title = "Cache & Cookies Cleared";
              message = `Cache and cookies cleared for ${site}`;
              getCookieAndCachesForOpenTabs();
            } else if (response.result === "no_cookies") {
              title = "No Cookies Found";
              message = `No cookies found for ${site}`;
            } else {
              title = "Failed to Clear Cache & Cookies";
              message = `Failed to clear cache and cookies for ${site}.`;
            }
            setMessage(message);
            const notificationOptions = {
              type: "basic",
              iconUrl: "48icon.png",
              title: title,
              message: message,
            };
            chrome.notifications.create(notificationOptions);
            setIsClearing(false);
          }
        );
      } else {
        setMessage("No active tab found.");
        setIsClearing(false);
      }
    });
  };
  const getCookieAndCachesForOpenTabs = () => {
    setIsLoading(true);
    chrome.tabs.query({}, (tabs) => {
      const tabsData = [];
      let processedTabs = 0;

      tabs.forEach((tab) => {
        const url = new URL(tab.url);
        const origin = url.origin;

        chrome.cookies.getAll({ url: origin }, (cookies) => {
          const numOfCookies = cookies.length;
          console.log(`Number of cookies for ${origin}: ${numOfCookies}`);
          if (numOfCookies !== 0) {
            tabsData.push({
              title: tab.title,
              url: origin,
              cookies: numOfCookies,
            });
          }
          processedTabs++;

          // Check if all tabs have been processed
          if (processedTabs === tabs.length) {
            setTabsInfo(tabsData);
            setIsLoading(false);
          }
        });
      });
    });
  };
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          fontWeight="bold"
          textAnchor="middle"
          fill="#333"
        >
          {new URL(payload.url).hostname}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          fontWeight={600}
          textAnchor={textAnchor}
          fill="#333"
        >{`${value} Cookies`}</text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
        >
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };
  useEffect(() => {
    getCookieAndCachesForOpenTabs();
  }, []);

  if (tabsInfo.length === 0 && isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex w-full  pb-5 flex-col m-1 space-y-5 min-w-[500px] min-h-[500px]  text-[#333] text-center">
      <section>
        <h1 className="text-2xl  font-bold my-4 mb-1">
          Cookie data for {tabsInfo.length} Open Tabs
        </h1>
        <div className="w-full h-fit">
          <ResponsiveContainer width="100%" minWidth="100%" height={300}>
            <PieChart width={400} height={400}>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                dataKey="cookies"
                isAnimationActive={true}
                data={tabsInfo}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#f9511d"
                label
                onMouseEnter={(_, index) => setActiveIndex(index)}
              />
            </PieChart>
            <Tooltip content={<CustomTooltip />} />
          </ResponsiveContainer>
        </div>
        <div>
          <button
            onClick={clearBrowsingData}
            disabled={isClearing}
            className={`px-4 py-2 bg-[#263038] shadow-sm text-white font-semibold rounded ${
              isClearing
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#263038]/90"
            }`}
          >
            {isClearing ? "Clearing..." : "Clear Cache & Cookies for this site"}
          </button>
          {message && <p className="mt-4 text-black font-medium">{message}</p>}
        </div>
      </section>
    </div>
  );
}

export default App;
