// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Brand from "../components/Brand";

export const metadata: Metadata = {
  title: "TrioTrip",
  description: "Top-3 travel picks – smarter, clearer, bookable.",
};

const FLAGS: Record<string, string> = {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currencyOptions = Object.keys(FLAGS).map((c) => (
    <option key={c} value={c}>{`${FLAGS[c]} ${c}`}</option>
  ));

  return (
    <html lang="en">
      <body>
        <header className="topbar-outer">
          <div className="main-wrap topbar-inner">
            <a href="/" className="brand no-underline" aria-label="TrioTrip Home">
              <Brand />
            </a>
            <nav className="topbar-right">
              <a className="pill pill--solid" href="/saved" title="Saved">
                <span className="pill-emoji">💾</span> Saved
                <span id="saved-count" className="pill-count" />
              </a>
              <a className="pill pill--solid" href="/login" title="Login">
                <span className="pill-emoji">🔐</span> Login
              </a>
              <div className="pill pill--ghost" title="Currency">
                <span id="currency-flag" className="pill-emoji" aria-hidden>🇺🇸</span>
                <select id="currency-select" className="pill-select" aria-label="Currency" defaultValue="USD">
                  {currencyOptions}
                </select>
              </div>
            </nav>
          </div>
        </header>

        <main className="main-wrap">{children}</main>

        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    // Saved count
    var savedEl = document.getElementById('saved-count');
    if (savedEl) {
      var raw = localStorage.getItem('triptrio:saved');
      var arr = [];
      try { arr = JSON.parse(raw || '[]') || []; } catch { arr = []; }
      savedEl.textContent = Array.isArray(arr) ? String(arr.length) : '0';
      window.addEventListener('storage', function(e) {
        if (e.key === 'triptrio:saved') {
          try { var a = JSON.parse(e.newValue || '[]') || []; savedEl.textContent = Array.isArray(a) ? String(a.length) : '0'; }
          catch { savedEl.textContent = '0'; }
        }
      });
    }

    // Currency picker
    var FLAGS = ${JSON.stringify(FLAGS)};
    var select = document.getElementById('currency-select');
    var flag = document.getElementById('currency-flag');
    function applyCurrency(cur) {
      if (!cur || !FLAGS[cur]) cur = 'USD';
      localStorage.setItem('triptrio:currency', cur);
      if (select && select.value !== cur) select.value = cur;
      if (flag) flag.textContent = FLAGS[cur] || '💱';
      window.dispatchEvent(new CustomEvent('triptrio:currency:changed', { detail: cur }));
    }
    if (select) {
      var stored = localStorage.getItem('triptrio:currency');
      applyCurrency(stored && FLAGS[stored] ? stored : 'USD');
      select.addEventListener('change', function(){ applyCurrency(select.value); });
    }
  } catch (e) { console && console.warn && console.warn('Topbar hydrate:', e); }
})();`,
          }}
        />
      </body>
    </html>
  );
}
