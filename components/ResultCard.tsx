"use client";
import React from "react";

const AIRLINE_SITE: Record<string, string> = {
  American:"https://www.aa.com","American Airlines":"https://www.aa.com",
  Delta:"https://www.delta.com","Delta Air Lines":"https://www.delta.com",
  United:"https://www.united.com","United Airlines":"https://www.united.com",
  Alaska:"https://www.alaskaair.com","Alaska Airlines":"https://www.alaskaair.com",
  Southwest:"https://www.southwest.com", JetBlue:"https://www.jetblue.com",
  Lufthansa:"https://www.lufthansa.com", Qatar:"https://www.qatarairways.com",
  Emirates:"https://www.emirates.com", "Air France":"https://wwws.airfrance.us",
  KLM:"https://www.klm.com", ANA:"https://www.ana.co.jp", JAL:"https://www.jal.co.jp",
  "British Airways":"https://www.britishairways.com",
};

const TRIOTRIP_BASE = process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "https://triotrip.vercel.app";
const TRIOTRIP_BOOK_PATH = process.env.NEXT_PUBLIC_TRIOTRIP_BOOK_PATH || "/book/checkout";

const ensureHttps = (u?: string | null) => {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = s.replace(/^http:\/\//i, "https://");
  return s;
};

const fmtTime = (t?: string) => !t ? "" : new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDur = (min?: number) => min == null ? "" : `${Math.floor(min/60)}h ${min%60}m`;
const currencyOnPage = () => (typeof document === "undefined" ? "USD" : (document.documentElement.getAttribute("data-currency") || "USD"));

type Props = {
  pkg: any;
  index?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  showHotel?: boolean;
};

export default function ResultCard({
  pkg, index = 0, comparedIds, onToggleCompare, showHotel,
}: Props) {
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
  const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
  const infants = Number(pkg.passengersInfants ?? pkg.infants ?? 0) || 0;

  const outSegs: any[] = Array.isArray(pkg?.flight?.segments) ? pkg.flight.segments : (pkg.flight?.segments_out || []);
  const inSegs: any[]  = Array.isArray(pkg?.returnFlight?.segments) ? pkg.returnFlight.segments : (pkg.flight?.segments_in || []);
  const out0 = outSegs?.[0]; const in0 = inSegs?.[0];

  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to   = (outSegs?.[outSegs.length-1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = (out0?.depart_time || "").slice(0,10);
  const dateRet = (in0?.depart_time || "").slice(0,10);

  const priceAmount = Number(pkg?.price?.amount || pkg?.priceAmount || 0);
  const priceCurrency = String(pkg?.price?.currency || pkg?.currency || currencyOnPage() || "USD");

  const trioTrip =
    `${TRIOTRIP_BASE}${TRIOTRIP_BOOK_PATH}` +
    `?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}` +
    `&depart=${encodeURIComponent(dateOut)}` +
    (dateRet ? `&return=${encodeURIComponent(dateRet)}` : "") +
    `&adults=${adults}&children=${children}&infants=${infants}` +
    (pkg.offerId ? `&flightId=${encodeURIComponent(pkg.offerId)}` : "");

  return (
    <section
      className={`result-card ${compared ? "result-card--compared" : ""}`}
      onClick={() => onToggleCompare?.(id)}
      style={{ cursor: onToggleCompare ? "pointer" : "default" }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800 }}>
          Option {index + 1} • {from} → {to} {dateOut ? `• ${dateOut}` : ""} {dateRet ? `↩ ${dateRet}` : ""}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div className="mono" style={{ fontWeight: 900 }}>💸 {new Intl.NumberFormat(undefined, { style: "currency", currency: priceCurrency, maximumFractionDigits: 0 }).format(priceAmount || 0)}</div>
          <a className="btn" href={trioTrip} target="_blank" rel="noreferrer">TrioTrip</a>
          {onToggleCompare && (
            <button
              className="btn"
              onClick={(e) => { e.stopPropagation(); onToggleCompare(id); }}
              aria-pressed={compared}
              title={compared ? "Remove from Compare" : "Add to Compare"}
              style={{ borderColor: compared ? "#0ea5e9" : undefined, background: compared ? "#e0f2fe" : undefined }}
            >
              {compared ? "🆚 In Compare" : "➕ Compare"}
            </button>
          )}
        </div>
      </header>

      {/* Outbound */}
      {!!outSegs.length && (
        <div style={{ border: "1px solid #cfe3ff", borderRadius: 12, padding: 10, background: "#f7fbff", display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 700, color: "#0b3b52" }}>Outbound</div>
          {outSegs.map((s: any, i: number) => (
            <React.Fragment key={`o${i}`}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.from} → {s.to}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtDur(s.duration_minutes)}</div>
              </div>
              {i < outSegs.length - 1 && (
                <div className="layover"><span className="chip">⏳ Layover at {s.to}</span></div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Return */}
      {!!inSegs.length && (
        <div style={{ border: "1px solid #cfe3ff", borderRadius: 12, padding: 10, background: "#f7fbff", display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 700, color: "#0b3b52" }}>Return</div>
          {inSegs.map((s: any, i: number) => (
            <React.Fragment key={`i${i}`}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.from} → {s.to}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtDur(s.duration_minutes)}</div>
              </div>
              {i < inSegs.length - 1 && (
                <div className="layover"><span className="chip">⏳ Layover at {s.to}</span></div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
