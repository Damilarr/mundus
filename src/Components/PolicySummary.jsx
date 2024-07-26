import React from "react";
import "./PolicySummary.css";

const PolicySummary = ({ privacySummary }) => {
  return (
    <div className="privacy-summary">
      <div>{policyResponse.contactInfo}</div>
      <div>{policyResponse.dataCollection}</div>
    </div>
  );
};

export default PolicySummary;
