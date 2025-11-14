import React from "react";

type Segment = {
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  carrierCode?: string;
  flightNumber?: string;
  duration_minutes?: number;
};

type Flight = {
  price_usd: number;
  currency?: string;
  mainCarrier?: string;
  segments_out?: Segment[];
  segments_return?: Segment[];
};

type Pkg = {
  id: string;
  flight?: Flight;
  flight_total?: number;
  hotel_total?: number;
  total_cost?: number;
  provider?: string;
};

type Props = {
  pkg: Pkg;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: (id: string, saved: boolean) => void;
  hideActions?: boolean;
  bookUrl?: string;
};

const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines",
  AAL: "American Airlines",
  UA: "United Airlines",
  UAL: "United Airlines",
  DL: "Delta Air Lines",
  DAL: "Delta Air Lines",
  WN: "Southwest Airlines",
  SWA: "Southwest Airlines",
  B6: "JetBlue",
  AS: "Alaska Airlines",
  AF: "Air France",
  BA: "British Airways",
  LH: "Lufthansa",
  EK: "Emirates",
  QR: "Qatar Airways",
  SQ: "Singapore Airlines",
};

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString();
}

function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function computeLayovers(segments: Segment[]): { city: string; minutes: number }[] {
  const layovers: { city: string; minutes: number }[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const cur = segments[i];
    const next = segments[i + 1];
    if (!cur.arrivalTime || !next.departureTime || !cur.to) continue;
    const t1 = new Date(cur.arrivalTime).getTime();
    const t2 = new Date(next.departureTime).getTime();
    if (!Number.isFinite(t1) || !Number.isFinite(t2)) continue;
    const diffMin = Math.round((t2 - t1) / 60000);
    if (diffMin > 0) {
      layovers.push({ city: cur.to, minutes: diffMin });
    }
  }
  return layovers;
}

function carrierDisplay(code?: string, flightNumber?: string) {
  if (!code) return "";
  const cleanCode = code.trim().toUpperCase();
  const name = AIRLINE_NAMES[cleanCode] || cleanCode;
  if (flightNumber) {
    return `${name} · ${cleanCode}${flightNumber}`;
  }
  return name;
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
  hideActions,
  bookUrl,
}: Props) {
  const flight = pkg.flight;
  const price = flight?.price_usd ?? pkg.total_cost ?? 0;
  const cur = flight?.currency || currency || "USD";

  const segmentsOut = flight?.segments_out || [];
  const segmentsReturn = flight?.segments_return || [];

  const firstOut = segmentsOut[0];
  const lastOut = segmentsOut[segmentsOut.length - 1];
  const firstRet = segmentsReturn[0];
  const lastRet = segmentsReturn[segmentsReturn.length - 1];

  const layoversOut = computeLayovers(segmentsOut);
  const layoversRet = computeLayovers(segmentsReturn);

  const flightLabel = carrierDisplay(
    flight?.mainCarrier || firstOut?.carrierCode,
    firstOut?.flightNumber
  );

  const totalPerPerson = price > 0 ? price / Math.max(1, pax) : 0;

  const isCompared = comparedIds.includes(pkg.id);

  return (
    <div
      className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-100 flex flex-col gap-3"
    >
      {/* Price + airline header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Option {index + 1}
          </div>
          {flightLabel && (
            <div className="font-semibold text-sm">{flightLabel}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {cur} {Math.round(price).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            ~{cur} {Math.round(totalPerPerson).toLocaleString()} / person
          </div>
        </div>
      </div>

      {/* Outbound summary */}
      {segmentsOut.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex flex-col gap-1">
          <div className="flex justify-between items-baseline gap-2">
            <div className="font-semibold text-xs text-sky-300 uppercase tracking-wide">
              Outbound
            </div>
            <div className="text-xs text-slate-400">
              {firstOut?.from} → {lastOut?.to} ·{" "}
              {segmentsOut.length > 1
                ? `${segmentsOut.length - 1} stop${
                    segmentsOut.length - 1 > 1 ? "s" : ""
                  }`
                : "non-stop"}
            </div>
          </div>

          <div className="flex justify-between text-xs mt-1">
            <div>
              <div className="font-semibold">
                {formatTime(firstOut?.departureTime)}{" "}
              </div>
              <div className="text-slate-400">
                {formatDate(firstOut?.departureTime)} · {firstOut?.from}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatTime(lastOut?.arrivalTime)}{" "}
              </div>
              <div className="text-slate-400">
                {formatDate(lastOut?.arrivalTime)} · {lastOut?.to}
              </div>
            </div>
          </div>

          {/* Layovers outbound */}
          {layoversOut.length > 0 && (
            <div className="mt-2 text-xs text-slate-300">
              {layoversOut.map((l, i) => (
                <div key={i}>
                  Layover in {l.city} · {formatDuration(l.minutes)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return summary */}
      {segmentsReturn.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex flex-col gap-1">
          <div className="flex justify-between items-baseline gap-2">
            <div className="font-semibold text-xs text-emerald-300 uppercase tracking-wide">
              Return
            </div>
            <div className="text-xs text-slate-400">
              {firstRet?.from} → {lastRet?.to} ·{" "}
              {segmentsReturn.length > 1
                ? `${segmentsReturn.length - 1} stop${
                    segmentsReturn.length - 1 > 1 ? "s" : ""
                  }`
                : "non-stop"}
            </div>
          </div>

          <div className="flex justify-between text-xs mt-1">
            <div>
              <div className="font-semibold">
                {formatTime(firstRet?.departureTime)}{" "}
              </div>
              <div className="text-slate-400">
                {formatDate(firstRet?.departureTime)} · {firstRet?.from}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatTime(lastRet?.arrivalTime)}{" "}
              </div>
              <div className="text-slate-400">
                {formatDate(lastRet?.arrivalTime)} · {lastRet?.to}
              </div>
            </div>
          </div>

          {/* Layovers return */}
          {layoversRet.length > 0 && (
            <div className="mt-2 text-xs text-slate-300">
              {layoversRet.map((l, i) => (
                <div key={i}>
                  Layover in {l.city} · {formatDuration(l.minutes)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hotel info placeholder – still 0 until real hotel API is wired */}
      {showHotel && hotelNights > 0 && (
        <div className="text-xs text-slate-400">
          Includes hotel for {hotelNights} night
          {hotelNights > 1 ? "s" : ""} (pricing TBD).
        </div>
      )}

      {/* Actions row */}
      <div className="flex justify-between items-center mt-1 gap-2">
        {bookUrl ? (
          <a
            href={bookUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
          >
            Book on Google Flights
          </a>
        ) : (
          <div />
        )}

        {!hideActions && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onToggleCompare(pkg.id)}
              className={`px-2 py-1 rounded-full border ${
                isCompared
                  ? "border-amber-400 text-amber-300"
                  : "border-slate-700 text-slate-300"
              } hover:border-amber-400 hover:text-amber-200 transition-colors`}
            >
              {isCompared ? "In compare" : "Compare"}
            </button>
            {/* You can wire Saved state from parent if needed */}
          </div>
        )}
      </div>
    </div>
  );
}
