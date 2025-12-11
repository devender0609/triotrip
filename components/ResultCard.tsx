"use client";

import React from "react";

export interface ResultCardProps {
  pkg: any;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: any) => void;
  onSavedChangeGlobal: () => void;
}

/* ========== SMALL HELPERS TO READ ALPHA / BETA STRUCTURES ========== */

function getPkgField(pkg: any, paths: string[]): any {
  for (const path of paths) {
    const parts = path.split(".");
    let cur: any = pkg;
    let ok = true;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

function getArriveCity(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.arrive_city",
    "alpha.hi_level.destination_city",
    "beta.arrive_city",
    "beta.destination_city",
    "destinationCity",
    "city",
    "destination",
  ]);
  return typeof val === "string" ? val : "";
}

function getDepartCity(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.depart_city",
    "alpha.hi_level.origin_city",
    "beta.depart_city",
    "beta.origin_city",
    "originCity",
    "origin",
  ]);
  return typeof val === "string" ? val : "";
}

function getAirlineName(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.airline",
    "beta.airline",
    "alpha.hi_level.carrier",
    "beta.carrier",
    "flight.carrier_name",
  ]);
  return typeof val === "string" ? val : "";
}

function getTravelDate(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.date",
    "alpha.hi_level.depart_date",
    "beta.depart_date",
    "departDate",
  ]);
  return typeof val === "string" ? val : "";
}

function getTotalDuration(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.total_duration",
    "beta.total_duration",
  ]);
  if (typeof val === "string") return val;

  // Fallback: compute from minutes if present
  const mins =
    getPkgField(pkg, ["flight.total_duration_minutes"]) ??
    getPkgField(pkg, ["flight.duration_minutes"]);

  if (typeof mins === "number" && Number.isFinite(mins)) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }
  return "";
}

function getTotalStops(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.stops",
    "beta.stops",
    "alpha.hi_level.stop_count",
    "beta.stop_count",
    "flight.stops",
  ]);
  if (typeof val === "number") {
    if (val === 0) return "Non-stop";
    if (val === 1) return "1 stop";
    return `${val} stops`;
  }
  if (typeof val === "string") return val;
  return "";
}

function getCabin(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.cabin",
    "beta.cabin",
    "alpha.hi_level.class",
    "beta.class",
    "flight.cabin",
  ]);
  return typeof val === "string" ? val : "";
}

function getTotalPrice(pkg: any, currency: string): string {
  const alphaPrice = getPkgField(pkg, ["alpha.hi_level.price_total"]);
  const alphaCurrency = getPkgField(pkg, ["alpha.hi_level.currency"]);
  const alphaCur =
    typeof alphaCurrency === "string" && alphaCurrency.trim()
      ? alphaCurrency
      : currency;
  if (typeof alphaPrice === "number") {
    return `${alphaPrice.toLocaleString()} ${alphaCur}`;
  }

  const betaPrice = getPkgField(pkg, ["beta.total_price", "beta.price_total"]);
  const betaCurrency = getPkgField(pkg, ["beta.currency"]);
  const betaCur =
    typeof betaCurrency === "string" && betaCurrency.trim()
      ? betaCurrency
      : currency;
  if (typeof betaPrice === "number") {
    return `${betaPrice.toLocaleString()} ${betaCur}`;
  }

  // our AI / manual payload uses these:
  const flightTotal =
    getPkgField(pkg, ["display_total"]) ??
    getPkgField(pkg, ["flight_total"]) ??
    getPkgField(pkg, ["total_cost"]);

  if (typeof flightTotal === "number") {
    return `${flightTotal.toLocaleString()} ${currency}`;
  }

  return "Price TBD";
}

function getHotels(pkg: any): any[] {
  const alphaHotels = getPkgField(pkg, ["alpha.hotels", "alpha.hotel_list"]);
  if (Array.isArray(alphaHotels) && alphaHotels.length > 0) return alphaHotels;

  const betaHotels = getPkgField(pkg, ["beta.hotels", "beta.hotel_list"]);
  if (Array.isArray(betaHotels) && betaHotels.length > 0) return betaHotels;

  // our current /api/search shape:
  const h = getPkgField(pkg, ["hotels"]);
  if (Array.isArray(h) && h.length > 0) return h;

  return [];
}

/* ===== segments + directions ===== */

interface SegmentLike {
  depart_city?: string;
  arrive_city?: string;
  depart_airport?: string;
  arrive_airport?: string;
  depart_time?: string;
  arrive_time?: string;
  duration?: string;
  airline?: string;
  flight_number?: string;
  cabin?: string;
  layover_city?: string;
  layover_duration?: string;
}

interface DirectionLike {
  direction_label: string;
  segments: SegmentLike[];
}

function normalizeSegment(seg: any): SegmentLike {
  return {
    depart_city:
      seg.depart_city || seg.origin_city || seg.departure_city || seg.from,
    arrive_city:
      seg.arrive_city || seg.destination_city || seg.arrival_city || seg.to,
    depart_airport: seg.depart_airport || seg.departure_airport,
    arrive_airport: seg.arrive_airport || seg.arrival_airport,
    depart_time: seg.depart_time || seg.departure_time,
    arrive_time: seg.arrive_time || seg.arrival_time,
    duration:
      seg.duration ||
      (seg.duration_minutes
        ? `${Math.floor(seg.duration_minutes / 60)}h ${
            seg.duration_minutes % 60
          }m`
        : undefined),
    airline: seg.airline || seg.carrier,
    flight_number: seg.flight_number || seg.flight_no,
    cabin: seg.cabin || seg.class,
    layover_city: seg.layover_city,
    layover_duration: seg.layover_duration,
  };
}

function getFlightDirections(pkg: any): DirectionLike[] {
  const directions: DirectionLike[] = [];

  const alphaOutbound = getPkgField(pkg, [
    "alpha.flights.outbound",
    "alpha.outbound",
  ]);
  const alphaReturn = getPkgField(pkg, ["alpha.flights.return", "alpha.return"]);

  if (alphaOutbound && Array.isArray(alphaOutbound.segments)) {
    directions.push({
      direction_label: "Outbound",
      segments: alphaOutbound.segments.map((s: any) => normalizeSegment(s)),
    });
  }
  if (alphaReturn && Array.isArray(alphaReturn.segments)) {
    directions.push({
      direction_label: "Return",
      segments: alphaReturn.segments.map((s: any) => normalizeSegment(s)),
    });
  }

  // fallback: our current AI/manual structure in `flight`
  if (directions.length === 0) {
    const out = getPkgField(pkg, ["flight.segments_out"]) || [];
    const ret = getPkgField(pkg, ["flight.segments_in"]) || [];

    if (Array.isArray(out) && out.length) {
      directions.push({
        direction_label: "Outbound",
        segments: out.map((s: any) => normalizeSegment(s)),
      });
    }
    if (Array.isArray(ret) && ret.length) {
      directions.push({
        direction_label: "Return",
        segments: ret.map((s: any) => normalizeSegment(s)),
      });
    }
  }

  return directions;
}

function getOptionLabel(index: number, pkg: any): string {
  const label = getPkgField(pkg, ["alpha.hi_level.option_label"]);
  if (typeof label === "string" && label.trim()) return label;
  return `Option ${index + 1}`;
}

function getPaxString(pkg: any, fallbackPax: number): string {
  const alphaStr = getPkgField(pkg, ["alpha.hi_level.pax_label"]);
  if (typeof alphaStr === "string" && alphaStr.trim()) return alphaStr;

  const betaPax = getPkgField(pkg, ["beta.pax_count"]);
  if (typeof betaPax === "number")
    return `${betaPax} traveler${betaPax > 1 ? "s" : ""}`;

  if (fallbackPax > 0)
    return `${fallbackPax} traveler${fallbackPax > 1 ? "s" : ""}`;

  return "1 traveler";
}

function getCabinLabel(pkg: any): string {
  const cabin = getCabin(pkg);
  if (!cabin) return "";
  return `Cabin ${cabin.toUpperCase()}`;
}

function getPriceSummary(pkg: any, currency: string, pax: number): string {
  const price = getTotalPrice(pkg, currency);
  if (price === "Price TBD") return `${currency} — price TBD`;
  const paxString =
    pax > 1 ? ` — total for ${pax} travelers` : " — total for 1 traveler";
  return `${price}${paxString}`;
}

function getPkgId(pkg: any): string {
  const alphaId = getPkgField(pkg, ["alpha.id", "alpha.pkg_id"]);
  if (typeof alphaId === "string" && alphaId.trim()) return alphaId;
  const betaId = getPkgField(pkg, ["beta.id", "beta.pkg_id"]);
  if (typeof betaId === "string" && betaId.trim()) return betaId;
  return String(pkg.id ?? Math.random().toString(36).slice(2));
}

/* ========== STYLES ========== */

const outerCard: React.CSSProperties = {
  background: "#050816",
  color: "#e5e7eb",
  borderRadius: 24,
  overflow: "hidden",
  border: "1px solid rgba(148,163,184,0.3)",
  boxShadow: "0 20px 40px rgba(15,23,42,0.75)",
};

const headerWrapper: React.CSSProperties = {
  background:
    "linear-gradient(90deg, #38bdf8 0%, #6366f1 50%, #ec4899 100%)",
  padding: 1,
};

const headerInner: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 20px",
  background:
    "linear-gradient(90deg, rgba(15,23,42,0.92), rgba(15,23,42,0.88))",
};

const headerLeft: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const headerRight: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 6,
};

const pillButton: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid rgba(248,250,252,0.8)",
  background: "rgba(15,23,42,0.4)",
  color: "#f9fafb",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const mainBody: React.CSSProperties = {
  padding: "16px 18px 18px",
  display: "grid",
  gap: 16,
};

const twoColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr)",
  gap: 16,
};

const twoColGridWide: React.CSSProperties = {
  ...twoColGrid,
};

const paneCard: React.CSSProperties = {
  borderRadius: 18,
  background: "#020617",
  border: "1px solid rgba(30,64,175,0.7)",
  boxShadow: "0 16px 32px rgba(15,23,42,0.8)",
  padding: 14,
};

const paneHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: 8,
  marginBottom: 8,
  borderBottom: "1px solid rgba(15,23,42,0.9)",
};

const paneHeaderLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const footerBar: React.CSSProperties = {
  paddingTop: 10,
  borderTop: "1px solid rgba(30,64,175,0.5)",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

const footerRight: React.CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const chipButton: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#0b1120",
  color: "#e5e7eb",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const smallTag: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  padding: "3px 8px",
  fontSize: 11,
  display: "inline-flex",
  alignItems: "center",
};

const tinyText: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
};

/* ========== COMPONENT ========== */

export const ResultCard: React.FC<ResultCardProps> = ({
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
  const id = getPkgId(pkg);
  const isCompared = comparedIds.includes(id);

  const airlineName = getAirlineName(pkg) || "Flight";
  const fromCity = getDepartCity(pkg);
  const toCity = getArriveCity(pkg);
  const travelDate = getTravelDate(pkg);
  const totalDuration = getTotalDuration(pkg);
  const totalStops = getTotalStops(pkg);
  const cabinLabel = getCabinLabel(pkg);
  const priceSummary = getPriceSummary(pkg, currency, pax);
  const hotels = getHotels(pkg);
  const directions = getFlightDirections(pkg);
  const optionLabel = getOptionLabel(index, pkg);
  const paxLabel = getPaxString(pkg, pax);

  const handleCompareClick = () => {
    onToggleCompare(id);
  };

  // responsive tweak: make the inner two-column grid become 2 cols on wide screens
  // (we don't have CSS media queries here, but the layout will still stack nicely)

  return (
    <div style={outerCard}>
      {/* HEADER */}
      <div style={headerWrapper}>
        <div style={headerInner}>
          <div style={headerLeft}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.9)",
                fontWeight: 700,
              }}
            >
              {optionLabel}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                fontSize: 13,
                color: "rgba(226,232,240,0.9)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>✈️</span>
                <span style={{ fontWeight: 600 }}>{airlineName}</span>
              </span>
              {travelDate && (
                <>
                  <span>•</span>
                  <span>{travelDate}</span>
                </>
              )}
              {totalDuration && (
                <>
                  <span>•</span>
                  <span>{totalDuration}</span>
                </>
              )}
            </div>
            {(fromCity || toCity) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  alignItems: "center",
                  fontSize: 13,
                  color: "rgba(226,232,240,0.9)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span>🛫</span>
                  <span style={{ fontWeight: 600 }}>
                    {fromCity || "Origin"}
                  </span>
                </span>
                <span>→</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span>🛬</span>
                  <span style={{ fontWeight: 600 }}>
                    {toCity || "Destination"}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div style={headerRight}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.95)",
                fontWeight: 600,
              }}
            >
              {priceSummary}
            </div>
            <button style={pillButton}>Trip bundle</button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={mainBody}>
        {/* HOTEL + FLIGHT ROW */}
        <div style={twoColGridWide}>
          {/* HOTEL BUNDLE */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <div style={paneHeaderLeft}>
                <span style={{ fontSize: 20 }}>🏨</span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Hotel bundle
                  </div>
                  <div style={{ ...tinyText, marginTop: 2 }}>
                    Stay near your destination · {hotelNights} night
                    {hotelNights === 1 ? "" : "s"} · Best-matched picks
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {showHotel && hotels.length > 0 ? (
                <>
                  {!showAllHotels && (
                    <div style={{ ...tinyText, marginBottom: 2 }}>
                      Showing top hotel matches ·{" "}
                      <span style={{ fontWeight: 500, color: "#e5e7eb" }}>
                        {hotels.length}
                      </span>{" "}
                      option{hotels.length > 1 ? "s" : ""}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 8 }}>
                    {(showAllHotels ? hotels : hotels.slice(0, 3)).map(
                      (h, idx) => {
                        const stars =
                          typeof h.star === "number"
                            ? h.star
                            : typeof h.stars === "number"
                            ? h.stars
                            : undefined;

                        return (
                          <div
                            key={idx}
                            style={{
                              borderRadius: 12,
                              border: "1px solid rgba(30,64,175,0.7)",
                              background: "#020617",
                              padding: "8px 10px",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#f9fafb",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 6,
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  {h.name ||
                                    h.hotel_name ||
                                    "Hotel option"}
                                </span>
                                {stars && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "#fbbf24",
                                    }}
                                  >
                                    {"★".repeat(Math.round(stars))}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  ...tinyText,
                                  marginTop: 2,
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 6,
                                }}
                              >
                                {h.city && <span>{h.city}</span>}
                                {h.distance && (
                                  <span>{h.distance}</span>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign: "right",
                                display: "grid",
                                gap: 3,
                              }}
                            >
                              {typeof h.price_converted === "number" ? (
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#22c55e",
                                  }}
                                >
                                  {h.price_converted.toLocaleString()}{" "}
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 400,
                                    }}
                                  >
                                    {h.currency || currency}
                                  </span>
                                </div>
                              ) : typeof h.price === "number" ? (
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#22c55e",
                                  }}
                                >
                                  {h.price.toLocaleString()}{" "}
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 400,
                                    }}
                                  >
                                    {h.currency || currency}
                                  </span>
                                </div>
                              ) : null}
                              {h.price_label && (
                                <div style={{ ...tinyText, color: "#4ade80" }}>
                                  {h.price_label}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {hotels.length > 3 && !showAllHotels && (
                    <div style={{ ...tinyText, marginTop: 4 }}>
                      + {hotels.length - 3} more hotel
                      {hotels.length - 3 > 1 ? "s" : ""} available in
                      this bundle.
                    </div>
                  )}
                </>
              ) : showHotel ? (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  • Hotel ideas will appear here when bundling is
                  available.
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  • Hotel bundle not requested for this search.
                </div>
              )}
            </div>
          </div>

          {/* FLIGHT DETAILS */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <div style={paneHeaderLeft}>
                <span style={{ fontSize: 20 }}>✈️</span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#e5e7eb",
                    }}
                  >
                    Flight details
                  </div>
                  <div style={{ ...tinyText, marginTop: 2 }}>
                    {totalStops || "Non-stop or 1+ stops"} ·{" "}
                    {cabinLabel || "Cabin details"} · Best time & route
                    match
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {directions.length === 0 ? (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  No detailed itinerary available. Summary: {totalDuration} ·{" "}
                  {totalStops || "Stops info pending"} · {cabinLabel}.
                </div>
              ) : (
                directions.map((dir, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      display: "grid",
                      gap: 4,
                      fontSize: 13,
                      color: "#e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          color: "#9ca3af",
                          fontWeight: 600,
                        }}
                      >
                        {dir.direction_label}
                      </div>
                      {dIdx === 0 && totalDuration && (
                        <div style={tinyText}>{totalDuration}</div>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      {dir.segments.map((seg, sIdx) => (
                        <div key={sIdx} style={{ display: "grid", gap: 2 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {(seg.depart_city || seg.depart_airport || "Origin") +
                                " → " +
                                (seg.arrive_city ||
                                  seg.arrive_airport ||
                                  "Destination")}
                            </span>
                            {seg.duration && (
                              <span style={tinyText}>{seg.duration}</span>
                            )}
                          </div>
                          <div
                            style={{
                              ...tinyText,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {seg.depart_time && (
                              <span>Dep {seg.depart_time}</span>
                            )}
                            {seg.arrive_time && (
                              <span>Arr {seg.arrive_time}</span>
                            )}
                            {seg.airline && <span>{seg.airline}</span>}
                            {seg.flight_number && (
                              <span>Flight {seg.flight_number}</span>
                            )}
                            {seg.cabin && <span>Cabin {seg.cabin}</span>}
                          </div>
                          {seg.layover_city && (
                            <div style={{ ...tinyText, marginLeft: 4 }}>
                              Layover in{" "}
                              <span style={{ fontWeight: 500 }}>
                                {seg.layover_city}
                              </span>
                              {seg.layover_duration && (
                                <> · {seg.layover_duration}</>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div
                style={{
                  borderTop: "1px solid rgba(30,64,175,0.75)",
                  paddingTop: 6,
                  display: "grid",
                  gap: 2,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {paxLabel && <span>{paxLabel}</span>}
                  {totalStops && <span>{totalStops}</span>}
                  {cabinLabel && <span>{cabinLabel}</span>}
                </div>
                <div>Times and durations are approximate and may differ slightly at booking.</div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div style={footerBar}>
          <button
            onClick={handleCompareClick}
            style={{
              ...chipButton,
              background: isCompared ? "#0ea5e9" : "#020617",
              borderColor: isCompared ? "#0ea5e9" : "#e2e8f0",
            }}
          >
            {isCompared ? "Added to Compare" : "Compare"}
          </button>

          <button
            style={{
              ...chipButton,
              background:
                "linear-gradient(90deg,#0ea5e9,#6366f1)",
              borderColor: "transparent",
            }}
          >
            Google Flights
          </button>

          {showHotel && (
            <button
              style={{
                ...chipButton,
                background: "#16a34a",
                borderColor: "#16a34a",
              }}
            >
              Booking / Hotels
            </button>
          )}

          <div style={footerRight}>
            <span style={tinyText}>More flight options</span>
            <span style={smallTag}>Skyscanner</span>
            <span style={smallTag}>KAYAK</span>
            <span style={smallTag}>Airline sites</span>
          </div>
        </div>

        {showHotel && (
          <div
            style={{
              ...tinyText,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <span>More hotel options</span>
            <span style={smallTag}>Expedia</span>
            <span style={smallTag}>Hotels.com</span>
            <span style={{ marginLeft: "auto" }}>
              Prices and availability are examples only and may change at booking.
            </span>
          </div>
        )}

        {!showHotel && (
          <div
            style={{
              ...tinyText,
              marginTop: 4,
              textAlign: "right",
            }}
          >
            Prices and availability are examples only and may change at booking.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
