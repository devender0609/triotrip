"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import Brand from "./Brand";

/** Client header: no underlines, elegant Saved/Login pills, Currency pill next to them */
export default function SiteHeader() {
  const [currency, setCurrency] = React.useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return window.localStorage.getItem("triptrio:currency") || "USD";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("triptrio:currency", currency);
    // notify the rest of the app (page.tsx listens for this)
    window.dispatchEvent(new CustomEvent("triptrio:currency", { detail: currency }));
  }, [currency]);

  const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "SGD", "AED"] as const;
  const flag = (c: string) =>
    ({ USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", INR: "🇮🇳", CAD: "🇨🇦", AUD: "🇦🇺", JPY: "🇯🇵", SGD: "🇸🇬", AED: "🇦🇪" }[
      c
    ] || "🏳️");

  return (
    <header className="tt-topbar" role="banner">
      {/* Brand: component already removes underlines internally */}
      <Brand />

      <nav className="tt-actions" aria-label="Main actions">
        <Link href="/saved" className="pill" aria-label="Saved">
          Saved
        </Link>
        <Link href="/login" className="pill" aria-label="Login">
          Login
        </Link>

        {/* Currency with flag */}
        <div className="pill currency" role="group" aria-label="Currency">
          <span className="flag" aria-hidden>
            {flag(currency)}
          </span>
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="currency-select"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* minimal styled-jsx is fine here (client component) */}
      <style jsx>{`
        .tt-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }
        .tt-actions {
          display: inline-flex;
          gap: 10px;
          align-items: center;
        }

        /* Kill underlines on all header links */
        .tt-topbar :global(a),
        .tt-topbar :global(a:hover),
        .tt-topbar :global(a:focus),
        .tt-topbar :global(a:active) {
          text-decoration: none !important;
          border-bottom: 0 !important;
          color: #0f172a;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
          font-weight: 800;
        }
        .pill:hover {
          background: #f8fafc;
        }

        .currency {
          padding-right: 8px;
        }
        .flag {
          font-size: 16px;
        }
        .currency-select {
          appearance: none;
          background: transparent;
          border: none;
          font-weight: 800;
          color: #0f172a;
          padding-right: 6px;
          cursor: pointer;
        }
        .currency-select:focus {
          outline: none;
        }
      `}</style>
    </header>
  );
}