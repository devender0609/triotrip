"use client";

import React, { useEffect, useState } from "react";

const FLAG: Record<string, string> = {
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
  const [currency, setCurrency] = useState("USD");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem("triptrio:currency");
      if (s && FLAG[s]) setCurrency(s);
      const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      setSavedCount(Array.isArray(arr) ? arr.length : 0);
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === "triptrio:currency" && e.newValue && FLAG[e.newValue]) setCurrency(e.newValue);
      if (e.key === "triptrio:saved") {
        try {
          const arr = JSON.parse(e.newValue || "[]");
          setSavedCount(Array.isArray(arr) ? arr.length : 0);
        } catch { setSavedCount(0); }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function changeCurrency(next: string) {
    setCurrency(next);
    try {
      localStorage.setItem("triptrio:currency", next);
      window.dispatchEvent(new CustomEvent("triptrio:currency:changed", { detail: next }));
    } catch {}
  }

  return (
    <>
      <a href="/" className="brand" aria-label="TrioTrip Home">
        <img src="/logo.png" alt="" width={36} height={36} style={{ borderRadius: 8 }} />
        <span className="brand-title">TrioTrip</span>
      </a>

      <div className="topbar-right">
        <a className="pill pill--solid" href="/saved" title="View saved">
          <span className="pill-emoji">💾</span> Saved <span className="pill-count">{savedCount}</span>
        </a>
        <a className="pill pill--solid" href="/login" title="Login">
          <span className="pill-emoji">🔐</span> Login
        </a>
        <div className="pill pill--ghost" title="Currency">
          <span className="pill-emoji" aria-hidden>{FLAG[currency] || "💱"}</span>
          <select
            value={currency}
            onChange={(e) => changeCurrency(e.target.value)}
            className="pill-select"
            aria-label="Currency"
          >
            {Object.keys(FLAG).map((c) => (
              <option key={c} value={c}>
                {FLAG[c]} {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
