// components/ResultCard.tsx
import React from "react";

export interface ResultCardProps {
  pkg: any;                        // flight + hotel package (mock or real)
  currency: string;                // selected currency from header (USD, INR, etc.)
  pax: number;                     // number of travelers
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
}

const formatDuration = (minutes?: number) => {
  if (!minutes || isNaN(minutes)) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const ResultCard: React.FC<ResultCardProps> = ({
  pkg,
  currency,
  pax,
  showHotel,
  hotelNights,
  showAllHotels,
  comparedIds,
  onToggleCompare,
}) => {
  const id = pkg?.id ?? "option-1";

  // -------- Top summary info (safe access) ----------
  const carrierName =
    pkg?.carrier_name || pkg?.carrier || pkg?.airline || "Flight";
  const routeSummary =
    pkg?.route ||
    pkg?.routeSummary ||
    pkg?.summary ||
    `${pkg?.origin ?? ""} → ${pkg?.destination ?? ""}`.trim() ||
    "Route TBD";
  const totalDuration = formatDuration(pkg?.duration_minutes);
  const stops = typeof pkg?.stops === "number" ? pkg.stops : undefined;

  // price in active currency (simple choice, no conversion math)
  const priceRaw =
    pkg?.price_converted ??
    pkg?.[`price_${currency?.toLowerCase?.()}`] ??
    pkg?.price_usd ??
    pkg?.price;
  const priceLabel =
    priceRaw != null && !isNaN(Number(priceRaw))
      ? `${currency} ${Number(priceRaw).toFixed(0)}`
      : `${currency} — price TBD`;

  // -------- Flights (outbound / return) -------------
  const outSegments =
    pkg?.segments_out || pkg?.outboundSegments || pkg?.outbound || [];
  const inSegments =
    pkg?.segments_in || pkg?.returnSegments || pkg?.inbound || [];

  const cabin = pkg?.cabin || pkg?.cabin_class || "ECONOMY";

  const isCompared = comparedIds?.includes(id);

  // -------- Hotels  ---------------------------------
  const hotels = pkg?.hotels || pkg?.hotelOptions || [];
  const hotelTitle = pkg?.hotel_bundle_title || "Hotel bundle";

  const googleFlightsUrl = pkg?.deeplinks?.google_flights || "#";
  const bookingUrl = pkg?.deeplinks?.booking || "#";
  const skyscannerUrl = pkg?.deeplinks?.skyscanner || "#";
  const kayakUrl = pkg?.deeplinks?.kayak || "#";
  const airlineUrl = pkg?.deeplinks?.airline || "#";
  const expediaUrl = pkg?.deeplinks?.expedia || "#";
  const hotelsComUrl = pkg?.deeplinks?.hotels || "#";

  return (
    <div className="mt-6 rounded-3xl bg-neutral-950/95 shadow-xl shadow-black/50 overflow-hidden border border-white/5 text-[14px] text-slate-100">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 px-5 py-3 text-sm sm:text-base">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-white/95">
            <span>OPTION {pkg?.index != null ? pkg.index + 1 : 1}</span>
            <span className="text-xs sm:text-sm font-normal opacity-90">
              ✈ Flight · {carrierName}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-white/90">
            {routeSummary}
            {totalDuration && (
              <span className="ml-2 opacity-90">• {totalDuration} total</span>
            )}
            {typeof stops === "number" && (
              <span className="ml-2 opacity-90">
                • {stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`}
              </span>
            )}
            <span className="ml-2 opacity-90">• Cabin {cabin}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] sm:text-xs text-white/80">
            {currency} — total for {pax} traveler{pax > 1 ? "s" : ""}
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {priceLabel}
          </div>
          {hotelNights ? (
            <div className="mt-1 inline-flex items-center rounded-full bg-black/30 px-3 py-0.5 text-[11px] text-white/90">
              🏨 {hotelNights} night{hotelNights > 1 ? "s" : ""} hotel bundle
            </div>
          ) : (
            <div className="mt-1 inline-flex items-center rounded-full bg-black/30 px-3 py-0.5 text-[11px] text-white/90">
              ✈ Flight only (mock data)
            </div>
          )}
        </div>
      </div>

      {/* MAIN BODY: two columns */}
      <div className="flex flex-col gap-4 px-5 pb-4 pt-5 md:flex-row md:gap-6">
        {/* LEFT: Hotels */}
        <div className="md:w-1/2 rounded-2xl bg-slate-950/70 border border-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
            <span>🏨 {hotelTitle}</span>
          </div>

          {showHotel && hotels?.length > 0 ? (
            <ul className="space-y-2">
              {hotels.slice(0, showAllHotels ? hotels.length : 3).map(
                (h: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-baseline justify-between rounded-xl bg-slate-900/80 px-3 py-2 text-[13px]"
                  >
                    <div>
                      <div className="font-semibold">
                        {h?.name || `Hotel ${idx + 1}`}
                        {h?.star && (
                          <span className="ml-1 text-xs text-amber-300">
                            {h.star}★
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {h?.city || pkg?.destination || "Destination"}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-50">
                        {currency}{" "}
                        {h?.price_converted != null
                          ? Number(h.price_converted).toFixed(0)
                          : h?.price
                          ? h.price
                          : "—"}
                      </div>
                      <div className="text-[11px] text-slate-400">per night</div>
                    </div>
                  </li>
                )
              )}
              {!showAllHotels && hotels.length > 3 && (
                <div className="mt-1 text-[11px] text-slate-400">
                  +{hotels.length - 3} more hotel option
                  {hotels.length - 3 > 1 ? "s" : ""} in this bundle
                </div>
              )}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">
              Hotel ideas will appear here when hotel bundling is added. For now,
              this is a mock layout using your current data.
            </p>
          )}
        </div>

        {/* RIGHT: Flight details */}
        <div className="md:w-1/2 rounded-2xl bg-slate-950/70 border border-white/5 p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-50">
            <span>✈ Flight details</span>
            <span className="text-[11px] font-normal text-slate-400">
              Cabin: {cabin}
            </span>
          </div>

          {/* OUTBOUND */}
          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
              Outbound
            </div>
            {Array.isArray(outSegments) && outSegments.length > 0 ? (
              <div className="space-y-1.5">
                {outSegments.map((seg: any, idx: number) => (
                  <React.Fragment key={idx}>
                    <div className="text-[13px]">
                      <span className="font-semibold">
                        {seg?.origin ?? "Origin"} → {seg?.destination ?? "Dest"}
                      </span>
                      {seg?.departure && seg?.arrival && (
                        <span className="ml-1 text-slate-300">
                          {" "}
                          • Dep {seg.departure} • Arr {seg.arrival}
                        </span>
                      )}
                      {seg?.duration_minutes && (
                        <span className="ml-1 text-slate-300">
                          • {formatDuration(seg.duration_minutes)}
                        </span>
                      )}
                    </div>
                    {idx < outSegments.length - 1 && (
                      <div className="pl-4 text-[11px] text-amber-300">
                        Layover between flights
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Outbound segments will be shown here once your mock flight data
                includes them.
              </div>
            )}
          </div>

          {/* RETURN */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Return
            </div>
            {Array.isArray(inSegments) && inSegments.length > 0 ? (
              <div className="space-y-1.5">
                {inSegments.map((seg: any, idx: number) => (
                  <React.Fragment key={idx}>
                    <div className="text-[13px]">
                      <span className="font-semibold">
                        {seg?.origin ?? "Origin"} → {seg?.destination ?? "Dest"}
                      </span>
                      {seg?.departure && seg?.arrival && (
                        <span className="ml-1 text-slate-300">
                          {" "}
                          • Dep {seg.departure} • Arr {seg.arrival}
                        </span>
                      )}
                      {seg?.duration_minutes && (
                        <span className="ml-1 text-slate-300">
                          • {formatDuration(seg.duration_minutes)}
                        </span>
                      )}
                    </div>
                    {idx < inSegments.length - 1 && (
                      <div className="pl-4 text-[11px] text-amber-300">
                        Layover between flights
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Return segments will be shown here once your mock flight data
                includes them.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: booking buttons */}
      <div className="flex flex-col gap-3 border-t border-white/5 px-5 py-4 text-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleCompare(id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isCompared
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                : "border-slate-500/60 bg-slate-900/80 text-slate-200 hover:border-sky-400 hover:text-sky-200"
            }`}
          >
            {isCompared ? "Added to compare" : "Compare"}
          </button>

          <a
            href={googleFlightsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-sky-500/90 px-4 py-1 font-semibold text-white hover:bg-sky-400"
          >
            Google Flights
          </a>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-emerald-500/90 px-4 py-1 font-semibold text-white hover:bg-emerald-400"
          >
            Booking.com
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span>More flight options</span>
          <a
            href={skyscannerUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-500/60 bg-slate-900/80 px-3 py-0.5 hover:border-sky-400"
          >
            Skyscanner
          </a>
          <a
            href={kayakUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-500/60 bg-slate-900/80 px-3 py-0.5 hover:border-sky-400"
          >
            KAYAK
          </a>
          <a
            href={airlineUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-500/60 bg-slate-900/80 px-3 py-0.5 hover:border-sky-400"
          >
            Airline sites
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span>More hotel options</span>
          <a
            href={expediaUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-500/60 bg-slate-900/80 px-3 py-0.5 hover:border-sky-400"
          >
            Expedia
          </a>
          <a
            href={hotelsComUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-500/60 bg-slate-900/80 px-3 py-0.5 hover:border-sky-400"
          >
            Hotels.com
          </a>
        </div>
      </div>

      <div className="border-t border-white/5 px-5 pb-4 pt-2 text-[11px] text-slate-500">
        Prices and availability are examples based on your mock data and may
        change once real APIs are connected.
      </div>
    </div>
  );
};

export default ResultCard;
