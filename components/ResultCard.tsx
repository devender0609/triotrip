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

/* ----------------- GENERIC FIELD HELPERS ----------------- */

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
    "cabin",
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

  const h = getPkgField(pkg, ["hotels"]);
  if (Array.isArray(h) && h.length > 0) return h;

  return [];
}

/* ----------------- SEGMENTS + DIRECTIONS ----------------- */

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
      (typeof seg.duration_minutes === "number"
        ? `${Math.floor(seg.duration_minutes / 60)}h ${
            seg.duration_minutes % 60
          }m`
        : undefined),
    airline: seg.airline || seg.carrier,
    flight_number: seg.flight_number || seg.flight_no,
    cabin: seg.cabin || seg.class,
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

/* ----------------- LABEL HELPERS ----------------- */

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

/** Stable ID: prefer pkg.id, then alpha/beta ids, then index-based fallback */
function getPkgId(pkg: any, fallbackIndex: number): string {
  if (pkg && pkg.id != null) return String(pkg.id);

  const alphaId = getPkgField(pkg, ["alpha.id", "alpha.pkg_id"]);
  if (typeof alphaId === "string" && alphaId.trim()) return alphaId;

  const betaId = getPkgField(pkg, ["beta.id", "beta.pkg_id"]);
  if (typeof betaId === "string" && betaId.trim()) return betaId;

  return `pkg-${fallbackIndex}`;
}

/* ----------------- BOOKING URL HELPERS ----------------- */

interface FlightParams {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults: number;
  cabin: string;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  cityForHotels?: string;
  airlineUrl?: string;
}

function getFlightParams(pkg: any, pax: number): FlightParams {
  const origin =
    pkg.origin || pkg.originCode || pkg.from || getDepartCity(pkg);
  const destination =
    pkg.destination || pkg.destinationCity || pkg.to || getArriveCity(pkg);
  const departDate = pkg.departDate || pkg.depart_date;
  const returnDate = pkg.returnDate || pkg.return_date;
  const adults = pkg.passengersAdults || pkg.adults || pax || 1;
  const cabin = getCabin(pkg) || "ECONOMY";

  const cityForHotels =
    getHotels(pkg)[0]?.city ||
    getArriveCity(pkg) ||
    destination ||
    "Destination";

  const airlineUrl = getPkgField(pkg, ["flight.deeplinks.airline.url"]);

  return {
    origin,
    destination,
    departDate,
    returnDate,
    adults,
    cabin,
    hotelCheckIn: pkg.hotelCheckIn,
    hotelCheckOut: pkg.hotelCheckOut,
    cityForHotels,
    airlineUrl,
  };
}

function buildGoogleFlightsUrl(p: FlightParams): string {
  const q = `Flights from ${p.origin || ""} to ${p.destination || ""} ${
    p.departDate || ""
  } ${p.returnDate || ""} ${p.cabin || ""}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

function buildSkyscannerUrl(p: FlightParams): string {
  if (!p.origin || !p.destination || !p.departDate) {
    return "https://www.skyscanner.com/";
  }
  const depart = p.departDate.replace(/-/g, "");
  const ret = p.returnDate ? `/${p.returnDate.replace(/-/g, "")}` : "";
  const cabin = (p.cabin || "ECONOMY").toLowerCase();
  return `https://www.skyscanner.com/transport/flights/${p.origin}/${p.destination}/${depart}${ret}/?adultsv2=${p.adults}&cabinclass=${cabin}`;
}

function buildKayakUrl(p: FlightParams): string {
  if (!p.origin || !p.destination || !p.departDate) {
    return "https://www.kayak.com/flights";
  }
  const retPart = p.returnDate ? `/${p.returnDate}` : "";
  const cabin = (p.cabin || "ECONOMY").toLowerCase();
  return `https://www.kayak.com/flights/${p.origin}-${p.destination}/${p.departDate}${retPart}/${p.adults}adults?cabin=${cabin}`;
}

function buildAirlineUrl(p: FlightParams, airlineName: string): string {
  if (p.airlineUrl && typeof p.airlineUrl === "string") return p.airlineUrl;
  const q = `${airlineName || "airline"} flights ${p.origin || ""} ${
    p.destination || ""
  } ${p.departDate || ""}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function buildBookingUrl(p: FlightParams): string {
  const city = encodeURIComponent(p.cityForHotels || "Destination");
  const checkin = p.hotelCheckIn || p.departDate || "";
  const checkout = p.hotelCheckOut || p.returnDate || "";
  return `https://www.booking.com/searchresults.html?ss=${city}&checkin=${checkin}&checkout=${checkout}&group_adults=${p.adults}&no_rooms=1`;
}

function buildExpediaUrl(p: FlightParams): string {
  const city = encodeURIComponent(p.cityForHotels || "Destination");
  const checkin = p.hotelCheckIn || p.departDate || "";
  const checkout = p.hotelCheckOut || p.returnDate || "";
  return `https://www.expedia.com/Hotel-Search?destination=${city}&startDate=${checkin}&endDate=${checkout}&adults=${p.adults}`;
}

function buildHotelsDotComUrl(p: FlightParams): string {
  const city = encodeURIComponent(p.cityForHotels || "Destination");
  const checkin = p.hotelCheckIn || p.departDate || "";
  const checkout = p.hotelCheckOut || p.returnDate || "";
  return `https://www.hotels.com/Hotel-Search?destination=${city}&startDate=${checkin}&endDate=${checkout}&adults=${p.adults}`;
}

/* ----------------- LAYOVER HELPERS ----------------- */

function formatLayoverDuration(arrive?: string, nextDepart?: string): string {
  if (!arrive || !nextDepart) return "";
  const a = new Date(arrive).getTime();
  const b = new Date(nextDepart).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "";
  const mins = Math.round((b - a) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m layover`;
  if (!m) return `${h}h layover`;
  return `${h}h ${m}m layover`;
}

/* ----------------- STYLES ----------------- */

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
    "linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))",
};

const mainBody: React.CSSProperties = {
  padding: "16px 18px 18px",
  display: "grid",
  gap: 16,
};

const twoColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
  gap: 16,
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

const tinyText: React.CSSProperties = {
  // fontSize: 11,
  color: "#9ca3af",
};

const chipButton: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#0b1120",
  color: "#e5e7eb",
  // fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const smallTag: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  padding: "3px 9px",
  // fontSize: 11,
  display: "inline-flex",
  alignItems: "center",
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

const directionBox: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(30,64,175,0.7)",
  padding: "10px 10px 8px",
  background: "#020617",
  display: "grid",
  gap: 6,
};

/* ----------------- COMPONENT ----------------- */

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
  const id = getPkgId(pkg, index);
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

  const params = getFlightParams(pkg, pax);
  const googleFlightsUrl = buildGoogleFlightsUrl(params);
  const skyscannerUrl = buildSkyscannerUrl(params);
  const kayakUrl = buildKayakUrl(params);
  const airlineSiteUrl = buildAirlineUrl(params, airlineName);
  const bookingUrl = buildBookingUrl(params);
  const expediaUrl = buildExpediaUrl(params);
  const hotelsDotComUrl = buildHotelsDotComUrl(params);

  const handleCompareClick = () => {
    onToggleCompare(id);
  };

  return (
    <div style={outerCard}>
      {/* HEADER */}
      <div style={headerWrapper}>
        <div style={headerInner}>
          <div style={{ display: "grid", gap: 4 }}>
            <div
              style={{
                // fontSize: 11,
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
                // fontSize: 13,
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
                  // fontSize: 13,
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                // fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.95)",
                fontWeight: 600,
              }}
            >
              {priceSummary}
            </div>
            <button
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid rgba(248,250,252,0.8)",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9))",
                color: "#f9fafb",
                // fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(15,23,42,0.7)",
              }}
            >
              Trip bundle
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={mainBody}>
        {/* HOTEL + FLIGHT ROW */}
        <div style={twoColGrid}>
          {/* HOTEL BUNDLE */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <div style={paneHeaderLeft}>
                <span style={{ // fontSize: 20 }}>🏨</span>
                <div>
                  <div
                    style={{
                      // fontSize: 14,
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

                        const price =
                          typeof h.price_converted === "number"
                            ? h.price_converted
                            : typeof h.price === "number"
                            ? h.price
                            : undefined;

                        return (
                          <div
                            key={idx}
                            style={{
                              borderRadius: 12,
                              border:
                                "1px solid rgba(30,64,175,0.7)",
                              background:
                                "linear-gradient(135deg,#020617,#020617,#020617)",
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
                                  // fontSize: 13,
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
                                      // fontSize: 11,
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
                              {price !== undefined && (
                                <div
                                  style={{
                                    // fontSize: 12,
                                    fontWeight: 700,
                                    color: "#22c55e",
                                  }}
                                >
                                  {price.toLocaleString()}{" "}
                                  <span
                                    style={{
                                      // fontSize: 11,
                                      fontWeight: 400,
                                    }}
                                  >
                                    {h.currency || currency}
                                  </span>
                                </div>
                              )}
                              {h.price_label && (
                                <div
                                  style={{
                                    ...tinyText,
                                    color: "#4ade80",
                                  }}
                                >
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
                <div style={{ // fontSize: 12, color: "#9ca3af" }}>
                  • Hotel ideas will appear here when bundling is
                  available.
                </div>
              ) : (
                <div style={{ // fontSize: 12, color: "#9ca3af" }}>
                  • Hotel bundle not requested for this search.
                </div>
              )}
            </div>
          </div>

          {/* FLIGHT DETAILS */}
          <div style={paneCard}>
            <div style={paneHeader}>
              <div style={paneHeaderLeft}>
                <span style={{ // fontSize: 20 }}>✈️</span>
                <div>
                  <div
                    style={{
                      // fontSize: 14,
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
                <div style={{ // fontSize: 12, color: "#9ca3af" }}>
                  No detailed itinerary available. Summary:{" "}
                  {totalDuration} ·{" "}
                  {totalStops || "Stops info pending"} · {cabinLabel}.
                </div>
              ) : (
                directions.map((dir, dIdx) => (
                  <div key={dIdx} style={directionBox}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        style={{
                          // fontSize: 11,
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

                    <div style={{ display: "grid", gap: 8 }}>
                      {dir.segments.map((seg, sIdx) => {
                        const next =
                          sIdx < dir.segments.length - 1
                            ? dir.segments[sIdx + 1]
                            : null;

                        const layCity =
                          next?.depart_city ||
                          next?.depart_airport ||
                          "";
                        const layDur = formatLayoverDuration(
                          seg.arrive_time,
                          next?.depart_time
                        );

                        return (
                          <div key={sIdx} style={{ display: "grid", gap: 4 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {(seg.depart_city ||
                                  seg.depart_airport ||
                                  "Origin") +
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
                              {seg.cabin && (
                                <span>Cabin {seg.cabin}</span>
                              )}
                            </div>

                            {next && (
                              <div
                                style={{
                                  marginTop: 4,
                                  marginLeft: 6,
                                  paddingLeft: 6,
                                  borderLeft:
                                    "2px solid rgba(148,163,184,0.7)",
                                  ...tinyText,
                                }}
                              >
                                Layover in{" "}
                                <span style={{ fontWeight: 500 }}>
                                  {layCity || "connection"}
                                </span>
                                {layDur && <> · {layDur}</>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid rgba(30,64,175,0.75)",
                        paddingTop: 6,
                        display: "grid",
                        gap: 2,
                        // fontSize: 11,
                        color: "#9ca3af",
                        marginTop: 2,
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
                      <div>
                        Times and durations are approximate and may
                        differ slightly at booking.
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS + LINKS */}
        <div style={footerBar}>
          <button
            type="button"
            onClick={handleCompareClick}
            style={{
              ...chipButton,
              background: isCompared
                ? "linear-gradient(135deg,#0ea5e9,#22c55e)"
                : "#020617",
              borderColor: isCompared ? "#0ea5e9" : "#e2e8f0",
              boxShadow: isCompared
                ? "0 4px 12px rgba(14,165,233,0.6)"
                : "none",
            }}
          >
            {isCompared ? "Added to Compare" : "Compare"}
          </button>

          <a
            href={googleFlightsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...chipButton,
              textDecoration: "none",
              background:
                "linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7)",
              borderColor: "rgba(191,219,254,0.9)",
              boxShadow: "0 4px 14px rgba(59,130,246,0.6)",
            }}
          >
            Google Flights
          </a>

          {showHotel && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...chipButton,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#16a34a,#22c55e,#bbf7d0)",
                borderColor: "rgba(74,222,128,0.9)",
                boxShadow: "0 4px 14px rgba(34,197,94,0.6)",
              }}
            >
              Booking / Hotels
            </a>
          )}

          <div style={footerRight}>
            <span style={tinyText}>More flight options</span>
            <a
              href={skyscannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...smallTag,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#0369a1,#0ea5e9)",
                boxShadow: "0 3px 10px rgba(14,165,233,0.4)",
              }}
            >
              Skyscanner
            </a>
            <a
              href={kayakUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...smallTag,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#ea580c,#f97316,#fed7aa)",
                boxShadow: "0 3px 10px rgba(234,88,12,0.45)",
              }}
            >
              KAYAK
            </a>
            <a
              href={airlineSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...smallTag,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#4b5563,#9ca3af)",
                boxShadow: "0 3px 10px rgba(75,85,99,0.5)",
              }}
            >
              Airline sites
            </a>
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
            <a
              href={expediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...smallTag,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#facc15,#f97316,#ea580c)",
                boxShadow: "0 3px 10px rgba(249,115,22,0.5)",
              }}
            >
              Expedia
            </a>
            <a
              href={hotelsDotComUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...smallTag,
                textDecoration: "none",
                background:
                  "linear-gradient(135deg,#b91c1c,#ef4444)",
                boxShadow: "0 3px 10px rgba(239,68,68,0.5)",
              }}
            >
              Hotels.com
            </a>
            <span style={{ marginLeft: "auto" }}>
              Prices and availability are examples only and may change
              at booking.
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
            Prices and availability are examples only and may change at
            booking.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
