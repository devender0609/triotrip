"use client";

import Link from "next/link";
import Image from "next/image";
import AuthBar from "./AuthBar";
import React from "react";

/** Top header: TrioTrip brand (no underline), Saved/Login (elegant pills), Currency with flag */
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
    const map: Record<string,string> = {
      USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", INR: "🇮🇳", CAD: "🇨🇦",
      AUD: "🇦🇺", JPY: "🇯🇵", SGD: "🇸🇬", AED: "🇦🇪"
    };
    return map[c] || "🏳️";
  };

  return (
    <header className="tt-header" role="banner">
      <Link href="/" className="brand" aria-label="TrioTrip home" style={{ textDecoration: "none" }}>
        <Image src="/logo.png" alt="TrioTrip logo" width={28} height={28} priority />
        <span className="title">TrioTrip</span>
      </Link>

      <nav className="nav" aria-label="Main">
        {/* Saved */}
        <Link href="/saved" className="pill" style={{ textDecoration: "none" }}>
          Saved
        </Link>

        {/* Auth (Login/Logout) styled as elegant pill(s) */}
        <div className="auth-wrap">
          <AuthBar />
        </div>

        {/* Currency with flag */}
        <div className="currency pill">
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
      </nav>

      <style jsx>{`
        .tt-header {
          position: sticky; top: 0; z-index: 40;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e5e7eb;
        }
        .brand { display: inline-flex; align-items: center; gap: 8px; text-decoration: none !important; border-bottom: none !important; }
        .title { font-weight: 900; letter-spacing: -0.02em; font-size: 18px; color: #0f172a; }
        .nav { display: flex; gap: 10px; align-items: center; font-weight: 600; }

        /* Kill underlines globally for header links */
        .nav :global(a) {
          text-decoration: none !important;
          border-bottom: none !important;
          color: inherit;
        }
        .nav :global(a:hover), .nav :global(a:focus) {
          text-decoration: none !important;
          border-bottom: none !important;
        }

        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 999px;
          background: #fff; color: #0f172a; text-decoration: none !important;
          box-shadow: 0 1px 0 rgba(0,0,0,0.03);
        }
        .pill:hover { background: #f8fafc; }

        /* Ensure AuthBar’s links/buttons look like pills and have no underline */
        .auth-wrap :global(a), .auth-wrap :global(button) {
          text-decoration: none !important;
          border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 12px;
          background: #fff; color: #0f172a; font-weight: 700; cursor: pointer;
          box-shadow: 0 1px 0 rgba(0,0,0,0.03);
        }
        .auth-wrap :global(a:hover), .auth-wrap :global(button:hover) { background: #f8fafc; }

        .currency { padding-right: 8px; }
        .flag { font-size: 16px; }
        .currency-select {
          appearance: none; background: transparent; border: none; font-weight: 800; color: #0f172a;
          padding-right: 6px; cursor: pointer;
        }
        .currency-select:focus { outline: none; }
      `}</style>
    </header>
  );
}
