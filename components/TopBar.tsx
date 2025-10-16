"use client";

import React, { useEffect, useState } from "react";
import SavedChip from "./SavedChip";

const CURRENCY_FLAG: Record<string, string> = {
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

  // hydrate currency from localStorage and watch for cross-tab changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("triptrio:currency");
      if (stored && CURRENCY_FLAG[stored]) setCurrency(stored);
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === "triptrio:currency" && e.newValue && CURRENCY_FLAG[e.newValue]) {
        setCurrency(e.newValue);
      }
      if (e.key === "triptrio:saved") {
        try {
          const arr = JSON.parse(e.newValue || "[]");
          setSavedCount(Array.isArray(arr) ? arr.length : 0);
        } catch {
          setSavedCount(0);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // load saved count on mount
  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      setSavedCount(Array.isArray(arr) ? arr.length : 0);
    } catch {}
  }, []);

  function changeCurrency(next: string) {
    setCurrency(next);
    try {
      localStorage.setItem("triptrio:currency", next);
      // broadcast to page.tsx
      window.dispatchEvent(new CustomEvent("triptrio:currency:changed", { detail: next }));
    } catch {}
  }

  return (
    <div className="topbar-outer">
      <div className="main-wrap topbar-inner">
        <a href="/" className="brand">
          <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 8 }} />
          <span className="brand-title">TrioTrip</span>
        </a>

        <div className="topbar-right">
          <span className="pill"><SavedChip count={savedCount} /></span>
          <a className="pill" href="/login">Login</a>

          <div className="pill pill--ghost" title="Currency">
            <span style={{ fontWeight: 800, marginRight: 8 }}>
              {CURRENCY_FLAG[currency] || "💱"}
            </span>
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              style={{
                border: 0,
                background: "transparent",
                outline: "none",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {Object.keys(CURRENCY_FLAG).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_FLAG[c]} {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
