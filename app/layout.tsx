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
  // Prepare options (rendered server-side; behavior added via inline script)
  const currencyOptions = Object.keys(FLAGS).map((c) => (
    <option key={c} value={c}>
      {`${FLAGS[c]} ${c}`}
    </option>
  ));

  return (
    <html lang="en">
      <body>
        {/* Top bar (single place for Saved, Login, Currency) */}
        <header
          className="topbar-outer"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="main-wrap topbar-inner" style={{ padding: "10px 0" }}>
            <a href="/" className="brand" aria-label="TrioTrip Home">
              {/* Keep using your Brand component (no underline). If Brand renders an <a>, this is safe too. */}
              <Brand />
            </a>

            <div className="topbar-right">
              <a className="pill pill--solid" href="/saved" title="View saved">
                <span className="pill-emoji">💾</span> Saved
                <span id="saved-count" className="pill-count" />
              </a>

              <a className="pill pill--solid" href="/login" title="Login">
                <span className="pill-emoji">🔐</span> Login
              </a>

              {/* Currency pill */}
              <div className="pill pill--ghost" title="Currency">
                <span id="currency-flag" className="pill-emoji" aria-hidden>
                  🇺🇸
                </span>
                <select
                  id="currency-select"
                  className="pill-select"
                  aria-label="Currency"
                  defaultValue="USD"
                >
                  {currencyOptions}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* Inline script to hydrate Saved count + Currency without making layout a client component */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    // Saved counter
    var savedEl = document.getElementById('saved-count');
    if (savedEl) {
      var raw = localStorage.getItem('triptrio:saved');
      var arr = [];
      try { arr = JSON.parse(raw || '[]') || []; } catch { arr = []; }
      if (Array.isArray(arr)) savedEl.textContent = String(arr.length);
      window.addEventListener('storage', function(e) {
        if (e.key === 'triptrio:saved') {
          try {
            var a = JSON.parse(e.newValue || '[]') || [];
            savedEl.textContent = Array.isArray(a) ? String(a.length) : '0';
          } catch { savedEl.textContent = '0'; }
        }
      });
    }

    // Currency picker
    var SEL_ID = 'currency-select';
    var FLAG_ID = 'currency-flag';
    var FLAGS = ${JSON.stringify(FLAGS)};

    var select = document.getElementById(SEL_ID);
    var flag = document.getElementById(FLAG_ID);

    function applyCurrency(cur) {
      try {
        if (!cur || !FLAGS[cur]) cur = 'USD';
        localStorage.setItem('triptrio:currency', cur);
        if (select && select.value !== cur) select.value = cur;
        if (flag) flag.textContent = FLAGS[cur] || '💱';
        // Broadcast to app/page.tsx (or others) listening for this event
        window.dispatchEvent(new CustomEvent('triptrio:currency:changed', { detail: cur }));
      } catch {}
    }

    if (select) {
      // initialize from localStorage
      var stored = localStorage.getItem('triptrio:currency');
      applyCurrency(stored && FLAGS[stored] ? stored : 'USD');

      select.addEventListener('change', function() {
        applyCurrency(select.value);
      });
    }
  } catch (e) {
    console && console.warn && console.warn('Topbar hydrate error:', e);
  }
})();`,
          }}
        />
      </body>
    </html>
  );
}
