
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Currency = "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "JPY" | "SGD" | "AED";

const FLAGS: Record<Currency, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", INR: "🇮🇳", CAD: "🇨🇦",
  AUD: "🇦🇺", JPY: "🇯🇵", SGD: "🇸🇬", AED: "🇦🇪",
};

export default function CurrencyPicker() {
  const [cur, setCur] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD";
    return (localStorage.getItem("currency") as Currency) || "USD";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("currency", cur);
    // notify listeners
    window.dispatchEvent(new CustomEvent("currency-change", { detail: cur }));
  }, [cur]);

  const options = useMemo(() => (Object.keys(FLAGS) as Currency[]), []);

  return (
    <div className="currency-picker" title="Currency">
      <span className="flag" aria-hidden>{FLAGS[cur]}</span>
      <select
        className="cur-select"
        value={cur}
        onChange={(e) => setCur(e.target.value as Currency)}
        aria-label="Currency"
      >
        {options.map(c => (
          <option key={c} value={c}>{FLAGS[c]} {c}</option>
        ))}
      </select>
      <style jsx>{`
        .currency-picker {
          display: inline-flex; align-items: center; gap: 8px; 
          padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
        }
        .flag { font-size: 16px; line-height: 1; }
        .cur-select {
          border: none; background: transparent; outline: none; font-weight: 700;
        }
        .cur-select option { font-weight: 600; }
      `}</style>
    </div>
  );
}
