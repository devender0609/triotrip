"use client";

import React, { useMemo, useState, useEffect } from "react";

/* ================== Types (loose to match your API) ================== */
type Segment = {
  carrier?: string;            // "AA"
  carrierName?: string;        // "American Airlines"
  flightNumber?: string;       // "123"
  depart?: string;             // ISO "2025-10-30T06:00:00"
  arrive?: string;             // ISO
  origin?: string;             // "AUS"
  destination?: string;        // "CLT"
  duration_minutes?: number;
  layover_minutes?: number;
};

type Flight = {
  segments_out?: Segment[];
  segments_return?: Segment[];
  price_usd?: number;
  price_usd_converted?: number;
  refundable?: boolean;
};

type Hotel = {
  id?: string;
  name?: string;
  city?: string;
  stars?: number;
  price_per_night?: number;      // preferred field if present
  total_price?: number;          // fallback
  image?: string;
  links?: {
    booking?: string;
    expedia?: string;
    hotels?: string;
    map?: string;
  };
};

type Pkg = {
  id?: string;
  title?: string;
  total_cost?: number;
  flight_total?: number;
  hotel_total?: number;
  flight?: Flight;
  hotels?: Hotel[];

  /* ✅ TS fix: these are added so expedia link can use them */
  hotelCheckIn?: string;
  hotelCheckOut?: string;

  // search context (attached by page.tsx when saving results)
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string | undefined;
  roundTrip?: boolean;
  passengersAdults?: number;
  passengersChildren?: number;
  passengersInfants?: number;
  cabin?: string;
};

type Props = {
  pkg: Pkg;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;    // true => unlimited per star, false => 3 per star
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal?: () => void; // header counter bump if you listen for it
};

/* ================== Helpers ================== */
function money(n?: number, cur = "USD") {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${cur} ${Math.round(n)}`;
  }
}
function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function minutesToHhMm(m?: number) {
  if (!m && m !== 0) return "";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}
function sumMinutes(segs: Segment[] | undefined) {
  if (!segs?.length) return 0;
  return segs.reduce((t, s) => t + (s.duration_minutes || 0), 0);
}

/* -------- Prefilled deep links -------- */
function gfUrl(pkg: Pkg) {
  const o = pkg.origin;
  const d = pkg.destination;
  const dep = pkg.departDate;
  const ret = pkg.roundTrip ? pkg.returnDate : undefined;
  const pax =
    (pkg.passengersAdults ?? 1) +
    (pkg.passengersChildren ?? 0) +
    (pkg.passengersInfants ?? 0);
  const cabinMap: Record<string, string> = {
    ECONOMY: "e",
    PREMIUM_ECONOMY: "p",
    BUSINESS: "b",
    FIRST: "f",
  };
  const c = cabinMap[(pkg.cabin || "ECONOMY").toUpperCase()] || "e";
  const base = `https://www.google.com/travel/flights`;
  const legs = ret ? `${o}.${d}.${dep}*${d}.${o}.${ret}` : `${o}.${d}.${dep}`;
  return `${base}?q=${encodeURIComponent(
    `${o}-${d}`
  )}&tt=${encodeURIComponent(legs)}&tp=${c}&ap=${pax}`;
}

function skyscannerUrl(pkg: Pkg) {
  const o = pkg.origin;
  const d = pkg.destination;
  const dep = pkg.departDate?.replaceAll("-", "");
  const ret = pkg.roundTrip && pkg.returnDate ? pkg.returnDate.replaceAll("-", "") : "";
  const pax =
    (pkg.passengersAdults ?? 1) +
    (pkg.passengersChildren ?? 0) +
    (pkg.passengersInfants ?? 0);

  const cabinMap: Record<string, string> = {
    ECONOMY: "economy",
    PREMIUM_ECONOMY: "premiumeconomy",
    BUSINESS: "business",
    FIRST: "first",
  };
  const c = cabinMap[(pkg.cabin || "ECONOMY").toUpperCase()] || "economy";

  return ret
    ? `https://www.skyscanner.com/transport/flights/${o}/${d}/${dep}/${ret}/?adults=${pax}&cabinclass=${c}`
    : `https://www.skyscanner.com/transport/flights/${o}/${d}/${dep}/?adults=${pax}&cabinclass=${c}`;
}

function expediaHotelUrl(h: Hotel, nights: number, checkIn?: string, checkOut?: string) {
  // If we have city + dates, build a prefilled search; otherwise fall back to provided link.
  if (checkIn && checkOut && h.city) {
    return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(
      h.city
    )}&startDate=${checkIn}&endDate=${checkOut}&adults=2`;
  }
  return h.links?.expedia || "#";
}

/* -------- localStorage “saved” helpers -------- */
const SAVE_KEY = "triptrio:saved";
function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
  } catch {
    return [];
  }
}
function setSavedIds(ids: string[]) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("triptrio:saved-count"));
  } catch {}
}

/* ================== Component ================== */
export default function ResultCard({
  pkg,
  index,
  currency,
  pax,
  showHotel,
  hotelNights,
  showAllHotels,
  comparedIds,
  onToggleCompare,
  onSavedChangeGlobal,
}: Props) {
  const cardId = String(pkg.id ?? `pkg-${index}`);

  /* ---- Save state ---- */
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    const arr = getSavedIds();
    setIsSaved(arr.includes(cardId));
  }, [cardId]);
  useEffect(() => {
    const h = () => onSavedChangeGlobal?.();
    window.addEventListener("triptrio:saved-count", h);
    return () => window.removeEventListener("triptrio:saved-count", h);
  }, [onSavedChangeGlobal]);

  function toggleSave() {
    const arr = getSavedIds();
    if (arr.includes(cardId)) {
      const next = arr.filter((x) => x !== cardId);
      setSavedIds(next);
      setIsSaved(false);
    } else {
      const next = [...arr, cardId];
      setSavedIds(next);
      setIsSaved(true);
    }
    onSavedChangeGlobal?.();
  }

  /* ---- Flights summary ---- */
  const outSegs = pkg.flight?.segments_out || [];
  const retSegs = pkg.flight?.segments_return || [];
  const outDur = sumMinutes(outSegs);
  const retDur = sumMinutes(retSegs);

  // Airline names (first segment carrier names shown)
  const outboundAirline =
    outSegs[0]?.carrierName || outSegs[0]?.carrier || "Flight";
  const returnAirline =
    retSegs[0]?.carrierName || retSegs[0]?.carrier || undefined;

  /* ---- Hotels display logic ---- */
  // Group by star rating then limit per star depending on Top-3 vs All
  const hotelsByStar = useMemo(() => {
    if (!showHotel || !pkg.hotels?.length) return [];
    const groups = new Map<number, Hotel[]>();
    pkg.hotels.forEach((h) => {
      const s = h.stars ?? 0;
      groups.set(s, [...(groups.get(s) || []), h]);
    });
    const limitPerStar = showAllHotels ? Number.POSITIVE_INFINITY : 3;
    const sortedStars = [...groups.keys()].sort((a, b) => b - a);

    const rows: { stars: number; items: Hotel[] }[] = [];
    for (const s of sortedStars) {
      const items = (groups.get(s) || []).slice(0, limitPerStar);
      if (items.length) rows.push({ stars: s, items });
    }
    return rows;
  }, [pkg.hotels, showHotel, showAllHotels]);

  /* ---- Styles (kept inline to avoid global/layout changes) ---- */
  const wrap: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  };

  const chip: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "4px 10px",
    fontWeight: 700,
    fontSize: 12,
    background: "#fff",
  };

  const layoverBadge: React.CSSProperties = {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: "6px 10px",
    fontSize: 12,
    background:
      "linear-gradient(135deg, rgba(2,132,199,0.08), rgba(2,132,199,0.02))",
  };

  /* ---- Render ---- */
  return (
    <div style={wrap}>
      {/* header row: price & actions */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontWeight: 800 }}>
            {money(pkg.total_cost || pkg.flight_total || pkg.hotel_total, currency)}
          </span>
          <span style={{ ...chip }}>Pax {pax}</span>
          {pkg.flight?.refundable ? (
            <span style={{ ...chip, borderColor: "#22c55e" }}>Refundable</span>
          ) : (
            <span style={{ ...chip }}>Non-refundable</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={toggleSave}
            title={isSaved ? "Remove from Saved" : "Save this option"}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: isSaved ? "#fef3c7" : "#fff",
              padding: "8px 10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isSaved ? "Saved ✓" : "Save"}
          </button>

          <button
            onClick={() => onToggleCompare(cardId)}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: comparedIds.includes(cardId) ? "#dbeafe" : "#fff",
              padding: "8px 10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Add to compare"
          >
            {comparedIds.includes(cardId) ? "✓ Compared" : "+ Compare"}
          </button>
        </div>
      </div>

      {/* flights */}
      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {/* outbound */}
        {!!outSegs.length && (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              Outbound — {outSegs[0]?.origin} →{" "}
              {outSegs[outSegs.length - 1]?.destination} ({minutesToHhMm(outDur)}
              ) · {outboundAirline}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {outSegs.map((s, i) => {
                const next = outSegs[i + 1];
                const lay = next?.layover_minutes ?? 0;
                return (
                  <div key={`out-${i}`} style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <strong>
                        {s.origin} {fmtTime(s.depart)} →
                        {s.destination} {fmtTime(s.arrive)}
                      </strong>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {s.carrierName || s.carrier} {s.flightNumber}
                      </span>
                      <span style={{ ...chip }}>{minutesToHhMm(s.duration_minutes)}</span>
                    </div>

                    {/* fancy layover badge */}
                    {lay > 0 && (
                      <div style={{ ...layoverBadge, display: "inline-flex", gap: 6 }}>
                        <span>⏱ Layover in {s.destination}</span>
                        <strong>{minutesToHhMm(lay)}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* return */}
        {!!retSegs.length && (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              Return — {retSegs[0]?.origin} →{" "}
              {retSegs[retSegs.length - 1]?.destination} ({minutesToHhMm(retDur)}
              ){returnAirline ? ` · ${returnAirline}` : ""}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {retSegs.map((s, i) => {
                const next = retSegs[i + 1];
                const lay = next?.layover_minutes ?? 0;
                return (
                  <div key={`ret-${i}`} style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <strong>
                        {s.origin} {fmtTime(s.depart)} →
                        {s.destination} {fmtTime(s.arrive)}
                      </strong>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {s.carrierName || s.carrier} {s.flightNumber}
                      </span>
                      <span style={{ ...chip }}>{minutesToHhMm(s.duration_minutes)}</span>
                    </div>
                    {lay > 0 && (
                      <div style={{ ...layoverBadge, display: "inline-flex", gap: 6 }}>
                        <span>⏱ Layover in {s.destination}</span>
                        <strong>{minutesToHhMm(lay)}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* booking links — prefilled */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <a className="btn" href={gfUrl(pkg)} target="_blank" rel="noreferrer">
          Google Flights
        </a>
        <a className="btn" href={skyscannerUrl(pkg)} target="_blank" rel="noreferrer">
          Skyscanner
        </a>
        <style jsx>{`
          .btn {
            display: inline-block;
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            font-weight: 700;
            background: #fff;
          }
          .btn:hover {
            background: #f8fafc;
          }
        `}</style>
      </div>

      {/* hotels */}
      {showHotel && hotelsByStar.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Hotels {hotelNights ? `(${hotelNights} night${hotelNights > 1 ? "s" : ""})` : ""}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {hotelsByStar.map(({ stars, items }) => (
              <div key={`star-${stars}`} style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{stars}★ options</div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  }}
                >
                  {items.map((h, i) => {
                    const perNight =
                      h.price_per_night ??
                      (h.total_price && hotelNights > 0
                        ? Math.round((h.total_price || 0) / hotelNights)
                        : undefined);

                    return (
                      <div
                        key={h.id || `${stars}-${i}`}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 10,
                          background: "#fff",
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{h.name}</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          {h.city || ""} • {stars}★
                        </div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>
                          {perNight != null ? `${money(perNight, currency)}/night` : "—"}
                        </div>

                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {h.links?.booking && (
                            <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">Booking.com</a>
                          )}
                          <a
                            className="btn"
                            href={expediaHotelUrl(h, hotelNights, pkg.hotelCheckIn, pkg.hotelCheckOut)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Expedia
                          </a>
                          {h.links?.hotels && (
                            <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">Hotels</a>
                          )}
                          {h.links?.map && (
                            <a className="btn" href={h.links.map} target="_blank" rel="noreferrer">Map</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
