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

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount == null || Number.isNaN(Number(amount))) return "price TBD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency || "USD"} ${Math.round(Number(amount))}`;
  }
}

function minutesToHrsMins(mins?: number) {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

type SegmentLike = {
  from?: string;
  to?: string;
  origin?: string;
  destination?: string;
  depart?: string;
  departure?: string;
  depart_time?: string;
  arrive?: string;
  arrival?: string;
  arrive_time?: string;
  flight_number?: string;
  carrier_code?: string;
  carrier_name?: string;
  duration_minutes?: number;
};

function getSegAirport(seg: SegmentLike, kind: "from" | "to") {
  const keys =
    kind === "from"
      ? ["from", "origin", "from_code", "from_city", "departure_airport"]
      : ["to", "destination", "to_code", "to_city", "arrival_airport"];

  for (const k of keys) {
    const v = (seg as any)[k];
    if (typeof v === "string" && v.trim()) return v.trim();
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
      if (str.includes("T")) return str.slice(11, 16); // HH:MM from ISO
      if (str.length >= 5) return str.slice(-5);        // last HH:MM
      return str;
    }
  }
  return "";
}

function getSegFlightLabel(seg: SegmentLike) {
  const carrier =
    (seg as any).carrier_name ||
    (seg as any).carrier_code ||
    (seg as any).airline ||
    "";
  const num = (seg as any).flight_number || (seg as any).number || "";
  if (carrier && num) return `${carrier} ${num}`;
  if (carrier) return String(carrier);
  if (num) return `Flight ${num}`;
  return "Flight";
}

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
  const id = pkg?.id ?? `opt-${index + 1}`;
  const optionLabel = `Option ${index + 1}`;

  // Price & currency
  const pkgCurrency =
    currency || pkg?.currency || pkg?.price_currency || "USD";
  const totalPrice =
    pkg?.price_converted ??
    pkg?.total_price ??
    pkg?.price_usd ??
    null;

  // Hotel bundle
  const hotelBundle = pkg?.hotel_bundle || pkg?.hotels || {};
  const hotelTitle =
    hotelBundle.title || hotelBundle.name || "Hotel bundle";
  const hotelList: any[] =
    hotelBundle.hotels ||
    hotelBundle.options ||
    [];

  // Flight data (defensive)
  const flight =
    pkg?.flight ||
    pkg?.flight_option ||
    (pkg?.carrier_name ? pkg : null);

  const carrierName =
    flight?.carrier_name ||
    flight?.marketing_carrier ||
    "Flight";

  const flightLabel = `${carrierName}`;
  const cabin = flight?.cabin || "ECONOMY";
  const stops = typeof flight?.stops === "number" ? flight.stops : 0;
  const greener = !!flight?.greener;
  const refundable = !!flight?.refundable;
  const duration = minutesToHrsMins(flight?.duration_minutes);

  const segOut: SegmentLike[] = Array.isArray(flight?.segments_out)
    ? flight.segments_out
    : [];
  const segIn: SegmentLike[] = Array.isArray(flight?.segments_in)
    ? flight.segments_in
    : [];

  const deeplinks = flight?.deeplinks || {};
  const googleFlightsUrl =
    deeplinks.googleFlights ||
    deeplinks.google_flights ||
    deeplinks.google ||
    "";
  const skyscannerUrl = deeplinks.skyscanner || "";
  const kayakUrl = deeplinks.kayak || "";
  const airlineUrl =
    deeplinks.airline ||
    deeplinks.airlineSites ||
    deeplinks.carrier ||
    "";
  const expediaUrl = deeplinks.expedia || "";
  const hotelsUrl =
    deeplinks.hotels || deeplinks.hotelsCom || "";
  const bookingUrl =
    hotelBundle?.deeplinks?.booking ||
    deeplinks.booking ||
    "";

  const compareActive = comparedIds.includes(id);

  return (
    <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/90 text-slate-50 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 text-sm md:text-base"
        style={{
          background:
            "linear-gradient(90deg, #0ea5e9 0%, #6366f1 40%, #ec4899 100%)",
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase tracking-widest text-slate-100/80">
            {optionLabel}
          </div>
          <div className="font-semibold text-base md:text-lg flex items-center gap-2">
            ✈️ Flight
            {flightLabel && (
              <span className="ml-2 text-slate-100/90 text-sm md:text-base">
                {flightLabel}
              </span>
            )}
          </div>
          <div className="text-xs md:text-sm text-slate-100/80">
            {pax} traveler{pax > 1 ? "s" : ""} • Cabin {cabin}
            {duration && <> • {duration} total</>}
            {stops != null && (
              <>
                {" "}
                • {stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? "s" : ""}`}
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[0.7rem] md:text-xs text-slate-100/80">
            {pkgCurrency} — total for {pax} traveler
            {pax > 1 ? "s" : ""}
          </div>
          <div className="text-xl md:text-2xl font-bold text-slate-50">
            {formatMoney(totalPrice, pkgCurrency)}
          </div>
          {hotelNights > 0 && showHotel && (
            <div className="mt-1 inline-flex items-center rounded-full bg-slate-950/25 px-3 py-1 text-[0.7rem] md:text-xs text-slate-100/90 border border-white/30">
              🏨 {hotelNights} night{hotelNights > 1 ? "s" : ""} hotel bundle
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 px-4 py-4 md:px-6 md:py-5 md:grid-cols-2">
        {/* Hotel bundle */}
        {showHotel && (
          <div className="rounded-2xl bg-slate-900/70 px-4 py-3 md:px-5 md:py-4">
            <div className="mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
              <span>🏨 Hotel bundle</span>
            </div>
            <div className="mb-2 text-xs md:text-sm text-slate-400">
              {hotelTitle || "Suggested hotels for this trip."}
            </div>

            <ul className="mt-2 space-y-2 text-xs md:text-sm">
              {Array.isArray(hotelList) && hotelList.length > 0 ? (
                hotelList.map((h, i) => {
                  const name = h?.name || "Hotel option";
                  const stars = h?.star || h?.stars;
                  const city = h?.city || "";
                  const nightly =
                    h?.price_converted ??
                    h?.price ??
                    h?.price_usd ??
                    null;
                  const nightlyStr =
                    nightly != null
                      ? formatMoney(nightly, h?.currency || pkgCurrency)
                      : "";

                  return (
                    <li
                      key={`${name}-${i}`}
                      className="flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2"
                    >
                      <div>
                        <div className="font-medium text-slate-50">
                          {name}
                          {stars ? (
                            <span className="ml-1 text-amber-400">
                              {"★".repeat(Math.round(Number(stars)))}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[0.7rem] md:text-xs text-slate-400">
                          {city || "Hotel"} • {hotelNights} night
                          {hotelNights > 1 ? "s" : ""}
                        </div>
                      </div>
                      {nightlyStr && (
                        <div className="text-right text-[0.7rem] md:text-xs text-slate-200">
                          {nightlyStr}
                          <div className="text-slate-500">
                            per night (approx)
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-slate-400">
                  Hotel ideas will appear here when bundling is available.
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Flight details */}
        <div className="rounded-2xl bg-slate-900/70 px-4 py-3 md:px-5 md:py-4">
          <div className="mb-2 flex items-center justify-between text-sm md:text-base font-semibold">
            <span>✈️ Flight details</span>
          </div>

          {flight ? (
            <div className="space-y-3 text-xs md:text-sm">
              {/* Outbound */}
              {segOut.length > 0 && (
                <div>
                  <div className="mb-1 font-semibold text-slate-200">
                    Outbound
                  </div>
                  <ul className="space-y-1.5">
                    {segOut.map((seg: SegmentLike, i: number) => {
                      const from = getSegAirport(seg, "from");
                      const to = getSegAirport(seg, "to");
                      const dep = getSegTime(seg, "depart");
                      const arr = getSegTime(seg, "arrive");
                      const lab = getSegFlightLabel(seg);
                      const dur = minutesToHrsMins(
                        seg.duration_minutes as number
                      );

                      return (
                        <li key={`out-${i}`} className="pl-1">
                          <div className="font-medium text-slate-50">
                            {from} → {to}{" "}
                            <span className="text-[0.7rem] md:text-xs text-slate-400 ml-1">
                              {lab}
                            </span>
                          </div>
                          <div className="text-[0.7rem] md:text-xs text-slate-400">
                            {dep && <span>Dep {dep}</span>}
                            {dep && arr && <span> • </span>}
                            {arr && <span>Arr {arr}</span>}
                            {dur && <span> • {dur}</span>}
                          </div>
                          {i < segOut.length - 1 && (
                            <div className="text-[0.7rem] md:text-xs text-amber-300 mt-0.5">
                              Layover between flights
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Return */}
              {segIn.length > 0 && (
                <div>
                  <div className="mt-2 mb-1 font-semibold text-slate-200">
                    Return
                  </div>
                  <ul className="space-y-1.5">
                    {segIn.map((seg: SegmentLike, i: number) => {
                      const from = getSegAirport(seg, "from");
                      const to = getSegAirport(seg, "to");
                      const dep = getSegTime(seg, "depart");
                      const arr = getSegTime(seg, "arrive");
                      const lab = getSegFlightLabel(seg);
                      const dur = minutesToHrsMins(
                        seg.duration_minutes as number
                      );

                      return (
                        <li key={`in-${i}`} className="pl-1">
                          <div className="font-medium text-slate-50">
                            {from} → {to}{" "}
                            <span className="text-[0.7rem] md:text-xs text-slate-400 ml-1">
                              {lab}
                            </span>
                          </div>
                          <div className="text-[0.7rem] md:text-xs text-slate-400">
                            {dep && <span>Dep {dep}</span>}
                            {dep && arr && <span> • </span>}
                            {arr && <span>Arr {arr}</span>}
                            {dur && <span> • {dur}</span>}
                          </div>
                          {i < segIn.length - 1 && (
                            <div className="text-[0.7rem] md:text-xs text-amber-300 mt-0.5">
                              Layover between flights
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Meta */}
              <div className="mt-2 text-[0.7rem] md:text-xs text-slate-400 space-x-2">
                <span>{stops === 0 ? "Nonstop" : `${stops} stop(s)`}</span>
                <span>• Cabin {cabin}</span>
                {refundable && <span>• Refundable</span>}
                {greener && <span>• Greener option</span>}
              </div>
            </div>
          ) : (
            <div className="text-xs md:text-sm text-slate-400">
              Live flight details will appear here once available from our
              partners.
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-800 px-4 py-3 md:px-6 md:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs md:text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleCompare(id)}
            className={`rounded-full px-4 py-1.5 border text-xs md:text-sm ${
              compareActive
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                : "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400"
            }`}
          >
            {compareActive ? "✓ In comparison" : "Compare"}
          </button>

          {googleFlightsUrl && (
            <a
              href={googleFlightsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-1.5 text-xs md:text-sm font-medium bg-sky-500 hover:bg-sky-400 text-slate-950"
            >
              Google Flights
            </a>
          )}

          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-1.5 text-xs md:text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              Booking.com
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] md:text-xs">
          {skyscannerUrl && (
            <a
              href={skyscannerUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-600 px-3 py-1 hover:border-sky-400"
            >
              Skyscanner
            </a>
          )}
          {kayakUrl && (
            <a
              href={kayakUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-600 px-3 py-1 hover:border-amber-400"
            >
              KAYAK
            </a>
          )}
          {airlineUrl && (
            <a
              href={airlineUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-600 px-3 py-1 hover:border-emerald-400"
            >
              Airline sites
            </a>
          )}

          {expediaUrl && (
            <a
              href={expediaUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-600 px-3 py-1 hover:border-indigo-400"
            >
              Expedia
            </a>
          )}
          {hotelsUrl && (
            <a
              href={hotelsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-600 px-3 py-1 hover:border-pink-400"
            >
              Hotels.com
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-slate-900/80 bg-slate-950/80 px-4 py-2 md:px-6 md:py-2.5 text-[0.65rem] md:text-[0.7rem] text-slate-500">
        Prices and availability are examples only and may change at booking.
      </div>
    </div>
  );
};

export default ResultCard;
