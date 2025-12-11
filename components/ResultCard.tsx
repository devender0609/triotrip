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

/**
 * Helper to safely extract value from either alpha or beta structure.
 * E.g. getPkgField(pkg, ["alpha.hi_level.arrive_city", "beta.arrive_city"])
 */
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

/**
 * Get a (string) arrival city from an alpha/beta style package
 */
function getArriveCity(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.arrive_city",
    "alpha.hi_level.destination_city",
    "beta.arrive_city",
    "beta.destination_city",
  ]);
  return typeof val === "string" ? val : "";
}

/**
 * Get a (string) departure city from alpha/beta style package
 */
function getDepartCity(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.depart_city",
    "alpha.hi_level.origin_city",
    "beta.depart_city",
    "beta.origin_city",
  ]);
  return typeof val === "string" ? val : "";
}

/**
 * Get an airline name from alpha/beta package
 */
function getAirlineName(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.airline",
    "beta.airline",
    "alpha.hi_level.carrier",
    "beta.carrier",
  ]);
  return typeof val === "string" ? val : "";
}

/**
 * Get travel date from alpha/beta pkg
 */
function getTravelDate(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.date",
    "alpha.hi_level.depart_date",
    "beta.depart_date",
  ]);
  return typeof val === "string" ? val : "";
}

/**
 * Get total flight duration from alpha/beta pkg
 * Example shapes:
 *   alpha.hi_level.total_duration: "6h 55m"
 *   beta.total_duration: "6h 55m"
 */
function getTotalDuration(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.total_duration",
    "beta.total_duration",
  ]);
  return typeof val === "string" ? val : "";
}

/**
 * Get total stops from alpha/beta pkg
 */
function getTotalStops(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.stops",
    "beta.stops",
    "alpha.hi_level.stop_count",
    "beta.stop_count",
  ]);
  if (typeof val === "number") return `${val} stop(s)`;
  if (typeof val === "string") return val;
  return "";
}

/**
 * Extract a "cabin" string
 */
function getCabin(pkg: any): string {
  const val = getPkgField(pkg, [
    "alpha.hi_level.cabin",
    "beta.cabin",
    "alpha.hi_level.class",
    "beta.class",
  ]);
  return typeof val === "string" ? val : "";
}

/**
 * Extract hi-level price from alpha or beta
 * Possibly we have alpha.hi_level.price_total and alpha.hi_level.price_type
 * or we have beta.price_total, beta.price_per_person, etc.
 */
function getTotalPrice(pkg: any, currency: string): string {
  // Attempt alpha style:
  const alphaPrice = getPkgField(pkg, ["alpha.hi_level.price_total"]);
  const alphaCurrency = getPkgField(pkg, ["alpha.hi_level.currency"]);
  const alphaPer =
    typeof alphaCurrency === "string" && alphaCurrency.trim()
      ? alphaCurrency
      : currency;
  if (typeof alphaPrice === "number") {
    return `${alphaPrice.toLocaleString()} ${alphaPer}`;
  }
  // Attempt beta
  const betaPrice = getPkgField(pkg, ["beta.total_price", "beta.price_total"]);
  const betaCurrency = getPkgField(pkg, ["beta.currency"]);
  const betaPer =
    typeof betaCurrency === "string" && betaCurrency.trim()
      ? betaCurrency
      : currency;
  if (typeof betaPrice === "number") {
    return `${betaPrice.toLocaleString()} ${betaPer}`;
  }
  // fallback
  return `Price TBD`;
}

/**
 * Decide if hotels are present in alpha or beta
 */
function getHotels(pkg: any): any[] {
  // check alpha bundling
  const alphaHotels = getPkgField(pkg, ["alpha.hotels", "alpha.hotel_list"]);
  if (Array.isArray(alphaHotels) && alphaHotels.length > 0) {
    return alphaHotels;
  }
  // check beta
  const betaHotels = getPkgField(pkg, ["beta.hotels", "beta.hotel_list"]);
  if (Array.isArray(betaHotels) && betaHotels.length > 0) {
    return betaHotels;
  }
  return [];
}

/**
 * A unified shape for flight segments (just what's needed for display).
 */
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

/**
 * Single direction flights: outbound / return, similar shape
 */
interface DirectionLike {
  direction_label: string; // "Outbound" or "Return"
  segments: SegmentLike[];
}

/**
 * Extract list of direction segments (for flight details)
 * We look for alpha style with alpha.segments or alpha.itinerary, or
 * a more direct "beta" style itinerary.
 */
function getFlightDirections(pkg: any): DirectionLike[] {
  // 1) alpha
  const alphaOutbound = getPkgField(pkg, [
    "alpha.flights.outbound",
    "alpha.outbound",
  ]);
  const alphaReturn = getPkgField(pkg, ["alpha.flights.return", "alpha.return"]);
  const directions: DirectionLike[] = [];

  if (alphaOutbound && Array.isArray(alphaOutbound.segments)) {
    directions.push({
      direction_label: "Outbound",
      segments: alphaOutbound.segments.map((seg: any) => normalizeSegment(seg)),
    });
  }

  if (alphaReturn && Array.isArray(alphaReturn.segments)) {
    directions.push({
      direction_label: "Return",
      segments: alphaReturn.segments.map((seg: any) => normalizeSegment(seg)),
    });
  }

  // 2) If no alpha directions found, try a generic "beta" style
  if (directions.length === 0) {
    const betaOut = getPkgField(pkg, [
      "beta.outbound",
      "beta.outbound_segments",
      "beta.flights.outbound",
    ]);
    const betaRet = getPkgField(pkg, [
      "beta.return",
      "beta.return_segments",
      "beta.flights.return",
    ]);

    if (betaOut && Array.isArray(betaOut.segments)) {
      directions.push({
        direction_label: "Outbound",
        segments: betaOut.segments.map((seg: any) => normalizeSegment(seg)),
      });
    } else if (Array.isArray(betaOut)) {
      directions.push({
        direction_label: "Outbound",
        segments: betaOut.map((seg: any) => normalizeSegment(seg)),
      });
    }

    if (betaRet && Array.isArray(betaRet.segments)) {
      directions.push({
        direction_label: "Return",
        segments: betaRet.segments.map((seg: any) => normalizeSegment(seg)),
      });
    } else if (Array.isArray(betaRet)) {
      directions.push({
        direction_label: "Return",
        segments: betaRet.map((seg: any) => normalizeSegment(seg)),
      });
    }
  }

  return directions;
}

/**
 * Normalize a raw segment to our SegmentLike
 */
function normalizeSegment(seg: any): SegmentLike {
  return {
    depart_city: seg.depart_city || seg.origin_city || seg.departure_city,
    arrive_city: seg.arrive_city || seg.destination_city || seg.arrival_city,
    depart_airport: seg.depart_airport || seg.departure_airport,
    arrive_airport: seg.arrive_airport || seg.arrival_airport,
    depart_time: seg.depart_time || seg.departure_time,
    arrive_time: seg.arrive_time || seg.arrival_time,
    duration: seg.duration,
    airline: seg.airline || seg.carrier,
    flight_number: seg.flight_number || seg.flight_no,
    cabin: seg.cabin || seg.class,
    layover_city: seg.layover_city,
    layover_duration: seg.layover_duration,
  };
}

/**
 * Helper to get an "Option X" label: alpha.hi_level.option_label?
 */
function getOptionLabel(index: number, pkg: any): string {
  const label = getPkgField(pkg, ["alpha.hi_level.option_label"]);
  if (typeof label === "string" && label.trim()) return label;
  return `Option ${index + 1}`;
}

/**
 * Helper to get hi-level "pax" string from either alpha or beta
 */
function getPaxString(pkg: any, fallbackPax: number): string {
  const alphaStr = getPkgField(pkg, ["alpha.hi_level.pax_label"]);
  if (typeof alphaStr === "string" && alphaStr.trim()) return alphaStr;

  const betaPax = getPkgField(pkg, ["beta.pax_count"]);
  if (typeof betaPax === "number") {
    return `${betaPax} traveler${betaPax > 1 ? "s" : ""}`;
  }
  if (typeof fallbackPax === "number" && fallbackPax > 0) {
    return `${fallbackPax} traveler${fallbackPax > 1 ? "s" : ""}`;
  }
  return "1 traveler";
}

/**
 * Cabin label string: "Cabin ECONOMY" etc.
 */
function getCabinLabel(pkg: any): string {
  const cabin = getCabin(pkg);
  if (!cabin) return "";
  return `Cabin ${cabin.toUpperCase()}`;
}

/**
 * Build "USD — price TBD" or "1234 USD — total for 2 travelers"
 */
function getPriceSummary(pkg: any, currency: string, pax: number): string {
  const price = getTotalPrice(pkg, currency);
  if (price === "Price TBD") {
    return `${currency} — price TBD`;
  }
  const paxString =
    pax > 1 ? ` — total for ${pax} travelers` : " — total for 1 traveler";
  return `${price}${paxString}`;
}

/**
 * We keep a single function to handle whether the given pkg is "alpha" shape or "beta"
 * for retrieving an ID.
 */
function getPkgId(pkg: any): string {
  const alphaId = getPkgField(pkg, ["alpha.id", "alpha.pkg_id"]);
  if (typeof alphaId === "string" && alphaId.trim()) return alphaId;
  const betaId = getPkgField(pkg, ["beta.id", "beta.pkg_id"]);
  if (typeof betaId === "string" && betaId.trim()) return betaId;
  // fallback: "index-based" or random
  return String(pkg.id ?? Math.random().toString(36).slice(2));
}

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
  onSavedChangeGlobal,
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

  return (
    <div className="bg-[#050816] text-gray-100 rounded-3xl overflow-hidden border border-white/10 shadow-xl">
      {/* Header gradient bar */}
      <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 p-[1px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-pink-500/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-100/80">
              <span>{optionLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-sky-50/90">
              <span className="inline-flex items-center gap-1">
                <span className="text-base">✈️</span>
                <span className="font-semibold">{airlineName || "Flight"}</span>
              </span>
              {travelDate && (
                <>
                  <span className="w-1 h-1 rounded-full bg-sky-100/60" />
                  <span>{travelDate}</span>
                </>
              )}
              {totalDuration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-sky-100/60" />
                  <span>{totalDuration}</span>
                </>
              )}
            </div>
            {(fromCity || toCity) && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-sky-50/90">
                <span className="inline-flex items-center gap-1">
                  <span className="text-base">🛫</span>
                  <span className="font-semibold uppercase">
                    {fromCity || "Origin"}
                  </span>
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-base">🛬</span>
                  <span className="font-semibold uppercase">
                    {toCity || "Destination"}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 text-right">
            <div className="text-xs font-semibold tracking-[0.18em] text-sky-50/80 uppercase">
              {priceSummary}
            </div>
            <button className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/30 transition-colors">
              Trip bundle
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-5 space-y-5 md:space-y-6 bg-[#050816]">
        {/* Hotel + Flight details row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotel bundle */}
          <div className="bg-[#020617] rounded-2xl border border-slate-700/60 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏨</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Hotel bundle
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stay near your destination · {hotelNights} night
                    {hotelNights > 1 ? "s" : ""} · Best-matched picks
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {showHotel && hotels.length > 0 ? (
                <>
                  {!showAllHotels && (
                    <p className="text-xs text-slate-400 mb-1">
                      Showing top hotel matches ·{" "}
                      <span className="font-medium text-slate-200">
                        {hotels.length}
                      </span>{" "}
                      option{hotels.length > 1 ? "s" : ""}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    {(showAllHotels ? hotels : hotels.slice(0, 3)).map(
                      (h, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/70 px-3.5 py-2.5 hover:bg-slate-900/90 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-100">
                                {h.name || h.hotel_name || "Hotel option"}
                              </span>
                              {h.stars && (
                                <span className="text-[11px] text-amber-400">
                                  {"★".repeat(Math.round(h.stars))}{" "}
                                  <span className="text-[10px] text-slate-400">
                                    ({h.stars.toFixed(1)})
                                  </span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              {h.city && <span>{h.city}</span>}
                              {h.distance && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                                  <span>{h.distance}</span>
                                </>
                              )}
                              {h.rating && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                                  <span>Rating {h.rating}</span>
                                </>
                              )}
                            </div>
                            {h.notes && (
                              <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                                {h.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 text-right">
                            {typeof h.price === "number" && (
                              <div className="text-xs font-bold text-emerald-400">
                                {h.price.toLocaleString()}{" "}
                                <span className="text-[11px] text-emerald-300">
                                  {h.currency || currency}
                                </span>
                              </div>
                            )}
                            {h.price_label && (
                              <div className="text-[11px] text-emerald-300">
                                {h.price_label}
                              </div>
                            )}
                            {h.badge && (
                              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                                {h.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {hotels.length > 3 && !showAllHotels && (
                    <p className="mt-2 text-[11px] text-slate-400">
                      + {hotels.length - 3} more hotel
                      {hotels.length - 3 > 1 ? "s" : ""} available in this
                      bundle.
                    </p>
                  )}
                </>
              ) : showHotel ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>•</span>
                  <span>
                    Hotel ideas will appear here when bundling is available.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>•</span>
                  <span>Hotel bundle not requested for this search.</span>
                </div>
              )}
            </div>
          </div>

          {/* Flight details */}
          <div className="bg-[#020617] rounded-2xl border border-slate-700/60 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">✈️</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Flight details
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {totalStops || "Non-stop or 1+ stops"} ·{" "}
                    {cabinLabel || "Cabin details"} · Best time & route match
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {directions.length === 0 ? (
                <div className="text-xs text-slate-400">
                  No detailed itinerary available. Summary: {totalDuration} ·{" "}
                  {totalStops || "Stops info pending"} · {cabinLabel}.
                </div>
              ) : (
                directions.map((dir, dIdx) => (
                  <div key={dIdx} className="space-y-2 text-xs text-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
                        {dir.direction_label}
                      </h4>
                      {dIdx === 0 && (
                        <span className="text-[11px] text-slate-400">
                          {totalDuration}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {dir.segments.map((seg, sIdx) => (
                        <div key={sIdx} className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">
                              {(seg.depart_city || "Origin") +
                                " → " +
                                (seg.arrive_city || "Destination")}
                            </span>
                            {seg.duration && (
                              <span className="text-[11px] text-slate-400">
                                {seg.duration}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                            {seg.depart_time && (
                              <span>Dep {seg.depart_time}</span>
                            )}
                            {seg.arrive_time && (
                              <>
                                <span>·</span>
                                <span>Arr {seg.arrive_time}</span>
                              </>
                            )}
                            {seg.airline && (
                              <>
                                <span>·</span>
                                <span>{seg.airline}</span>
                              </>
                            )}
                            {seg.flight_number && (
                              <>
                                <span>·</span>
                                <span>Flight {seg.flight_number}</span>
                              </>
                            )}
                            {seg.cabin && (
                              <>
                                <span>·</span>
                                <span>Cabin {seg.cabin}</span>
                              </>
                            )}
                          </div>
                          {seg.layover_city && (
                            <div className="pl-2 text-[11px] text-slate-400">
                              Layover in{" "}
                              <span className="font-medium">
                                {seg.layover_city}
                              </span>
                              {seg.layover_duration && (
                                <>
                                  {" "}
                                  · {seg.layover_duration}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  {paxLabel && <span>{paxLabel}</span>}
                  {totalStops && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span>{totalStops}</span>
                    </>
                  )}
                  {cabinLabel && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span>{cabinLabel}</span>
                    </>
                  )}
                </div>
                <p className="mt-1">
                  Times and durations are approximate and may differ slightly at
                  booking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: compare & booking buttons */}
        <div className="pt-3 border-t border-slate-800/70">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCompareClick}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isCompared
                  ? "bg-sky-500 text-white border-sky-400"
                  : "bg-transparent text-slate-200 border-slate-500 hover:bg-slate-800/60"
              }`}
            >
              {isCompared ? "Added to Compare" : "Compare"}
            </button>

            <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/80 text-white hover:bg-sky-500 border border-sky-400 transition-colors">
              Google Flights
            </button>

            {showHotel && (
              <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/90 text-white hover:bg-emerald-500 border border-emerald-400 transition-colors">
                Booking / Hotels
              </button>
            )}

            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 ml-auto">
              <span>More flight options</span>
              <span className="inline-flex items-center rounded-full border border-slate-500/70 px-2 py-0.5">
                Skyscanner
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-500/70 px-2 py-0.5">
                KAYAK
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-500/70 px-2 py-0.5">
                Airline sites
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            {showHotel && (
              <>
                <span>More hotel options</span>
                <span className="inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5">
                  Expedia
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5">
                  Hotels.com
                </span>
              </>
            )}
            <span className="ml-auto">
              Prices and availability are examples only and may change at
              booking.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;

/**
 * Optional: if you need a small utility for "From → To" representation
 * from a segment, you can adapt this. Kept in file in case other
 * components import it.
 */
export function formatSegmentCityPair(seg: SegmentLike): string {
  const from =
    seg.depart_city || seg.depart_airport || seg.arrive_city || "Origin";
  const to =
    seg.arrive_city || seg.arrive_airport || seg.depart_city || "Destination";
  return `${from} → ${to}`;
}

/**
 * Another helper for times in case different shapes appear
 */
export function formatSegmentTimeRange(seg: SegmentLike): string {
  const d =
    seg.depart_time && typeof seg.depart_time === "string"
      ? seg.depart_time
      : "";
  const a =
    seg.arrive_time && typeof seg.arrive_time === "string"
      ? seg.arrive_time
      : "";
  if (!d && !a) return "";
  if (!d) return `Arr ${a}`;
  if (!a) return `Dep ${d}`;
  return `Dep ${d} · Arr ${a}`;
}

/**
 * Utility to get a fallback location label if city is missing
 */
export function getLocationLabel(seg: SegmentLike, kind: "from" | "to") {
  const city =
    kind === "from" ? seg.depart_city || seg.depart_airport : seg.arrive_city || seg.arrive_airport;
  if (city && typeof city === "string") {
    return city;
  }
  return kind === "from" ? "Origin" : "Destination";
}

function getSegTime(seg: SegmentLike, kind: "depart" | "arrive") {
  const keys =
    kind === "depart"
      ? ["depart_time", "departure", "depart"]
      : ["arrive_time", "arrival", "arrive"];

  for (const k of keys) {
    const v = (seg as any)[k];
    if (typeof v === "string" && v.trim()) {
      const str = v.trim();
      // Optional: basic normalisation
      return str;
    }
  }
  return "";
}
