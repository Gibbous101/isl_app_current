import React from "react";
import { useNavigate } from "react-router-dom";
import "./PageHeader.css";

export default function PageHeader({ title, backTo }) {
  const navigate = useNavigate();

  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => navigate(backTo)}>← Back</button>
      <h1>{title}</h1>
    </header>
  );
}
