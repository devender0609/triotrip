"use client";

import React from "react";

/** Airline homepages; fallback = Google "airline + booking" */
const AIRLINE_SITE: Record<string, string> = {
  American: "https://www.aa.com",
  "American Airlines": "https://www.aa.com",
  Delta: "https://www.delta.com",
  "Delta Air Lines": "https://www.delta.com",
  United: "https://www.united.com",
  "United Airlines": "https://www.united.com",
  Alaska: "https://www.alaskaair.com",
  "Alaska Airlines": "https://www.alaskaair.com",
  Southwest: "https://www.southwest.com",
  JetBlue: "https://www.jetblue.com",
  "JetBlue Airways": "https://www.jetblue.com",
  Lufthansa: "https://www.lufthansa.com",
  "Air Canada": "https://www.aircanada.com",
  "British Airways": "https://www.britishairways.com",
  "Air France": "https://wwws.airfrance.us",
  KLM: "https://www.klm.us",
};

type Props = {
  pkg: any;
  index?: number;
  currency: string;
  pax?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void;
  large?: boolean;
  showHotel?: boolean;
};

export default function ResultCard({
  pkg,
  index = 0,
  currency,
  pax = 1,
  comparedIds,
  onToggleCompare,
  onSavedChangeGlobal,
  large = true,
  showHotel,
}: Props) {
  const id = pkg.id || `r-${index}`;
  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || "Airline";
  const price =
    pkg.total_cost ?? pkg.flight_total ?? pkg.total_cost_flight ?? pkg.flight?.price ?? pkg.flight?.price_usd ?? 0;
  const outSegs = pkg.flight?.segments_out || [];
  const route = `${outSegs?.[0]?.from || pkg.origin}-${outSegs?.[outSegs.length - 1]?.to || pkg.destination}`;

  const isCompared = Array.isArray(comparedIds) ? comparedIds.includes(id) : false;
  const fs = large ? 16 : 14;

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: isCompared ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 12,
    fontSize: fs,
    boxShadow: isCompared ? "0 0 0 6px rgba(14,165,233,.12) inset" : "0 6px 18px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
    transform: isCompared ? "scale(1.01)" : "scale(1)",
    transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
  };

  // ----- external links (flights) -----
  const airlineSite = AIRLINE_SITE[airline] || `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;
  const googleFlights =
    `https://www.google.com/travel/flights?q=` +
    encodeURIComponent(`${(outSegs?.[0]?.from || pkg.origin || "").toUpperCase()} to ${(outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase()} on ${(pkg.departDate || "").slice(0,10)} for ${Math.max(1, (pkg.passengers || pax))} travelers`);

  return (
    <article
      data-offer-id={id}
      onClick={(e) => {
        if (onToggleCompare) {
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('a,button,input,select,textarea,[role="button"],[role="tab"],[role="link"]');
          if (!isInteractive) onToggleCompare(id);
        }
      }}
      style={cardStyle}
    >
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ fontSize: 18 }}>{airline}</strong>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ fontWeight: 800 }}>{route}</span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          {formatMoney(price, currency)}
        </div>
      </header>

      {/* Links row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={airlineSite} target="_blank" rel="noreferrer" style={chipBtn}>Airline site</a>
        <a href={googleFlights} target="_blank" rel="noreferrer" style={chipBtn}>Google Flights</a>
      </div>

      {/* (Hotels section left as in previous version if present in data) */}
      {(showHotel ?? !!(pkg.hotels || pkg.hotel)) && Array.isArray(pkg.hotels) && pkg.hotels.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 900, opacity: 0.8 }}>Hotels</div>
          <div style={{ fontSize: 14, opacity: 0.75 }}>Open a result to see hotel links with your dates & pax prefilled.</div>
        </div>
      )}
    </article>
  );
}

function formatMoney(n: number, c: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n); }
  catch { return `$${(n || 0).toFixed(0)}`; }
}

const chipBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontWeight: 900,
  fontSize: 14,
  textDecoration: "none",
  display: "inline-block",
};
