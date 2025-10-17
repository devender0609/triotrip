"use client";
import React, { useEffect, useState } from "react";

const FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  INR: "🇮🇳",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  JPY: "🇯🇵",
  SGD: "🇸🇬",
  AED: "🇦🇪",
};

export default function TopBar() {
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return localStorage.getItem("tt.currency") || "USD";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-currency", currency);
      localStorage.setItem("tt.currency", currency);
      const el = document.getElementById("tt-saved-count");
      if (el && !el.textContent) el.textContent = "0";
    }
  }, [currency]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a href="/" className="brand" aria-label="TrioTrip home">
          <img src="/logo.png" alt="" />
          <h1>TrioTrip</h1>
        </a>

        <div className="pills">
          <div className="curr" title="Currency">
            <span className="curr-flag" aria-hidden>{FLAGS[currency] || "🏳️"}</span>
            <select aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
              {Object.keys(FLAGS).map(c => (
                <option key={c} value={c}>{FLAGS[c]} {c}</option>
              ))}
            </select>
          </div>

          <a href="/saved" className="pill ghost">
            💾 Saved <span id="tt-saved-count" className="count" />
          </a>
          <a href="/login" className="pill">🔐 Login</a>
        </div>
      </div>
    </header>
  );
}
