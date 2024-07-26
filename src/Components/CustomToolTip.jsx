import React from "react";

const CustomTooltip = ({ payload, label, active }) => {
  if (active) {
    return (
      <div className="p-8 custom-tooltip bg-white/5 shadow-md border border-black/10 rounded-lg backdrop-blur-md relative">
        <p className="label">{`${label} : ${payload[0].value}`}</p>
        {/* <p className="intro text-xl uppercase">{analysis.mood}</p> */}
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
