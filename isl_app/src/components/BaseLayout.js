import React from "react";
import "./BaseLayout.css";

export default function BaseLayout({ title, children }) {
  return (
    <div className="layout-container">
      <h1 className="main-title">{title}</h1>
      <p className="subtitle">Practice your ASL alphabet signs with real-time feedback</p>
      <div className="content">{children}</div>
    </div>
  );
}
