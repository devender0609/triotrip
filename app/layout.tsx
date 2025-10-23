// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Brand from "../components/Brand";
import React from "react";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "Top-3 travel picks – smarter, clearer, bookable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = React.useState<string>("USD");

  React.useEffect(() => {
    try {
      const cur = localStorage.getItem("triptrio:currency");
      if (cur) setCurrency(cur);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("triptrio:currency", currency);
      window.dispatchEvent(new CustomEvent("triptrio:currency", { detail: currency }));
    } catch {}
  }, [currency]);

  const currencies = ["USD","EUR","GBP","INR","CAD","AUD","JPY","SGD","AED"] as const;
  const flag = (c: string) => ({
    USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", INR:"🇮🇳", CAD:"🇨🇦",
    AUD:"🇦🇺", JPY:"🇯🇵", SGD:"🇸🇬", AED:"🇦🇪"
  }[c] || "🏳️");

  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Brand />
          <nav className="actions" aria-label="Main">
            <a href="/saved" className="pill" role="link">Saved</a>
            <a href="/login" className="pill" role="link">Login</a>

            {/* Currency pill with flag */}
            <div className="pill currency" role="group" aria-label="Currency">
              <span className="flag" aria-hidden>{flag(currency)}</span>
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
        </header>

        {children}

        <style jsx global>{`
          /* header look */
          .topbar {
            position: sticky; top: 0; z-index: 40;
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb;
          }
          .actions { display: inline-flex; gap: 10px; align-items: center; }

          /* KILL underlines on all header links (brand + actions) */
          .topbar a, .topbar a:visited, .topbar a:hover, .topbar a:active, .topbar a:focus {
            text-decoration: none !important;
            border-bottom: 0 !important;
            color: #0f172a;
          }

          /* elegant pills */
          .pill {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 999px;
            background: #fff; box-shadow: 0 1px 0 rgba(0,0,0,0.03);
            font-weight: 800;
          }
          .pill:hover { background: #f8fafc; }

          .currency { padding-right: 8px; }
          .flag { font-size: 16px; }
          .currency-select {
            appearance: none; background: transparent; border: none; font-weight: 800; color: #0f172a;
            padding-right: 6px; cursor: pointer;
          }
          .currency-select:focus { outline: none; }
        `}</style>
      </body>
    </html>
  );
}
