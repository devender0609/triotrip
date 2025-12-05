"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

export interface ResultCardProps {
  pkg: any;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
}

function getCurrencySymbol(code: string) {
  switch (code) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "INR":
      return "₹";
    case "JPY":
      return "¥";
    default:
      return code || "";
  }
}

function formatMoney(amount: number | undefined, currency: string) {
  if (typeof amount !== "number" || !isFinite(amount)) {
    return "price TBD";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(currency)}${Math.round(amount)}`;
  }
}

function formatDuration(mins?: number) {
  if (!mins || !isFinite(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

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
}: ResultCardProps) {
  // ----- flight data safe helpers -----
  const outSegs: any[] = Array.isArray(pkg?.segments_out) ? pkg.segments_out : [];
  const inSegs: any[] = Array.isArray(pkg?.segments_in) ? pkg.segments_in : [];

  const firstOut = outSegs[0] || null;
  const lastOut = outSegs[outSegs.length - 1] || firstOut;
  const firstIn = inSegs[0] || null;
  const lastIn = inSegs[inSegs.length - 1] || firstIn;

  const routeLabel =
    firstOut && lastOut && firstOut.from_code && lastOut.to_code
      ? `${firstOut.from_code} → ${lastOut.to_code}`
      : pkg?.route || "";

  const mainAirline =
    firstOut?.airline ||
    pkg?.carrier_name ||
    (outSegs[0]?.carrier_name as string | undefined) ||
    "Flight";

  const departDate = fmtDate(firstOut?.departure_local || firstOut?.departure_utc);
  const returnDate = fmtDate(firstIn?.departure_local || firstIn?.departure_utc);

  const amount =
    typeof pkg?.price_converted === "number"
      ? pkg.price_converted
      : typeof pkg?.price_usd === "number"
      ? pkg.price_usd
      : undefined;

  const priceLabel = formatMoney(amount, currency);

  const isCompared = pkg?.id && comparedIds.includes(pkg.id);

  const deeplinks = pkg?.deeplinks || {};

  const hotels: any[] = Array.isArray(pkg?.hotels) ? pkg.hotels : [];

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="rounded-3xl bg-slate-950/95 border border-slate-700/70 shadow-[0_20px_40px_rgba(0,0,0,0.55)] overflow-hidden text-slate-50 mb-6 text-[14px]">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 text-white">
        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-[0.2em] opacity-90">
            OPTION {index + 1}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-semibold">{mainAirline}</span>
            {routeLabel && (
              <span className="text-sm opacity-90">
                • {routeLabel}
              </span>
            )}
          </div>
          {(departDate || returnDate) && (
            <div className="text-[11px] opacity-90 mt-0.5">
              {departDate && <>Outbound: {departDate}</>}
              {departDate && returnDate && " • "}
              {returnDate && <>Return: {returnDate}</>}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end">
          <div className="text-xs uppercase tracking-wide opacity-80">
            {currency} — total for {pax} {pax === 1 ? "traveler" : "travelers"}
          </div>
          <div className="text-2xl font-bold leading-tight">{priceLabel}</div>
          {hotelNights > 0 && (
            <div className="mt-1 inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-medium">
              <span className="mr-1.5">🏨</span> {hotelNights} nights hotel
              bundle
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 md:p-6">
        {/* HOTEL COLUMN */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-700/70 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏨</span>
            <h3 className="font-semibold text-[15px] tracking-tight">
              Hotel bundle
            </h3>
          </div>
          {hotels.length === 0 && (
            <p className="text-[13px] text-slate-300">
              Hotel suggestions will appear here when available for this bundle.
            </p>
          )}
          {hotels.length > 0 && (
            <ul className="mt-1 space-y-2">
              {(showAllHotels ? hotels : hotels.slice(0, 3)).map((h, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-800/70 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[14px]">
                      {h.name}
                      {h.star && (
                        <span className="ml-1 text-xs text-amber-300">
                          {h.star}★
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {h.city || pkg.destination_code}
                    </span>
                  </div>
                  <div className="text-right">
                    {typeof h.price_converted === "number" ? (
                      <span className="text-[13px] font-semibold">
                        {formatMoney(h.price_converted, currency)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-300">
                        price TBD
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {hotels.length > 3 && !showAllHotels && (
                <li className="text-[12px] text-slate-300">
                  +{hotels.length - 3} more hotel options in this bundle
                </li>
              )}
            </ul>
          )}
        </div>

        {/* FLIGHT COLUMN */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-700/70 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✈️</span>
            <h3 className="font-semibold text-[15px] tracking-tight">
              Flight details
            </h3>
          </div>

          {/* OUTBOUND */}
          <div className="mb-3">
            <div className="text-[12px] font-semibold uppercase text-sky-300 tracking-wide mb-1">
              Outbound
            </div>
            {outSegs.length === 0 && (
              <p className="text-[12px] text-slate-300 italic">
                Live flight details will appear here once available from our
                partners.
              </p>
            )}
            {outSegs.length > 0 && (
              <div className="space-y-1.5">
                {outSegs.map((seg, i) => {
                  const layoverMins = seg?.layover_minutes || seg?.layover_mins;
                  const layoverCity =
                    seg?.layover_city ||
                    (seg?.to_city as string | undefined) ||
                    seg?.to_code;
                  return (
                    <React.Fragment key={i}>
                      <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-800/70 px-3 py-2">
                        <div>
                          <div className="font-medium text-[13px]">
                            {seg.airline || mainAirline}{" "}
                            {seg.flight_no || seg.flight_number}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {seg.from_code} → {seg.to_code} •{" "}
                            {fmtDate(seg.departure_local || seg.departure_utc)}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-200">
                          <div>
                            {fmtTime(seg.departure_local || seg.departure_utc)}{" "}
                            – {fmtTime(seg.arrival_local || seg.arrival_utc)}
                          </div>
                          {seg.duration_minutes && (
                            <div>{formatDuration(seg.duration_minutes)}</div>
                          )}
                        </div>
                      </div>
                      {layoverMins && i < outSegs.length - 1 && (
                        <div className="ml-3 text-[11px] text-amber-300 italic">
                          Layover in {layoverCity} —{" "}
                          {formatDuration(layoverMins)}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* RETURN */}
          {inSegs.length > 0 && (
            <div>
              <div className="text-[12px] font-semibold uppercase text-emerald-300 tracking-wide mb-1">
                Return
              </div>
              <div className="space-y-1.5">
                {inSegs.map((seg, i) => {
                  const layoverMins = seg?.layover_minutes || seg?.layover_mins;
                  const layoverCity =
                    seg?.layover_city ||
                    (seg?.to_city as string | undefined) ||
                    seg?.to_code;
                  return (
                    <React.Fragment key={i}>
                      <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-800/70 px-3 py-2">
                        <div>
                          <div className="font-medium text-[13px]">
                            {seg.airline || mainAirline}{" "}
                            {seg.flight_no || seg.flight_number}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {seg.from_code} → {seg.to_code} •{" "}
                            {fmtDate(seg.departure_local || seg.departure_utc)}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-200">
                          <div>
                            {fmtTime(seg.departure_local || seg.departure_utc)}{" "}
                            – {fmtTime(seg.arrival_local || seg.arrival_utc)}
                          </div>
                          {seg.duration_minutes && (
                            <div>{formatDuration(seg.duration_minutes)}</div>
                          )}
                        </div>
                      </div>
                      {layoverMins && i < inSegs.length - 1 && (
                        <div className="ml-3 text-[11px] text-amber-300 italic">
                          Layover in {layoverCity} —{" "}
                          {formatDuration(layoverMins)}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Prices and availability are examples and may change at booking.
          </div>
        </div>
      </div>

      {/* LINK ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-[12px]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleCompare(pkg.id)}
            className={`px-3 py-1.5 rounded-full text-[12px] border transition ${
              isCompared
                ? "bg-amber-400/20 border-amber-300 text-amber-200"
                : "bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800"
            }`}
          >
            {isCompared ? "In compare list" : "Compare"}
          </button>

          {deeplinks.google_flights && (
            <a
              href={deeplinks.google_flights}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-[12px] font-medium flex items-center gap-1"
            >
              ✈️ Google Flights
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {deeplinks.booking_com && (
            <a
              href={deeplinks.booking_com}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[12px] font-medium flex items-center gap-1"
            >
              🛏️ Booking.com
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {deeplinks.skyscanner && (
            <a
              href={deeplinks.skyscanner}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-full border border-slate-600 bg-slate-900 hover:bg-slate-800"
            >
              Skyscanner
            </a>
          )}
          {deeplinks.kayak && (
            <a
              href={deeplinks.kayak}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-full border border-slate-600 bg-slate-900 hover:bg-slate-800"
            >
              KAYAK
            </a>
          )}
          {deeplinks.airline_sites && (
            <a
              href={deeplinks.airline_sites}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-full border border-slate-600 bg-slate-900 hover:bg-slate-800"
            >
              Airline sites
            </a>
          )}
          {deeplinks.expedia && (
            <a
              href={deeplinks.expedia}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-full border border-slate-600 bg-slate-900 hover:bg-slate-800"
            >
              Expedia
            </a>
          )}
          {deeplinks.hotels_com && (
            <a
              href={deeplinks.hotels_com}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-full border border-slate-600 bg-slate-900 hover:bg-slate-800"
            >
              Hotels.com
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
