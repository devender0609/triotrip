"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

/** Top header: TrioTrip brand, Login pill, Currency with flag (no Saved) */
export default function Header() {
  const [currency, setCurrency] = React.useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return window.localStorage.getItem("triptrio:currency") || "USD";
  });

  const currencies = ["USD", "EUR", "INR", "AED", "THB"];

  const flag = (c: string) => {
    const map: Record<string, string> = {
      USD: "🇺🇸",
      EUR: "🇪🇺",
      INR: "🇮🇳",
      AED: "🇦🇪",
      THB: "🇹🇭",
    };
    return map[c] || "🏳️";
  };

  return (
    <header className="tt-header" role="banner">
      <Link
        href="/"
        className="brand"
        aria-label="TrioTrip home"
        style={{ textDecoration: "none" }}
      >
        <Image
          src="/logo.png"
          alt="TrioTrip logo"
          width={28}
          height={28}
          priority
        />
        <span className="title">TrioTrip</span>
      </Link>

      <nav className="nav" aria-label="Main">
        {/* Simple Login pill (no Saved) */}
        <Link href="/login" className="pill login-pill">
          <span>Login</span>
        </Link>

        {/* Currency with flag */}
        <div className="pill currency-pill">
          <span aria-hidden className="flag">
            {flag(currency)}
          </span>
          <select
            aria-label="Currency"
            value={currency}
            onChange={(e) => {
              const value = e.target.value;
              setCurrency(value);
              if (typeof window !== "undefined") {
                window.localStorage.setItem("triptrio:currency", value);
                window.dispatchEvent(
                  new CustomEvent("triptrio:currency", { detail: value })
                );
              }
            }}
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

      <style jsx>{`
        .tt-header {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.4);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .title {
          font-weight: 800;
          font-size: 20px;
          letter-spacing: 0.03em;
          color: #f9fafb;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: radial-gradient(
              circle at top left,
              rgba(56, 189, 248, 0.18),
              transparent 50%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(236, 72, 153, 0.18),
              transparent 55%
            ),
            rgba(15, 23, 42, 0.9);
          color: #e5e7eb;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.4);
        }

        .login-pill {
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .currency-pill {
          font-size: 13px;
          font-weight: 600;
        }

        .flag {
          font-size: 14px;
        }

        .currency-select {
          margin-left: 4px;
          background: transparent;
          border: none;
          font-weight: 800;
          color: #f9fafb;
          padding-right: 6px;
          cursor: pointer;
        }

        .currency-select:focus {
          outline: none;
        }

        @media (max-width: 640px) {
          .tt-header {
            padding-inline: 12px;
          }
          .title {
            font-size: 18px;
          }
          .nav {
            gap: 6px;
          }
          .pill {
            padding: 5px 8px;
            font-size: 13px;
          }
        }

        @media (max-width: 420px) {
          .title {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
