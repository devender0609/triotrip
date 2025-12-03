"use client";

import React from "react";
import {
  Plane,
  Hotel,
  Clock,
  ExternalLink,
} from "lucide-react";

export interface ResultCardProps {
  pkg: any;                 // your flight+hotel package object
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

type CurrencyCode = string;

// Flexible helper types – we don’t force your data to match exactly
type FlightLeg = {
  from?: string;
  to?: string;
  departure?: string;     // formatted date+time
  arrival?: string;       // formatted date+time
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

type FlightInfo = {
  outbound?: FlightDirection;
  inbound?: FlightDirection;
  cabin?: string;
  totalDuration?: string;
};

type HotelBundle = {
  name?: string;
  priceText?: string;
  nightsText?: string;
  hotels?: string[];
};

const badgeBase =
  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide";
const pillButtonBase =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-shadow duration-150";
const chipBase =
  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-100 border border-slate-700/60";

const ResultCard: React.FC<ResultCardProps> = ({
  pkg,
  index,
  currency,
  // we ignore the rest for layout, but they’re accepted so TS is happy
}) => {
  const currencyCode: CurrencyCode = currency || "USD";

  // Try to pull common fields off your pkg object with fallbacks
  const title: string =
    pkg?.title ||
    pkg?.label ||
    pkg?.name ||
    `Option ${index + 1}`;

  const priceText: string =
    pkg?.priceText ||
    pkg?.displayPrice ||
    pkg?.totalPriceText ||
    (pkg?.totalPrice ? `${currencyCode} ${pkg.totalPrice}` : "") ||
    `${currencyCode} — price TBD`;

  const totalNightsText: string =
    pkg?.totalNightsText ||
    (pkg?.nights ? `${pkg.nights} nights hotel` : "") ||
    "Trip bundle";

  const hotelBundle: HotelBundle = {
    name:
      pkg?.hotelBundle?.name ||
      pkg?.hotelName ||
      pkg?.primaryHotel ||
      "Curated stay close to main attractions",
    priceText:
      pkg?.hotelBundle?.priceText ||
      pkg?.hotelPriceText ||
      pkg?.hotelPrice,
    nightsText:
      pkg?.hotelBundle?.nightsText ||
      (pkg?.hotelNights ? `${pkg.hotelNights} nights` : undefined),
    hotels:
      pkg?.hotelBundle?.hotels ||
      pkg?.hotels ||
      pkg?.hotelOptions ||
      [],
  };

  const flightRaw: FlightInfo =
    pkg?.flight ||
    pkg?.flightInfo ||
    pkg?.flights ||
    {};

  const outbound: FlightDirection | undefined =
    flightRaw.outbound || flightRaw["outboundFlight"];
  const inbound: FlightDirection | undefined =
    flightRaw.inbound || flightRaw["returnFlight"];

  const hasDetailedOutbound =
    outbound?.legs && outbound.legs.length > 0;
  const hasDetailedInbound =
    inbound?.legs && inbound.legs.length > 0;

  const totalDuration = flightRaw.totalDuration || pkg?.totalDuration;

  // External booking URLs – can be wired up later
  const googleFlightsUrl = "#";
  const bookingUrl = "#";
  const airlineSitesUrl = "#";
  const skyscannerUrl = "#";
  const kayakUrl = "#";
  const expediaUrl = "#";
  const hotelsUrl = "#";

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-xl overflow-hidden mb-6">
      {/* HEADER STRIP */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-sky-500 via-blue-500 to-pink-500 text-white">
        <div className="flex flex-col gap-1">
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
            {String(title).toUpperCase()}
          </div>

          {hasDetailedOutbound && outbound?.legs && outbound.legs.length > 0 && (
            <div className="text-xs sm:text-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-white/90">
              <span className="inline-flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {outbound.legs[0].from}{" "}
                  <span className="mx-1">→</span>
                  {outbound.legs[outbound.legs.length - 1].to}
                </span>
              </span>
              {totalDuration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/60" />
                  <span>{totalDuration}</span>
                </>
              )}
              {outbound.layovers && outbound.layovers.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/60" />
                  <span>
                    {outbound.layovers.length}{" "}
                    {outbound.layovers.length === 1
                      ? "stop"
                      : "stops"}
                  </span>
                </>
              )}
            </div>
          )}

          {!hasDetailedOutbound && outbound?.summary && (
            <div className="text-xs sm:text-sm text-white/90 flex items-center gap-2">
              <Plane className="w-3.5 h-3.5" />
              <span>{outbound.summary}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-lg sm:text-2xl font-extrabold drop-shadow-sm">
            {priceText}
          </div>
          <div
            className={`${badgeBase} bg-white/15 border border-white/30 text-[11px] sm:text-xs`}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            {totalNightsText}
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-5 px-4 sm:px-6 pt-4 sm:pt-5 pb-1">
        {/* HOTEL BUNDLE */}
        <section className="rounded-2xl bg-slate-950/60 border border-slate-700/80 px-4 sm:px-5 py-4 sm:py-5">
          <div className="flex items-center gap-2 mb-3">
            <Hotel className="w-4 h-4 text-amber-400" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-50">
              Hotel bundle
            </h3>
          </div>

          <div className="space-y-1.5 text-slate-100">
            <div className="font-semibold text-sm sm:text-base">
              {hotelBundle.name}
            </div>
            {hotelBundle.priceText && (
              <div className="text-xs sm:text-sm text-emerald-300">
                {hotelBundle.priceText}
              </div>
            )}
            {hotelBundle.nightsText && (
              <div className="text-xs sm:text-sm text-slate-300">
                {hotelBundle.nightsText}
              </div>
            )}
          </div>

          {hotelBundle.hotels &&
            hotelBundle.hotels.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-slate-100">
                {hotelBundle.hotels.map((h: string, i: number) => (
                  <li key={i} className="list-disc ml-5">
                    {h}
                  </li>
                ))}
              </ul>
            )}
        </section>

        {/* FLIGHT DETAILS */}
        <section className="rounded-2xl bg-slate-950/60 border border-slate-700/80 px-4 sm:px-5 py-4 sm:py-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-50 mb-3 flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-400" />
            Flight details
          </h3>

          <div className="space-y-4 text-xs sm:text-sm text-slate-100">
            {/* OUTBOUND */}
            {outbound && (
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-50">
                  Outbound
                </p>

                {hasDetailedOutbound && outbound.legs && (
                  <>
                    {outbound.legs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">
                            {leg.from}{" "}
                            <span className="mx-1 text-slate-300">
                              →
                            </span>
                            {leg.to}
                          </span>
                          {leg.airline && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-500" />
                              <span>{leg.airline}</span>
                            </>
                          )}
                          {leg.flightNumber && (
                            <span className="text-slate-300">
                              {leg.flightNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-slate-300">
                          {leg.departure && (
                            <span className="whitespace-nowrap">
                              Dep: {leg.departure}
                            </span>
                          )}
                          {leg.arrival && (
                            <span className="whitespace-nowrap">
                              Arr: {leg.arrival}
                            </span>
                          )}
                          {leg.duration && (
                            <span className="whitespace-nowrap">
                              • {leg.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {outbound.layovers &&
                      outbound.layovers.length > 0 && (
                        <div className="mt-1 text-[11px] sm:text-xs text-amber-200">
                          {outbound.layovers.map((l, i) => (
                            <div key={i}>
                              Layover in{" "}
                              <span className="font-semibold">
                                {l.airport}
                              </span>
                              {l.duration
                                ? ` — ${l.duration}`
                                : ""}
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                )}

                {!hasDetailedOutbound &&
                  outbound.summary && (
                    <p className="text-slate-100">
                      {outbound.summary}
                    </p>
                  )}
              </div>
            )}

            {/* RETURN / INBOUND */}
            {inbound && (
              <div className="space-y-1.5 border-t border-slate-700/70 pt-3">
                <p className="font-semibold text-slate-50">
                  Return
                </p>

                {hasDetailedInbound && inbound.legs && (
                  <>
                    {inbound.legs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">
                            {leg.from}{" "}
                            <span className="mx-1 text-slate-300">
                              →
                            </span>
                            {leg.to}
                          </span>
                          {leg.airline && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-500" />
                              <span>{leg.airline}</span>
                            </>
                          )}
                          {leg.flightNumber && (
                            <span className="text-slate-300">
                              {leg.flightNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-slate-300">
                          {leg.departure && (
                            <span className="whitespace-nowrap">
                              Dep: {leg.departure}
                            </span>
                          )}
                          {leg.arrival && (
                            <span className="whitespace-nowrap">
                              Arr: {leg.arrival}
                            </span>
                          )}
                          {leg.duration && (
                            <span className="whitespace-nowrap">
                              • {leg.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {inbound.layovers &&
                      inbound.layovers.length > 0 && (
                        <div className="mt-1 text-[11px] sm:text-xs text-amber-200">
                          {inbound.layovers.map((l, i) => (
                            <div key={i}>
                              Layover in{" "}
                              <span className="font-semibold">
                                {l.airport}
                              </span>
                              {l.duration
                                ? ` — ${l.duration}`
                                : ""}
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                )}

                {!hasDetailedInbound &&
                  inbound.summary && (
                    <p className="text-slate-100">
                      {inbound.summary}
                    </p>
                  )}
              </div>
            )}

            {flightRaw.cabin && (
              <p className="text-[11px] sm:text-xs text-slate-200">
                <span className="font-semibold">Cabin:</span>{" "}
                {flightRaw.cabin}
              </p>
            )}

            {totalDuration && (
              <p className="text-[11px] sm:text-xs text-slate-200">
                <span className="font-semibold">
                  Total travel time:
                </span>{" "}
                {totalDuration}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ACTION ROWS */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 pb-3 sm:pb-4 pt-1">
        <button
          className={`${pillButtonBase} bg-slate-800 text-slate-50`}
          type="button"
        >
          Compare
        </button>

        <a
          href={googleFlightsUrl}
          target="_blank"
          rel="noreferrer"
          className={`${pillButtonBase} bg-sky-500 hover:bg-sky-400 text-white`}
        >
          <Plane className="w-4 h-4" />
          Google Flights
        </a>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noreferrer"
          className={`${pillButtonBase} bg-emerald-500 hover:bg-emerald-400 text-white`}
        >
          <Hotel className="w-4 h-4" />
          Booking.com
        </a>
      </div>

      <div className="px-4 sm:px-6 pb-4 flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-slate-300 border-t border-slate-800/80 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-100">
            More flight options
          </span>
          <a
            href={skyscannerUrl}
            target="_blank"
            rel="noreferrer"
            className={`${chipBase} bg-sky-900/90 border-sky-600/80`}
          >
            Skyscanner
          </a>
          <a
            href={kayakUrl}
            target="_blank"
            rel="noreferrer"
            className={`${chipBase} bg-indigo-900/90 border-indigo-600/80`}
          >
            KAYAK
          </a>
          <a
            href={airlineSitesUrl}
            target="_blank"
            rel="noreferrer"
            className={`${chipBase} bg-slate-900/90 border-slate-600/80`}
          >
            Airline sites
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-100">
            More hotel options
          </span>
          <a
            href={expediaUrl}
            target="_blank"
            rel="noreferrer"
            className={`${chipBase} bg-amber-900/90 border-amber-600/80`}
          >
            Expedia
          </a>
          <a
            href={hotelsUrl}
            target="_blank"
            rel="noreferrer"
            className={`${chipBase} bg-emerald-900/90 border-emerald-600/80`}
          >
            Hotels.com
          </a>
        </div>

        <div className="ml-auto text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Prices and availability are examples and may change at booking.
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
