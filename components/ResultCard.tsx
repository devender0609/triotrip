"use client";

import React from "react";
import { Plane, Hotel, ExternalLink } from "lucide-react";

export interface ResultCardProps {
  pkg: any;
  index: number;
  currency: string;
  pax?: number;
  showHotel?: boolean;
  hotelNights?: number;
  showAllHotels?: boolean;
  comparedIds?: any[];
  onToggleCompare?: (id: any) => void;
  onSavedChangeGlobal?: () => void;
}

type FlightLeg = {
  from?: string;
  to?: string;
  departure?: string;
  arrival?: string;
  airline?: string;
  flightNumber?: string;
  duration?: string;
};

type LayoverInfo = {
  airport?: string;
  duration?: string;
};

type FlightDirection = {
  summary?: string;
  legs?: FlightLeg[];
  layovers?: LayoverInfo[];
};

type HotelBundle = {
  name?: string;
  priceText?: string;
  nightsText?: string;
  hotels?: any[];
};

/* ---------- shared styles ---------- */

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  backgroundColor: "#020617",
  border: "1px solid #1f2937",
  color: "#f9fafb",
  marginBottom: 24,
  overflow: "hidden",
  boxShadow: "0 24px 60px rgba(15,23,42,0.65)",
};

const headerStyle: React.CSSProperties = {
  padding: "14px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundImage: "linear-gradient(90deg, #0ea5e9, #6366f1, #ec4899)",
  color: "white",
};

const headerLeft: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const headerTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
};

const headerTitleText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  opacity: 0.9,
};

const headerSubText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  opacity: 0.95,
};

const headerRouteStyle: React.CSSProperties = {
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const headerPriceStyle: React.CSSProperties = {
  textAlign: "right",
};

const headerPriceTextStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 11,
  border: "1px solid rgba(255,255,255,0.5)",
  marginTop: 4,
  backgroundColor: "rgba(15,23,42,0.3)",
};

const bodyStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  padding: "16px 20px 8px",
};

const columnStyle: React.CSSProperties = {
  flex: "1 1 250px",
  borderRadius: 18,
  backgroundColor: "rgba(15,23,42,0.9)",
  border: "1px solid #1f2937",
  padding: 14,
  minWidth: 0,
};

const sectionTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const sectionTitleText: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const textSm: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
};

const labelSm: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
};

const listStyle: React.CSSProperties = {
  marginTop: 8,
  paddingLeft: 16,
  fontSize: 12,
};

const footerStyle: React.CSSProperties = {
  padding: "6px 20px 14px",
  borderTop: "1px solid #0f172a",
};

const footerRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
  fontSize: 11,
};

const pillButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  borderRadius: 999,
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(15,23,42,0.5)",
};

const chipLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 600,
  textDecoration: "none",
  border: "1px solid #1f2937",
};

/* ---------- helpers ---------- */

function minutesToDuration(min?: number): string | undefined {
  if (min == null || Number.isNaN(min)) return undefined;
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function extractDateOnly(str?: string): string | undefined {
  if (!str) return undefined;
  const parts = str.split(/[T ]/);
  if (!parts[0]) return undefined;
  return parts[0];
}

/** For Skyscanner we need yyyymmdd */
function formatAsYyyymmdd(date?: string): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Convert segments_out / segments_in style arrays into FlightDirection */
function deriveDirectionFromSegments(segments: any[]): FlightDirection {
  if (!Array.isArray(segments) || segments.length === 0) return {};

  const legs: FlightLeg[] = segments.map((s) => ({
    from: s.from || s.origin || s.departure_airport,
    to: s.to || s.destination || s.arrival_airport,
    departure: s.departure || s.departure_time || s.dep_time,
    arrival: s.arrival || s.arrival_time || s.arr_time,
    airline: s.airline || s.carrier_name || s.carrier,
    flightNumber: s.flightNumber || s.flight_number || s.number,
    duration:
      s.duration ||
      minutesToDuration(s.duration_minutes) ||
      minutesToDuration(s.duration_min),
  }));

  const layovers: LayoverInfo[] =
    legs.length > 1
      ? legs.slice(0, -1).map((leg) => ({
          airport: leg.to,
        }))
      : [];

  return { legs, layovers };
}

/** Build one-line summary from “segments_*” style object */
function buildSummaryFromSegments(obj: any): string {
  if (!obj || typeof obj !== "object") return "";

  const carrier = obj.carrier_name || obj.carrier || "";
  const stops = typeof obj.stops === "number" ? obj.stops : undefined;
  const segOut = Array.isArray(obj.segments_out) ? obj.segments_out : [];
  const segIn = Array.isArray(obj.segments_in) ? obj.segments_in : [];

  const pickRoute = (segments: any[]) => {
    if (!segments.length) return "";
    const first = segments[0];
    const last = segments[segments.length - 1];
    if (first.from && last.to) return `${first.from} → ${last.to}`;
    return "";
  };

  const outRoute = pickRoute(segOut);
  const inRoute = pickRoute(segIn);
  const dur = minutesToDuration(obj.duration_minutes);

  const parts: string[] = [];

  if (outRoute) parts.push(`Outbound: ${outRoute}`);
  if (inRoute) parts.push(`Return: ${inRoute}`);
  if (stops !== undefined) {
    parts.push(stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? "s" : ""}`);
  }
  if (dur) parts.push(dur);
  if (carrier) parts.push(carrier);

  if (!parts.length) return "";
  return parts.join(" • ");
}

/** Always return a string – never an object – for generic flight text */
function getGenericFlightText(pkg: any): string {
  const stringCandidates = [
    pkg.flightDetails,
    pkg.flight_details,
    pkg.flightsText,
    pkg.flights_text,
    pkg.itinerary,
    pkg.itinerary_text,
  ];

  for (const c of stringCandidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  if (pkg.flight && typeof pkg.flight === "object") {
    const summary = buildSummaryFromSegments(pkg.flight);
    if (summary) return summary;
  }

  if (pkg.flights && typeof pkg.flights === "object") {
    const summary = buildSummaryFromSegments(pkg.flights);
    if (summary) return summary;
  }

  return "";
}

/** Google Flights link */
function buildFlightSearchUrl(
  origin: string,
  dest: string,
  depart?: string,
  ret?: string
) {
  const qParts = ["Flights", "from", origin || "origin", "to", dest || "destination"];
  if (depart) qParts.push("on", depart);
  if (ret) qParts.push("return", ret);
  const q = encodeURIComponent(qParts.join(" "));
  return `https://www.google.com/travel/flights?q=${q}`;
}

/* ---------- component ---------- */

const ResultCard: React.FC<ResultCardProps> = ({ pkg, index, currency }) => {
  if (!pkg) return null;

  const optionNumber = index + 1;

  const routeOverride = pkg.route || pkg.routeText || pkg.route_text || "";

  const totalPrice =
    pkg.totalPrice ??
    pkg.price ??
    pkg.amount ??
    pkg.price_converted ??
    pkg.total_price_converted ??
    null;

  const priceText =
    pkg.priceText ||
    pkg.price_text ||
    pkg.displayPrice ||
    pkg.display_price ||
    pkg.totalPriceText ||
    pkg.total_price_text ||
    (totalPrice != null
      ? `${currency} ${String(totalPrice)}`
      : `${currency} — price TBD`);

  const totalNightsText =
    pkg.totalNightsText ||
    pkg.total_nights_text ||
    (pkg.nights ? `${pkg.nights} nights hotel` : "") ||
    (pkg.hotelNights ? `${pkg.hotelNights} nights hotel` : "") ||
    "Trip bundle";

  const hotelBundleRaw: any =
    pkg.hotelBundle || pkg.hotel || pkg.hotels || {};

  const hotelBundle: HotelBundle = {
    name:
      hotelBundleRaw.name ||
      pkg.hotelName ||
      pkg.primaryHotel ||
      "Curated stay close to main attractions",
    priceText:
      hotelBundleRaw.priceText ||
      hotelBundleRaw.price_text ||
      pkg.hotelPriceText ||
      pkg.hotel_price_text,
    nightsText:
      hotelBundleRaw.nightsText ||
      hotelBundleRaw.nights_text ||
      (pkg.hotelNights ? `${pkg.hotelNights} nights` : undefined),
    hotels: Array.isArray(hotelBundleRaw.hotels)
      ? hotelBundleRaw.hotels
      : Array.isArray(pkg.hotels)
      ? pkg.hotels
      : [],
  };

  const rawFlight: any = pkg.flight || pkg.flightInfo || pkg.flights || {};
  let outbound: FlightDirection | undefined =
    rawFlight.outbound ||
    rawFlight.outboundFlight ||
    (Array.isArray(rawFlight.segments_out)
      ? deriveDirectionFromSegments(rawFlight.segments_out)
      : undefined) ||
    pkg.outbound;

  let inbound: FlightDirection | undefined =
    rawFlight.inbound ||
    rawFlight.returnFlight ||
    (Array.isArray(rawFlight.segments_in)
      ? deriveDirectionFromSegments(rawFlight.segments_in)
      : undefined) ||
    pkg.inbound;

  const outboundLegs: FlightLeg[] = Array.isArray(outbound?.legs)
    ? outbound!.legs!
    : [];
  const inboundLegs: FlightLeg[] = Array.isArray(inbound?.legs)
    ? inbound!.legs!
    : [];

  const outboundLayovers: LayoverInfo[] =
    (Array.isArray(outbound?.layovers) && outbound!.layovers!.length
      ? outbound!.layovers!
      : outboundLegs.length > 1
      ? outboundLegs.slice(0, -1).map((leg) => ({
          airport: leg.to,
        }))
      : []) ?? [];

  const inboundLayovers: LayoverInfo[] =
    (Array.isArray(inbound?.layovers) && inbound!.layovers!.length
      ? inbound!.layovers!
      : inboundLegs.length > 1
      ? inboundLegs.slice(0, -1).map((leg) => ({
          airport: leg.to,
        }))
      : []) ?? [];

  const hasDetailedOutbound = outboundLegs.length > 0;
  const hasDetailedInbound = inboundLegs.length > 0;

  const totalDuration =
    rawFlight.totalDuration ||
    pkg.totalDuration ||
    pkg.total_duration ||
    minutesToDuration(rawFlight.duration_minutes);

  const cabin =
    rawFlight.cabin ||
    pkg.cabin ||
    pkg.cabin_class ||
    rawFlight.cabin_class;

  const fallbackOutboundText =
    pkg.outboundText ||
    pkg.outbound_text ||
    pkg.flightSummary ||
    pkg.flight_summary ||
    pkg.flightText ||
    pkg.flight_text ||
    pkg.outboundSummary ||
    pkg.outbound_summary ||
    "";

  const fallbackInboundText =
    pkg.returnText ||
    pkg.return_text ||
    pkg.inboundText ||
    pkg.inbound_text ||
    pkg.returnSummary ||
    pkg.return_summary ||
    pkg.inboundSummary ||
    pkg.inbound_summary ||
    "";

  const genericFlightText = getGenericFlightText(pkg);

  const mainAirline =
    pkg.carrier_name ||
    rawFlight.carrier_name ||
    outboundLegs[0]?.airline ||
    inboundLegs[0]?.airline ||
    "";

  const departDate =
    extractDateOnly(
      pkg.departDate ||
        pkg.departureDate ||
        outboundLegs[0]?.departure ||
        rawFlight.departureDate
    ) || undefined;

  const origin =
    pkg.origin ||
    pkg.from ||
    outboundLegs[0]?.from ||
    rawFlight.origin ||
    "";

  const destination =
    pkg.destination ||
    pkg.to ||
    outboundLegs[outboundLegs.length - 1]?.to ||
    rawFlight.destination ||
    "";

  const returnDate =
    extractDateOnly(
      pkg.returnDate ||
        pkg.return_date ||
        inboundLegs[0]?.departure ||
        rawFlight.returnDate
    ) || undefined;

  /* ---------- external URLs (no Google except Google Flights) ---------- */

  const googleFlightsUrl = buildFlightSearchUrl(
    origin,
    destination,
    departDate,
    returnDate
  );

  const departYmd = formatAsYyyymmdd(departDate);
  const returnYmd = formatAsYyyymmdd(returnDate);

  const skyscannerUrl =
    origin && destination && departYmd
      ? `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${departYmd}/${returnYmd || ""}?adults=1&cabinclass=economy`
      : "https://www.skyscanner.com/transport/flights";

  const kayakUrl =
    origin && destination && departDate
      ? `https://www.kayak.com/flights/${origin}-${destination}/${departDate}${
          returnDate ? "/" + returnDate : ""
        }?sort=bestflight_a`
      : "https://www.kayak.com/flights";

  // UPDATED: Airline sites now use a working Kayak route with airline filter
  const airlineSitesUrl =
    origin && destination && departDate
      ? `https://www.kayak.com/flights/${origin}-${destination}/${departDate}${
          returnDate ? "/" + returnDate : ""
        }?fs=airlines`
      : "https://www.kayak.com/flights";

  const bookingUrl =
    "https://www.booking.com/searchresults.html?ss=" +
    encodeURIComponent(destination || origin || "your destination") +
    (departDate && returnDate
      ? `&checkin=${encodeURIComponent(
          departDate
        )}&checkout=${encodeURIComponent(returnDate)}`
      : "");

  const expediaUrl =
    "https://www.expedia.com/Hotel-Search?destination=" +
    encodeURIComponent(destination || origin || "Your destination") +
    (departDate ? `&startDate=${encodeURIComponent(departDate)}` : "") +
    (returnDate ? `&endDate=${encodeURIComponent(returnDate)}` : "") +
    "&rooms=1&adults=2";

  const hotelsUrl =
    "https://www.hotels.com/Hotel-Search?destination=" +
    encodeURIComponent(destination || origin || "Your destination") +
    (departDate ? `&checkIn=${encodeURIComponent(departDate)}` : "") +
    (returnDate ? `&checkOut=${encodeURIComponent(returnDate)}` : "") +
    "&rooms=1&adults=2";

  /* ---------- header labels ---------- */

  const headerRouteLabel =
    hasDetailedOutbound && outboundLegs.length > 0
      ? `${outboundLegs[0]?.from} → ${
          outboundLegs[outboundLegs.length - 1]?.to
        }`
      : outbound?.summary
      ? outbound.summary
      : routeOverride || "Flight route";

  const headerSubLabelParts: string[] = [];
  if (mainAirline) headerSubLabelParts.push(mainAirline);
  if (departDate) headerSubLabelParts.push(departDate);
  if (totalDuration) headerSubLabelParts.push(totalDuration);
  const headerSubLabel = headerSubLabelParts.join(" • ");

  const titleText = `Option ${optionNumber}`;

  /* ----- helpers to render hotel list safely ----- */

  const renderHotelRow = (hotel: any, i: number) => {
    if (hotel == null) return null;

    if (typeof hotel === "string" || typeof hotel === "number") {
      return (
        <li key={i} style={{ marginBottom: 2 }}>
          {String(hotel)}
        </li>
      );
    }

    if (typeof hotel === "object") {
      const name = hotel.name || "Hotel";
      const star = hotel.star ? `${hotel.star}★` : "";
      const city = hotel.city || "";
      const price =
        hotel.price_converted && hotel.currency
          ? `${hotel.price_converted} ${hotel.currency}`
          : "";
      const deeplink: string | undefined =
        hotel.deeplinks?.[0] || hotel.deeplink || hotel.url || undefined;

      return (
        <li key={i} style={{ marginBottom: 6 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              borderRadius: 12,
              padding: "6px 8px",
              backgroundColor: "#020617",
              border: "1px solid #1e293b",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                {star && <span style={{ marginRight: 4 }}>{star}</span>}
                {city}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
              }}
            >
              {price && (
                <span style={{ fontWeight: 600, color: "#4ade80" }}>
                  {price}
                </span>
              )}
              {deeplink && (
                <a
                  href={deeplink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...chipLink,
                    borderColor: "#0ea5e9",
                    color: "#e0f2fe",
                    backgroundColor: "#0f172a",
                  }}
                >
                  View deal
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </li>
      );
    }

    return (
      <li key={i} style={{ marginBottom: 2 }}>
        {String(hotel)}
      </li>
    );
  };

  /* ---------- render ---------- */

  return (
    <div style={cardStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div style={headerLeft}>
          <div style={headerTitleRow}>
            <div style={headerTitleText}>{titleText}</div>
            {headerSubLabel && (
              <div style={headerSubText}>{headerSubLabel}</div>
            )}
          </div>
          <div style={headerRouteStyle}>
            <Plane size={14} />
            {headerRouteLabel}
          </div>
        </div>

        <div style={headerPriceStyle}>
          <div style={headerPriceTextStyle}>{priceText}</div>
          <div style={chipStyle}>{totalNightsText}</div>
        </div>
      </div>

      {/* BODY */}
      <div style={bodyStyle}>
        {/* HOTEL COLUMN */}
        <section style={columnStyle}>
          <div style={sectionTitleRow}>
            <Hotel size={18} color="#fb923c" />
            <div style={sectionTitleText}>Hotel bundle</div>
          </div>

          <div style={textSm}>
            <div style={{ fontWeight: 600 }}>{hotelBundle.name}</div>
            {hotelBundle.priceText && (
              <div style={{ marginTop: 2, color: "#4ade80", fontSize: 12 }}>
                {hotelBundle.priceText}
              </div>
            )}
            {hotelBundle.nightsText && (
              <div style={{ marginTop: 2, fontSize: 12 }}>
                {hotelBundle.nightsText}
              </div>
            )}
          </div>

          {Array.isArray(hotelBundle.hotels) &&
            hotelBundle.hotels.length > 0 && (
              <ul style={listStyle}>
                {hotelBundle.hotels.map(renderHotelRow)}
              </ul>
            )}
        </section>

        {/* FLIGHT COLUMN */}
        <section style={columnStyle}>
          <div style={sectionTitleRow}>
            <Plane size={18} color="#38bdf8" />
            <div style={sectionTitleText}>Flight details</div>
          </div>

          {/* OUTBOUND */}
          <div style={{ marginBottom: 10 }}>
            <div style={labelSm}>Outbound</div>

            {outbound && hasDetailedOutbound && outboundLegs.length > 0 ? (
              <>
                {outboundLegs.map((leg, i) => (
                  <div
                    key={i}
                    style={{
                      ...textSm,
                      marginTop: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        {leg.from} → {leg.to}
                      </span>
                      {leg.airline && (
                        <span style={{ marginLeft: 6 }}>
                          • {leg.airline}
                        </span>
                      )}
                      {leg.flightNumber && (
                        <span style={{ marginLeft: 4 }}>
                          ({leg.flightNumber})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      {leg.departure && (
                        <span>Dep: {leg.departure}&nbsp;</span>
                      )}
                      {leg.arrival && (
                        <span>Arr: {leg.arrival}&nbsp;</span>
                      )}
                      {leg.duration && <span>• {leg.duration}</span>}
                    </div>
                  </div>
                ))}

                {outboundLayovers.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#fde68a",
                    }}
                  >
                    {outboundLayovers.map((l, i) => (
                      <div key={i}>
                        Layover in{" "}
                        <span style={{ fontWeight: 600 }}>
                          {l.airport}
                        </span>
                        {l.duration ? ` — ${l.duration}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : outbound?.summary ? (
              <div style={{ ...textSm, marginTop: 4 }}>
                {outbound.summary}
              </div>
            ) : fallbackOutboundText ? (
              <div style={{ ...textSm, marginTop: 4 }}>
                {fallbackOutboundText}
              </div>
            ) : genericFlightText ? (
              <div style={{ ...textSm, marginTop: 4 }}>
                {genericFlightText}
              </div>
            ) : (
              <div style={{ ...textSm, marginTop: 4, opacity: 0.75 }}>
                Flight details will be shown here once available.
              </div>
            )}
          </div>

          {/* INBOUND */}
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid #1f2937",
            }}
          >
            <div style={labelSm}>Return</div>

            {inbound && hasDetailedInbound && inboundLegs.length > 0 ? (
              <>
                {inboundLegs.map((leg, i) => (
                  <div
                    key={i}
                    style={{
                      ...textSm,
                      marginTop: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        {leg.from} → {leg.to}
                      </span>
                      {leg.airline && (
                        <span style={{ marginLeft: 6 }}>
                          • {leg.airline}
                        </span>
                      )}
                      {leg.flightNumber && (
                        <span style={{ marginLeft: 4 }}>
                          ({leg.flightNumber})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      {leg.departure && (
                        <span>Dep: {leg.departure}&nbsp;</span>
                      )}
                      {leg.arrival && (
                        <span>Arr: {leg.arrival}&nbsp;</span>
                      )}
                      {leg.duration && <span>• {leg.duration}</span>}
                    </div>
                  </div>
                ))}

                {inboundLayovers.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#fde68a",
                    }}
                  >
                    {inboundLayovers.map((l, i) => (
                      <div key={i}>
                        Layover in{" "}
                        <span style={{ fontWeight: 600 }}>
                          {l.airport}
                        </span>
                        {l.duration ? ` — ${l.duration}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : inbound?.summary ? (
              <div style={{ ...textSm, marginTop: 4 }}>
                {inbound.summary}
              </div>
            ) : fallbackInboundText ? (
              <div style={{ ...textSm, marginTop: 4 }}>
                {fallbackInboundText}
              </div>
            ) : genericFlightText ? (
              <div style={{ ...textSm, marginTop: 4 }}>
                {genericFlightText}
              </div>
            ) : (
              <div style={{ ...textSm, marginTop: 4, opacity: 0.75 }}>
                Return flight details will be shown here once available.
              </div>
            )}
          </div>

          {cabin && (
            <div style={{ marginTop: 6, fontSize: 11 }}>
              <span style={{ fontWeight: 600 }}>Cabin:</span> {cabin}
            </div>
          )}
          {totalDuration && (
            <div style={{ marginTop: 2, fontSize: 11 }}>
              <span style={{ fontWeight: 600 }}>Total travel time:</span>{" "}
              {totalDuration}
            </div>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <div style={footerStyle}>
        <div style={footerRowStyle}>
          <button
            type="button"
            style={{
              ...pillButton,
              backgroundColor: "#111827",
              color: "#e5e7eb",
            }}
          >
            Compare
          </button>

          <a
            href={googleFlightsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              ...pillButton,
              background: "linear-gradient(90deg,#0ea5e9,#2563eb)",
              color: "white",
              textDecoration: "none",
            }}
          >
            <Plane size={16} />
            Google Flights
          </a>

          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              ...pillButton,
              backgroundColor: "#22c55e",
              color: "white",
              textDecoration: "none",
            }}
          >
            <Hotel size={16} />
            Booking / Hotels
          </a>
        </div>

        <div
          style={{
            ...footerRowStyle,
            marginTop: 8,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600 }}>More flight options</span>
            <a
              href={skyscannerUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                ...chipLink,
                backgroundColor: "#020617",
                borderColor: "#0ea5e9",
                color: "#e0f2fe",
              }}
            >
              Skyscanner
            </a>
            <a
              href={kayakUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                ...chipLink,
                backgroundColor: "#020617",
                borderColor: "#4f46e5",
                color: "#e0e7ff",
              }}
            >
              KAYAK
            </a>
            <a
              href={airlineSitesUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                ...chipLink,
                backgroundColor: "#020617",
                borderColor: "#4b5563",
                color: "#e5e7eb",
              }}
            >
              Airline sites
            </a>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600 }}>More hotel options</span>
            <a
              href={expediaUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                ...chipLink,
                backgroundColor: "#020617",
                borderColor: "#f59e0b",
                color: "#fef3c7",
              }}
            >
              Expedia
            </a>
            <a
              href={hotelsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                ...chipLink,
                backgroundColor: "#020617",
                borderColor: "#22c55e",
                color: "#dcfce7",
              }}
            >
              Hotels.com
            </a>
          </div>

          <div style={{ fontSize: 10, opacity: 0.7 }}>
            <ExternalLink size={12} style={{ marginRight: 4 }} />
            Prices and availability are examples and may change at booking.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
