// components/ResultCard.tsx
"use client";

import React from "react";

export interface ResultCardProps {
  pkg: any; // flight+hotel package from API
  index?: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
}

/** Helper: pick a displayable price string in the chosen currency */
function getDisplayPrice(pkg: any, currency: string): string {
  const cur = currency || "USD";

  // 1) direct match
  if (pkg.currency && pkg.total_price && pkg.currency === cur) {
    return `${cur} ${pkg.total_price}`;
  }

  // 2) generic map: price_by_currency[cur]
  if (
    pkg.price_by_currency &&
    typeof pkg.price_by_currency[cur] === "number"
  ) {
    return `${cur} ${Math.round(pkg.price_by_currency[cur])}`;
  }

  // 3) USD fallback
  if (pkg.price_usd && cur === "USD") {
    return `USD ${Math.round(pkg.price_usd)}`;
  }

  // 4) converted price field
  if (pkg.price_converted) {
    return `${cur} ${Math.round(pkg.price_converted)}`;
  }

  return `${cur} — price TBD`;
}

/** Helper: airline website */
function getAirlineSite(pkg: any): string {
  const name: string | undefined =
    pkg.carrier_name || pkg.airline || pkg.carrier;

  if (!name) {
    return "https://www.google.com/travel/flights";
  }

  const lower = name.toLowerCase();
  const map: Record<string, string> = {
    "american airlines": "https://www.aa.com",
    "delta air": "https://www.delta.com",
    "united airlines": "https://www.united.com",
    "southwest": "https://www.southwest.com",
    "lufthansa": "https://www.lufthansa.com",
    "air india": "https://www.airindia.com",
    "british airways": "https://www.britishairways.com",
    "emirates": "https://www.emirates.com",
    "qatar airways": "https://www.qatarairways.com",
    "air france": "https://wwws.airfrance.us",
  };

  for (const key of Object.keys(map)) {
    if (lower.includes(key)) return map[key];
  }

  // Fallback: search for official site
  return `https://www.google.com/search?q=${encodeURIComponent(
    name + " official site"
  )}`;
}

/** Helper: render segment list (outbound / return) if present */
function renderSegments(segments: any[] | undefined, label: string) {
  if (!Array.isArray(segments) || !segments.length) return null;

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 2,
          color: "#e5e7eb",
        }}
      >
        {label}
      </div>
      {segments.map((s, i) => {
        const from =
          s.from_code || s.origin || s.departure_airport || s.from || "?";
        const to =
          s.to_code || s.destination || s.arrival_airport || s.to || "?";
        const dep =
          s.departure_local || s.departure_time || s.depart || s.dep_time;
        const arr =
          s.arrival_local || s.arrival_time || s.arrive || s.arr_time;
        const airline = s.carrier_name || s.airline || "";
        const flightNo = s.flight_number || s.flight_no || s.number || "";
        const layover =
          s.layover_mins || s.layover_minutes || s.connection_time;

        return (
          <div
            key={i}
            style={{
              fontSize: 13.5,
              marginBottom: 4,
              color: "#cbd5f5",
            }}
          >
            <div>
              <strong>
                {from} → {to}
              </strong>{" "}
              {airline && (
                <span>
                  · {airline}
                  {flightNo ? ` ${flightNo}` : ""}
                </span>
              )}
            </div>
            <div style={{ opacity: 0.9 }}>
              {dep && arr ? `${dep} → ${arr}` : "Time to be confirmed"}
            </div>
            {layover && i < segments.length - 1 && (
              <div style={{ color: "#fde68a" }}>
                Layover ~ {Math.round(layover / 60)}h
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Helper: hotel list */
function renderHotels(pkg: any, showAllHotels: boolean) {
  const hotels: any[] = Array.isArray(pkg.hotels) ? pkg.hotels : [];
  if (!hotels.length) return <div>No hotel suggestions available.</div>;

  const subset = showAllHotels ? hotels : hotels.slice(0, 3);

  return (
    <ul
      style={{
        margin: "8px 0 0",
        paddingLeft: 18,
        listStyle: "disc",
        fontSize: 14,
        color: "#e5e7eb",
      }}
    >
      {subset.map((h, i) => {
        const price = h.price_converted || h.price || h.nightly_rate;
        const cur = h.currency || pkg.currency || "";
        const priceText =
          typeof price === "number" ? `${cur} ${Math.round(price)}` : "";

        const stars =
          typeof h.star === "number"
            ? `${h.star}★`
            : typeof h.stars === "number"
            ? `${h.stars}★`
            : "";

        return (
          <li key={i} style={{ marginBottom: 4 }}>
            <strong>{h.name}</strong>
            {stars && <span>{stars}</span>}
            {h.city && <span> · {h.city}</span>}
            {priceText && <div style={{ marginLeft: 2 }}>{priceText}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Main boxed card */
const ResultCard: React.FC<ResultCardProps> = ({
  pkg,
  index,
  currency,
  pax,
  showHotel,
  hotelNights,
  showAllHotels,
  comparedIds,
  onToggleCompare,
}) => {
  const id: string =
    pkg?.id?.toString() ?? pkg?.package_id?.toString() ?? String(index ?? 0);

  const inCompare = comparedIds.includes(id);
  const priceStr = getDisplayPrice(pkg, currency);
  const optionLabel = `OPTION ${typeof index === "number" ? index + 1 : ""}`;

  const headerGradient =
    "linear-gradient(90deg, #0ea5e9, #6366f1, #ec4899)";

  const carrierName = pkg.carrier_name || pkg.airline || "Flight";
  const duration =
    typeof pkg.duration_minutes === "number"
      ? `${Math.round(pkg.duration_minutes / 60)}h ${
          pkg.duration_minutes % 60
        }m`
      : undefined;
  const stops =
    typeof pkg.stops === "number"
      ? pkg.stops === 0
        ? "Non-stop"
        : `${pkg.stops} stop${pkg.stops > 1 ? "s" : ""}`
      : undefined;

  const outboundSegs = Array.isArray(pkg.segments_out)
    ? pkg.segments_out
    : undefined;
  const returnSegs = Array.isArray(pkg.segments_in)
    ? pkg.segments_in
    : undefined;

  const cabin = pkg.cabin || "ECONOMY";

  return (
    <article
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "#020617",
        color: "#e5e7eb",
        border: "1px solid #1f2937",
        boxShadow: "0 18px 40px rgba(15,23,42,0.85)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          background: headerGradient,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          color: "#f9fafb",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.15,
            }}
          >
            {optionLabel}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            ✈ {carrierName}
          </div>
          <div style={{ fontSize: 13.5 }}>
            {stops && <span>{stops}</span>}
            {stops && duration && <span> • </span>}
            {duration && <span>Total {duration}</span>}
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {currency} — total for {pax} traveler
            {pax > 1 ? "s" : ""}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {priceStr}
          </div>
          {showHotel && (
            <div
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.35)",
                border: "1px solid rgba(15,23,42,0.5)",
              }}
            >
              🏨 {hotelNights} nights hotel bundle
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
          gap: 16,
          padding: 18,
        }}
      >
        {/* HOTEL COLUMN */}
        <div
          style={{
            borderRadius: 18,
            background: "#020617",
            border: "1px solid #1e293b",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.25,
              marginBottom: 6,
            }}
          >
            🏨 Hotel bundle
          </div>
          {showHotel ? (
            <>
              <div style={{ fontSize: 14.5, marginBottom: 4 }}>
                {pkg.hotel_area || pkg.hotel_label || "Airport Suites"}
              </div>
              {renderHotels(pkg, showAllHotels)}
            </>
          ) : (
            <div style={{ fontSize: 14.5, color: "#cbd5f5" }}>
              This option focuses on flights only. You can add hotels
              separately.
            </div>
          )}
        </div>

        {/* FLIGHT COLUMN */}
        <div
          style={{
            borderRadius: 18,
            background: "#020617",
            border: "1px solid #1e293b",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.25,
              marginBottom: 4,
            }}
          >
            ✈ Flight details
          </div>
          <div style={{ fontSize: 14.5, marginBottom: 6 }}>
            Cabin: {cabin}
          </div>

          {renderSegments(outboundSegs, "Outbound")}
          {renderSegments(returnSegs, "Return")}

          {!outboundSegs && !returnSegs && (
            <div
              style={{
                fontSize: 14.5,
                marginTop: 4,
                color: "#cbd5f5",
              }}
            >
              Live flight details will appear here once available from our
              partners.
            </div>
          )}
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div
        style={{
          padding: "10px 18px 16px",
          borderTop: "1px dashed #1e293b",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: main CTAs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            onClick={() => onToggleCompare(id)}
            style={{
              borderRadius: 999,
              padding: "7px 14px",
              border: "1px solid #1f2937",
              background: inCompare ? "#0f766e" : "#020617",
              color: "#e5e7eb",
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            {inCompare ? "In compare list" : "Compare"}
          </button>

          <a
            href={
              pkg.deeplinks?.google_flights ||
              "https://www.google.com/travel/flights"
            }
            target="_blank"
            rel="noreferrer"
            style={{
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 13.5,
              textDecoration: "none",
              border: "none",
              background: "#0f172a",
              color: "#e5e7eb",
            }}
          >
            ✈ Google Flights
          </a>

          <a
            href={
              pkg.deeplinks?.booking ||
              "https://www.booking.com/flights/index.en-gb.html"
            }
            target="_blank"
            rel="noreferrer"
            style={{
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 13.5,
              textDecoration: "none",
              border: "none",
              background: "#16a34a",
              color: "#f9fafb",
            }}
          >
            🛏 Booking.com
          </a>
        </div>

        {/* Right: secondary links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11.5, opacity: 0.8 }}>
            Prices and availability are examples and may change at booking.
          </span>
        </div>
      </div>

      {/* Extra rows of brand chips under main footer */}
      <div
        style={{
          padding: "0 18px 14px",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "space-between",
          fontSize: 12.5,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ opacity: 0.85 }}>More flight options</span>
          <a
            href="https://www.skyscanner.com/"
            target="_blank"
            rel="noreferrer"
            style={chipStyle}
          >
            Skyscanner
          </a>
          <a
            href="https://www.kayak.com/flights"
            target="_blank"
            rel="noreferrer"
            style={chipStyle}
          >
            KAYAK
          </a>
          <a
            href={getAirlineSite(pkg)}
            target="_blank"
            rel="noreferrer"
            style={chipStyle}
          >
            Airline sites
          </a>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ opacity: 0.85 }}>More hotel options</span>
          <a
            href="https://www.expedia.com/Hotels"
            target="_blank"
            rel="noreferrer"
            style={chipStyle}
          >
            Expedia
          </a>
          <a
            href="https://www.hotels.com/"
            target="_blank"
            rel="noreferrer"
            style={chipStyle}
          >
            Hotels.com
          </a>
        </div>
      </div>
    </article>
  );
};

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "4px 10px",
  border: "1px solid #1e293b",
  background: "#020617",
  color: "#e5e7eb",
  textDecoration: "none",
};

export default ResultCard;
