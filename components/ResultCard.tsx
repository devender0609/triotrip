"use client";

import React from "react";
import { Plane, Hotel, Clock, ExternalLink } from "lucide-react";

export interface ResultCardProps {
  pkg: any; // flight + hotel package
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
  hotels?: any[]; // can be strings OR objects
};

const badgeBase =
  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide";
const pillButtonBase =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-shadow duration-150";
const chipBase =
  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-100 border border-slate-700/60";

const ResultCard: React.FC<ResultCardProps> = ({ pkg, index, currency }) => {
  // If pkg is missing for any reason, don't render the card at all
  if (!pkg) return null;

  const currencyCode: CurrencyCode = currency || "USD";

  const title: string =
    pkg.title || pkg.label || pkg.name || `Option ${index + 1}`;

  const totalPrice = pkg.totalPrice ?? pkg.price ?? pkg.amount;

  const priceText: string =
    pkg.priceText ||
    pkg.displayPrice ||
    pkg.totalPriceText ||
    (totalPrice != null
      ? `${currencyCode} ${String(totalPrice)}`
      : `${currencyCode} — price TBD`);

  const totalNightsText: string =
    pkg.totalNightsText ||
    (pkg.nights ? `${pkg.nights} nights hotel` : "") ||
    "Trip bundle";

  const hotelBundleRaw: any = pkg.hotelBundle || pkg.hotel || pkg.hotels || {};

  const hotelBundle: HotelBundle = {
    name:
      hotelBundleRaw.name ||
      pkg.hotelName ||
      pkg.primaryHotel ||
      "Curated stay close to main attractions",
    priceText:
      hotelBundleRaw.priceText || pkg.hotelPriceText || pkg.hotelPrice,
    nightsText:
      hotelBundleRaw.nightsText ||
      (pkg.hotelNights ? `${pkg.hotelNights} nights` : undefined),
    hotels: Array.isArray(hotelBundleRaw.hotels)
      ? hotelBundleRaw.hotels
      : Array.isArray(pkg.hotels)
      ? pkg.hotels
      : [],
  };

  const flightRaw: FlightInfo = pkg.flight || pkg.flightInfo || pkg.flights || {};

  const outbound: FlightDirection | undefined =
    (flightRaw as any).outbound ||
    (flightRaw as any).outboundFlight ||
    (pkg as any).outbound;

  const inbound: FlightDirection | undefined =
    (flightRaw as any).inbound ||
    (flightRaw as any).returnFlight ||
    (pkg as any).inbound;

  const outboundLegs: FlightLeg[] = Array.isArray(outbound?.legs)
    ? outbound!.legs!
    : [];
  const inboundLegs: FlightLeg[] = Array.isArray(inbound?.legs)
    ? inbound!.legs!
    : [];

  const outboundLayovers: LayoverInfo[] = Array.isArray(outbound?.layovers)
    ? outbound!.layovers!
    : [];
  const inboundLayovers: LayoverInfo[] = Array.isArray(inbound?.layovers)
    ? inbound!.layovers!
    : [];

  const hasDetailedOutbound = outboundLegs.length > 0;
  const hasDetailedInbound = inboundLegs.length > 0;

  const totalDuration = flightRaw.totalDuration || (pkg as any).totalDuration;
  const cabin = flightRaw.cabin || (pkg as any).cabin;

  // Stub URLs – you can wire with real deeplinks later
  const googleFlightsUrl = "#";
  const bookingUrl = "#";
  const airlineSitesUrl = "#";
  const skyscannerUrl = "#";
  const kayakUrl = "#";
  const expediaUrl = "#";
  const hotelsUrl = "#";

  // Helper to render each hotel entry safely
  const renderHotelRow = (hotel: any, i: number) => {
    if (hotel == null) return null;

    // If it's a simple string, just show it
    if (typeof hotel === "string" || typeof hotel === "number") {
      return (
        <li key={i} className="list-disc ml-5">
          {String(hotel)}
        </li>
      );
    }

    // If it's an object (with keys like name, star, city, price_converted, currency, imageUrl, deeplinks)
    if (typeof hotel === "object") {
      const name = hotel.name || "Hotel";
      const star = hotel.star ? `${hotel.star}★` : "";
      const city = hotel.city || "";
      const price =
        hotel.price_converted && hotel.currency
          ? `${hotel.price_converted} ${hotel.currency}`
          : "";
      const deeplink: string | undefined =
        hotel.deeplinks?.[0] ||
        hotel.deeplink ||
        hotel.url ||
        undefined;

      return (
        <li key={i} className="ml-1 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 rounded-xl bg-slate-900/70 border border-slate-700/80 px-3 py-2">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-50 text-sm">
                {name}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-300">
                {star && <span className="mr-1">{star}</span>}
                {city}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {price && (
                <span className="text-xs sm:text-sm font-semibold text-emerald-300">
                  {price}
                </span>
              )}
              {deeplink && (
                <a
                  href={deeplink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white"
                >
                  View deal
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </li>
      );
    }

    // Fallback – shouldn't really get here, but just in case
    return (
      <li key={i} className="list-disc ml-5">
        {String(hotel)}
      </li>
    );
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-xl overflow-hidden mb-6">
      {/* HEADER STRIP */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-sky-500 via-blue-500 to-pink-500 text-white">
        <div className="flex flex-col gap-1">
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
            {String(title).toUpperCase()}
          </div>

          {hasDetailedOutbound && outboundLegs.length > 0 && (
            <div className="text-xs sm:text-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-white/90">
              <span className="inline-flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {outboundLegs[0]?.from}{" "}
                  <span className="mx-1">→</span>
                  {outboundLegs[outboundLegs.length - 1]?.to}
                </span>
              </span>
              {totalDuration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/60" />
                  <span>{totalDuration}</span>
                </>
              )}
              {outboundLayovers.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/60" />
                  <span>
                    {outboundLayovers.length}{" "}
                    {outboundLayovers.length === 1 ? "stop" : "stops"}
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

          {Array.isArray(hotelBundle.hotels) &&
            hotelBundle.hotels.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-slate-100">
                {hotelBundle.hotels.map(renderHotelRow)}
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
                <p className="font-semibold text-slate-50">Outbound</p>

                {hasDetailedOutbound && outboundLegs.length > 0 ? (
                  <>
                    {outboundLegs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">
                            {leg.from}{" "}
                            <span className="mx-1 text-slate-300">→</span>
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

                    {outboundLayovers.length > 0 && (
                      <div className="mt-1 text-[11px] sm:text-xs text-amber-200">
                        {outboundLayovers.map((l, i) => (
                          <div key={i}>
                            Layover in{" "}
                            <span className="font-semibold">{l.airport}</span>
                            {l.duration ? ` — ${l.duration}` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : outbound.summary ? (
                  <p className="text-slate-100">{outbound.summary}</p>
                ) : (
                  <p className="text-slate-400">
                    Flight details not available.
                  </p>
                )}
              </div>
            )}

            {/* RETURN / INBOUND */}
            {inbound && (
              <div className="space-y-1.5 border-t border-slate-700/70 pt-3">
                <p className="font-semibold text-slate-50">Return</p>

                {hasDetailedInbound && inboundLegs.length > 0 ? (
                  <>
                    {inboundLegs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">
                            {leg.from}{" "}
                            <span className="mx-1 text-slate-300">→</span>
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

                    {inboundLayovers.length > 0 && (
                      <div className="mt-1 text-[11px] sm:text-xs text-amber-200">
                        {inboundLayovers.map((l, i) => (
                          <div key={i}>
                            Layover in{" "}
                            <span className="font-semibold">{l.airport}</span>
                            {l.duration ? ` — ${l.duration}` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : inbound.summary ? (
                  <p className="text-slate-100">{inbound.summary}</p>
                ) : (
                  <p className="text-slate-400">
                    Flight details not available.
                  </p>
                )}
              </div>
            )}

            {cabin && (
              <p className="text-[11px] sm:text-xs text-slate-200">
                <span className="font-semibold">Cabin:</span> {cabin}
              </p>
            )}

            {totalDuration && (
              <p className="text-[11px] sm:text-xs text-slate-200">
                <span className="font-semibold">Total travel time:</span>{" "}
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
