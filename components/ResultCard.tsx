"use client";

import React, { useMemo, useState } from "react";

/** quick map for common airline homepages; fallback = Google "airline + booking" */
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
  Lufthansa: "https://www.lufthansa.com",
  AirCanada: "https://www.aircanada.com",
  "Air Canada": "https://www.aircanada.com",
  British: "https://www.britishairways.com",
  "British Airways": "https://www.britishairways.com",
};

type Props = {
  pkg: any;
  index?: number;
  currency: string;
  pax?: number; // passed into TripTrio booking
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void;
  large?: boolean;
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
}: Props) {
  const id = pkg.id || `r-${index}`;
  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || "Airline";
  const price =
    pkg.total_cost ??
    pkg.flight_total ??
    pkg.total_cost_flight ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    0;

  const outSegs = pkg.flight?.segments_out || [];
  const inSegs = pkg.flight?.segments_in || [];
  const isRoundTrip = inSegs.length > 0;
  const stops =
    typeof pkg.flight?.stops === "number"
      ? pkg.flight.stops
      : Math.max(0, (outSegs.length || 1) - 1);

  // ---------- Deeplinks ----------
  const route = `${outSegs?.[0]?.from || pkg.origin}-${outSegs?.[outSegs.length - 1]?.to || pkg.destination}`;
  const dateOut = (outSegs?.[0]?.depart_time || "").slice(0, 10);
  const dateRet = (inSegs?.[0]?.depart_time || "").slice(0, 10);

  const googleFlights =
    `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(route)}%20on%20${encodeURIComponent(
      dateOut
    )}` + (dateRet ? `%20return%20${encodeURIComponent(dateRet)}` : "");

  const skyScanner =
    `https://www.skyscanner.com/transport/flights/${encodeURIComponent(route.replace("-", "/"))}/${dateOut}` +
    (dateRet ? `/${dateRet}` : "") +
    `/?adults=${pax}`;

  const airlineSite =
    AIRLINE_SITE[airline] ||
    `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;

  // ---------- Book via TrioTrip ----------
  async function bookViaTripTrio() {
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer: {
            currency: pkg.currency || currency,
            total_cost: price,
            flight: {
              carrier_name: airline,
              origin: outSegs?.[0]?.from || pkg.origin,
              destination: outSegs?.[outSegs.length - 1]?.to || pkg.destination,
              price_usd: price,
            },
            pax,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.bookingUrl) throw new Error(j?.error || "Failed to create booking");
      const url = new URL(j.bookingUrl);
      url.searchParams.set("pax", String(pax));
      url.searchParams.set("count", String(pax));
      window.location.href = url.toString();
    } catch (e: any) {
      alert(e?.message || "Booking failed");
    }
  }

  // ---------- Save (requires login) ----------
  const [saving, setSaving] = useState(false);
  function requireLoginThenSave() {
    const user = localStorage.getItem("triptrio:user");
    if (!user) {
      if (confirm("Please sign in to save this option. Go to login page now?")) {
        window.location.href = "/login";
      }
      return;
    }
    try {
      setSaving(true);
      const saved = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      const next = Array.isArray(saved) ? saved : [];
      if (!next.find((x: any) => x?.id === id)) next.push({ id, airline, price });
      localStorage.setItem("triptrio:saved", JSON.stringify(next));
      window.dispatchEvent(new Event("triptrio:saved:changed"));
      onSavedChangeGlobal?.(next.length);
    } finally {
      setSaving(false);
    }
  }

  const isCompared = comparedIds?.includes(id);

  // ---------- Hotels (pick best tier then show one row like screenshot) ----------
  const hotels: any[] = Array.isArray(pkg.hotels) ? pkg.hotels : [];
  const hotelTop3 = useMemo(() => {
    if (!hotels.length) return [] as any[];
    const arr = hotels.slice().sort((a,b)=> (Number(a?.price)||9e9) - (Number(b?.price)||9e9));
    return arr.slice(0,3);
  }, [hotels]);
  const hotelPick = useMemo(() => {
    if (!hotels.length) return null;
    // group by star (ES5-safe)
    const byStar = new Map<number, any[]>();
    for (let i = 0; i < hotels.length; i++) {
      const h = hotels[i];
      const s = Number(h?.stars) || 0;
      const arr = byStar.get(s) || [];
      arr.push(h);
      byStar.set(s, arr);
    }
    const entries: Array<[number, any[]]> = Array.from(byStar.entries()).sort((a, b) => b[0] - a[0]);
    const topTier = entries.find(Boolean)?.[1] || [];
    // choose cheapest in top tier
    let best = topTier[0];
    for (let i = 1; i < topTier.length; i++) {
      if ((topTier[i]?.price || 9e9) < (best?.price || 9e9)) best = topTier[i];
    }
    return best || null;
  }, [hotels]);

  // ---------- styles (larger like screenshot) ----------
  const fs = large ? 15 : 14;

  const chipBtn: React.CSSProperties = {
    textDecoration: "none",
    height: 32,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 800,
  };

  const buyBtn: React.CSSProperties = {
    ...chipBtn,
    border: "none",
    color: "#fff",
    fontWeight: 900,
    background: "linear-gradient(90deg,#06b6d4,#0ea5e9)",
  };

  return (
    <article
      data-offer-id={id}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 14,
        display: "grid",
        gap: 12,
        fontSize: fs,
        boxShadow: "0 6px 18px rgba(2,6,23,.06)",
      }}
    >
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <strong style={{ fontSize: 18 }}>{airline}</strong>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ fontWeight: 800 }}>{stops === 0 ? "Nonstop" : `${stops} stop(s)`}</span>
          {pkg.flight?.refundable && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 900, color: "#0f172a", background: "#e8efff", border: "1px solid #c7d2fe", borderRadius: 999, padding: "2px 8px" }}>
              Refundable
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onToggleCompare && (
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 900, color: "#334155" }}>
              <input type="checkbox" checked={!!isCompared} onChange={() => onToggleCompare(id)} />
              Compare
            </label>
          )}
          <button onClick={requireLoginThenSave} disabled={saving} style={chipBtn}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Price area (buttons moved to right column only) */}
<div style={{ fontWeight: 900, fontSize: 22 }}>
  {Math.round(Number(price))} {pkg.currency || currency}
</div>

      {/* Flight section */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Flight</div>

          {/* Outbound legs */}
          {outSegs.length > 0 && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 8, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, color: "#334155" }}>Outbound</div>
              {outSegs.map((s: any, i: number) => (
                <div key={`o${i}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between" }}>
                  <div>{s.from} → {s.to}</div>
                  <div style={{ fontWeight: 900 }}>{formatDur(s.duration_minutes)}</div>
                </div>
              ))}
              {isRoundTrip && outSegs.length > 1 &&
                outSegs.slice(0, -1).map((_s: any, i: number) => (
                  <div key={`ol${i}`} style={{ textAlign: "center", color: "#64748b", fontWeight: 800 }}>
                    Layover • ~{45 + i * 15}m
                  </div>
                ))}
            </div>
          )}

          {/* Return legs */}
          {inSegs.length > 0 && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 8, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, color: "#334155" }}>Return</div>
              {inSegs.map((s: any, i: number) => (
                <div key={`r${i}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between" }}>
                  <div>{s.from} → {s.to}</div>
                  <div style={{ fontWeight: 900 }}>{formatDur(s.duration_minutes)}</div>
                </div>
              ))}
              {inSegs.length > 1 &&
                inSegs.slice(0, -1).map((_s: any, i: number) => (
                  <div key={`rl${i}`} style={{ textAlign: "center", color: "#64748b", fontWeight: 800 }}>
                    Layover • ~{45 + i * 15}m
                  </div>
                ))}
            </div>
          )}

          {/* Hotel row (single, like screenshot) */}
          {hotelPick && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 8 }}>
              <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>Hotel</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 10, padding: 8 }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{hotelPick.name} ({hotelPick.stars}★)</div>
                </div>
                <div style={{ fontWeight: 900 }}>
                  {Math.round(hotelPick.price || 0)} {hotelPick.currency || pkg.currency || currency}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: booking buttons (Flight + Hotel) */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Book Flight</div>
            <button onClick={bookViaTripTrio} style={buyBtn}>Book via TrioTrip</button>
            <a href={airlineSite} target="_blank" rel="noreferrer" style={chipBtn}>Airline site</a>
            <a href={googleFlights} target="_blank" rel="noreferrer" style={chipBtn}>Google Flights</a>
            <a href={skyScanner} target="_blank" rel="noreferrer" style={chipBtn}>Skyscanner</a>
          </div>

          {hotelPick && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>Book Hotel</div>
              <a href="https://www.booking.com" target="_blank" rel="noreferrer" style={chipBtn}>Booking.com</a>
              <a href="https://www.hotels.com" target="_blank" rel="noreferrer" style={chipBtn}>Hotels.com</a>
              <a href="https://www.expedia.com" target="_blank" rel="noreferrer" style={chipBtn}>Expedia</a>
            </div>
          )}
        </div>
      </section>
    </article>
  );
}

function layoverMins(prevArr: string, nextDep: string) {
  const a = Date.parse(prevArr);
  const d = Date.parse(nextDep);
  if (!Number.isFinite(a) || !Number.isFinite(d) || d <= a) return undefined;
  return Math.round((d - a) / 60000);
}

function formatDur(min?: number) {
  const m = Number(min) || 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}
