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
  return (
    <html lang="en">
      <body>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            gap: 12,
          }}
        >
          <a href="/" aria-label="TrioTrip Home" style={{ textDecoration: "none" }}>
            <Brand />
          </a>

          <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Currency (scoped styles) */}
            <div
              className="ttbar-currency"
              title="Currency"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e2e8f0",
                padding: "6px 10px",
                borderRadius: 999,
                background: "#fff",
                boxShadow: "0 2px 6px rgba(2,6,23,.06)",
                fontWeight: 700,
              }}
            >
              <span id="ttbar-flag" aria-hidden>
                🇺🇸
              </span>
              <select
                id="ttbar-currency"
                aria-label="Currency"
                defaultValue="USD"
                style={{
                  border: "none",
                  background: "transparent",
                  fontWeight: 800,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {Object.keys(FLAGS).map((c) => (
                  <option key={c} value={c}>
                    {FLAGS[c]} {c}
                  </option>
                ))}
              </select>
            </div>

            <a href="/saved" className="btn ghost" style={{ fontWeight: 800 }}>
              💾 Saved
              <span
                id="ttbar-saved-count"
                style={{
                  marginLeft: 6,
                  background: "#0ea5e9",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "0 6px",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              />
            </a>
            <a href="/login" className="btn" style={{ fontWeight: 800 }}>
              🔐 Login
            </a>
          </nav>
        </header>

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 12px" }}>{children}</main>

        {/* Minimal, scoped behavior for currency + saved count (no global style changes) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try{
    var FLAGS=${JSON.stringify(FLAGS)};
    var select=document.getElementById('ttbar-currency');
    var flag=document.getElementById('ttbar-flag');
    function applyCurrency(cur){
      if(!cur || !FLAGS[cur]) cur='USD';
      localStorage.setItem('triptrio:currency', cur);
      if(select && select.value!==cur) select.value=cur;
      if(flag) flag.textContent = FLAGS[cur] || '💱';
      window.dispatchEvent(new CustomEvent('triptrio:currency:changed',{detail:cur}));
    }
    if(select){
      var stored=localStorage.getItem('triptrio:currency');
      applyCurrency(stored && FLAGS[stored] ? stored : 'USD');
      select.addEventListener('change', function(){ applyCurrency(select.value); });
    }

    var savedEl=document.getElementById('ttbar-saved-count');
    if(savedEl){
      var raw=localStorage.getItem('triptrio:saved');
      var arr=[]; try{arr=JSON.parse(raw||'[]')||[]}catch{arr=[]}
      savedEl.textContent=Array.isArray(arr)?String(arr.length):'0';
      window.addEventListener('storage', function(e){
        if(e.key==='triptrio:saved'){
          try{ var a=JSON.parse(e.newValue||'[]')||[]; savedEl.textContent=Array.isArray(a)?String(a.length):'0';}
          catch{ savedEl.textContent='0'; }
        }
      });
    }
  }catch(e){}
})();`,
          }}
        />
      </body>
    </html>
  );
}
