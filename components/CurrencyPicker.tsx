"use client";

import React, { useEffect, useState } from "react";

type Curr = { code: string; label: string; flag: string };

const CURRS: Curr[] = [
  { code: "USD", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound", flag: "🇬🇧" },
  { code: "INR", label: "Indian Rupee", flag: "🇮🇳" },
  { code: "JPY", label: "Japanese Yen", flag: "🇯🇵" },
  { code: "AUD", label: "Australian Dollar", flag: "🇦🇺" },
  { code: "CAD", label: "Canadian Dollar", flag: "🇨🇦" },
];

export default function CurrencyPicker() {
  const [code, setCode] = useState<string>("USD");

  useEffect(() => {
    const initial = (typeof window !== "undefined" && localStorage.getItem("tt_currency")) || "USD";
    setCode(initial);
    const handler = (e: any) => { if (e?.detail?.code) setCode(e.detail.code); };
    window.addEventListener("tt:currency", handler as any);
    return () => window.removeEventListener("tt:currency", handler as any);
  }, []);

  function change(c: string) {
    setCode(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("tt_currency", c);
      window.dispatchEvent(new CustomEvent("tt:currency", { detail: { code: c } }));
    }
  }

  const curr = CURRS.find(x => x.code === code) || CURRS[0];

  return (
    <div className="curr">
      <button className="pill" title={curr.label}>
        <span className="flag">{curr.flag}</span>
        <span className="code">{curr.code}</span>
      </button>
      <div className="menu" role="menu">
        {CURRS.map(c => (
          <button key={c.code} onClick={() => change(c.code)} className={`item ${code === c.code ? "active" : ""}`} role="menuitem">
            <span className="flag">{c.flag}</span> {c.code}
          </button>
        ))}
      </div>
      <style jsx>{`
        .curr{position:relative}
        .pill{height:40px;padding:0 12px;border:1px solid #e2e8f0;background:#fff;border-radius:999px;display:flex;align-items:center;gap:8px;font-weight:800;cursor:pointer}
        .flag{font-size:18px;line-height:1}
        .code{color:#0f172a}
        .menu{display:none;position:absolute;right:0;top:44px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 28px rgba(2,6,23,.1);min-width:160px;z-index:20;padding:6px}
        .curr:hover .menu{display:block}
        .item{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:8px}
        .item:hover{background:#f1f5f9}
        .item.active{background:#e2e8f0}
      `}</style>
    </div>
  );
}
