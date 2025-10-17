// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import React from "react";

// --- same currency/flag logic as TopBar, but inlined ---
const FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", INR: "🇮🇳", CAD: "🇨🇦",
  AUD: "🇦🇺", JPY: "🇯🇵", SGD: "🇸🇬", AED: "🇦🇪",
};

function CurrencyPill() {
  const [currency, setCurrency] = React.useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return localStorage.getItem("tt.currency") || "USD";
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-currency", currency);
    localStorage.setItem("tt.currency", currency);
  }, [currency]);

  return (
    <div className="curr" title="Currency">
      <span className="curr-flag" aria-hidden>{FLAGS[currency] || "🏳️"}</span>
      <select aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
        {Object.keys(FLAGS).map(c => (
          <option key={c} value={c}>{FLAGS[c]} {c}</option>
        ))}
      </select>
    </div>
  );
}

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "Top-3 travel picks – smarter, clearer, bookable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Top bar (same look as TopBar.tsx) */}
        <header className="topbar">
          <div className="topbar-inner">
            <a href="/" className="brand" aria-label="TrioTrip home">
              <img src="/logo.png" alt="" />
              <h1>TrioTrip</h1>
            </a>
            <div className="pills">
              <CurrencyPill />
              <a href="/saved" className="pill ghost">
                💾 Saved <span id="tt-saved-count" className="count" />
              </a>
              <a href="/login" className="pill">🔐 Login</a>
            </div>
          </div>
        </header>

        {/* Page content – fixed width, no horizontal scroll */}
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
