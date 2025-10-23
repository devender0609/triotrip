"use client";

import Link from "next/link";
import Image from "next/image";
import AuthBar from "./AuthBar";
import React from "react";

/**
 * Elegant top bar with Saved/Login, a compact Search link (scrolls to form),
 * and a currency selector that shows country flags.
 * Currency changes are broadcast via a CustomEvent so the page can react.
 */
export default function Header() {
  const [currency, setCurrency] = React.useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return window.localStorage.getItem("triptrio:currency") || "USD";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("triptrio:currency", currency);
    window.dispatchEvent(new CustomEvent("triptrio:currency", { detail: currency }));
  }, [currency]);

  const currencies = ["USD","EUR","GBP","INR","CAD","AUD","JPY","SGD","AED"] as const;
  const flag = (c: string) => {
    // very lightweight country-flag mapping by currency (best-effort)
    const map: Record<string,string> = {
      USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", INR: "🇮🇳", CAD: "🇨🇦",
      AUD: "🇦🇺", JPY: "🇯🇵", SGD: "🇸🇬", AED: "🇦🇪"
    };
    return map[c] || "🏳️";
  };

  return (
    <header className="tt-header" role="banner">
      <Link href="/" className="brand" aria-label="TrioTrip home">
        <Image src="/logo.png" alt="TrioTrip logo" width={40} height={40} priority />
        <span className="title">TrioTrip</span>
      </Link>

      <nav className="nav" aria-label="Main">
        <a href="#search" className="navlink" title="Jump to search">Search</a>
        <div className="currency">
          <span aria-hidden className="flag">{flag(currency)}</span>
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e)=>setCurrency(e.target.value)}
            className="currency-select"
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Link href="/saved" className="navlink">Saved</Link>
        <AuthBar />
      </nav>

      <style jsx>{`
        .tt-header {
          position: sticky; top: 0; z-index: 40;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e5e7eb;
        }
        .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .title { font-weight: 900; letter-spacing: -0.02em; font-size: 20px; color: #0f172a; }
        .nav { display: flex; gap: 14px; align-items: center; font-weight: 600; }
        .navlink { color: #334155; text-decoration: none; }
        .navlink:hover { text-decoration: none; }
        .currency {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
        }
        .flag { font-size: 16px; }
        .currency-select {
          appearance: none; background: transparent; border: none; font-weight: 800; color: #0f172a;
          padding-right: 14px; cursor: pointer;
        }
        .currency-select:focus { outline: none; }
      `}</style>
    </header>
  );
}