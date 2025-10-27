/* eslint-disable @next/next/no-img-element */
import React from "react";

type Props = {
  pkg: any;
  index: number;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
};
"use client";

import React from "react";

type Leg = {
  carrier?: string;
  from: string;
  to: string;
  depart: string; // e.g. "06:00 AM"
  arrive: string; // e.g. "07:45 AM"
  durText: string; // e.g. "1h 45m"
};

type Layover = {
  at: string; // e.g. "CLT"
  nextDep: string; // e.g. "08:50 AM"
  gapText?: string; // e.g. "(1h 5m)"
};

type Pkg = {
  id: string;
  priceDisplay: string;
  carrier?: string;        // airline name if known
  outbound: Leg[];
  outboundLayover?: Layover | null;
  inbound: Leg[];
  inboundLayover?: Layover | null;
  headerTitle: string;     // e.g. "Option 1 • AUS — DEL"
  headerDates: string;     // e.g. "2025-10-29  ▸  2025-11-05"
  deeplinks?: {
    trio?: string;
    google?: string;
    skyscanner?: string;
    airline?: string;
  };
  hotels?: Array<{
    id: string;
    title: string;
    code: string;
    links?: { booking?: string; expedia?: string; hotels?: string; map?: string };
    image?: string;
  }>;
};

type Props = {
  pkg: Pkg;
  index: number;
  onToggleCompare?: (id: string) => void;
  comparedIds?: string[];
  onSavedChangeGlobal?: () => void;
  showHotel?: boolean;
};

export default function ResultCard({
  pkg,
  index,
  onToggleCompare,
  comparedIds = [],
  showHotel = true,
}: Props) {
  const inCompare = comparedIds.includes(pkg.id);

  return (
    <section className="result-card colorful-card">
      {/* Header row */}
      <div className="rc-header">
        <div className="rc-title">
          <strong>{pkg.headerTitle}</strong>
          <span className="rc-dates">{pkg.headerDates}</span>
          {pkg.carrier && <span className="rc-airline">• {pkg.carrier}</span>}
        </div>

        <div className="rc-cta">
          <span className="price-pill">
            <span className="price-emoji" aria-hidden>💵</span>
            {pkg.priceDisplay}
          </span>

          {pkg.deeplinks?.google && (
            <a className="btn" href={pkg.deeplinks.google} target="_blank" rel="noreferrer">Google Flights</a>
          )}
          {pkg.deeplinks?.skyscanner && (
            <a className="btn" href={pkg.deeplinks.skyscanner} target="_blank" rel="noreferrer">Skyscanner</a>
          )}
          {pkg.deeplinks?.airline && (
            <a className="btn" href={pkg.deeplinks.airline} target="_blank" rel="noreferrer">Airline</a>
          )}

          <button
            className={`btn ${inCompare ? "btn-compare-on" : ""}`}
            onClick={() => onToggleCompare?.(pkg.id)}
            type="button"
          >
            {inCompare ? "🆚 In Compare" : "＋ Compare"}
          </button>
        </div>
      </div>

      {/* Outbound box */}
      <div className="leg-card leg-outbound">
        <div className="leg-card__header">
          <span className="dot dot--out" />
          <h4>Outbound</h4>
        </div>

        <div className="leg-card__body">
          {pkg.outbound.map((s, i) => (
            <div className="leg-row" key={`out-${i}`}>
              {s.carrier && <div className="carrier">{s.carrier}</div>}
              <div className="route">
                <span className="from">{s.from}</span>
                <span className="arrow">→</span>
                <span className="to">{s.to}</span>
              </div>
              <div className="times">
                {s.depart} — {s.arrive}
              </div>
              <div className="dur">{s.durText}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layover chip (between boxes) */}
      {pkg.outboundLayover?.at && (
        <div className="layover-chip" aria-label="Layover">
          <span className="clock" aria-hidden>🕑</span>
          <span>Layover in <strong>{pkg.outboundLayover.at}</strong></span>
          <span className="sep">•</span>
          <span>Next departs at <strong>{pkg.outboundLayover.nextDep}</strong></span>
          {pkg.outboundLayover.gapText && <> <span className="sep">•</span> <span>{pkg.outboundLayover.gapText}</span></>}
        </div>
      )}

      {/* Return box */}
      <div className="leg-card leg-return">
        <div className="leg-card__header">
          <span className="dot dot--ret" />
          <h4>Return</h4>
        </div>

        <div className="leg-card__body">
          {pkg.inbound.map((s, i) => (
            <div className="leg-row" key={`in-${i}`}>
              {s.carrier && <div className="carrier">{s.carrier}</div>}
              <div className="route">
                <span className="from">{s.from}</span>
                <span className="arrow">→</span>
                <span className="to">{s.to}</span>
              </div>
              <div className="times">
                {s.depart} — {s.arrive}
              </div>
              <div className="dur">{s.durText}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layover chip for inbound (still sits visually after return header) */}
      {pkg.inboundLayover?.at && (
        <div className="layover-chip" aria-label="Layover">
          <span className="clock" aria-hidden>🕑</span>
          <span>Layover in <strong>{pkg.inboundLayover.at}</strong></span>
          <span className="sep">•</span>
          <span>Next departs at <strong>{pkg.inboundLayover.nextDep}</strong></span>
          {pkg.inboundLayover.gapText && <> <span className="sep">•</span> <span>{pkg.inboundLayover.gapText}</span></>}
        </div>
      )}

      {/* Hotels (unchanged layout; still appear under the flight boxes) */}
      {showHotel && pkg.hotels?.length ? (
        <div className="hotel-block">
          <div className="hotel-title">Hotels (top options)</div>
          {pkg.hotels.map((h) => (
            <div className="hotel-row" key={h.id}>
              <div className="hotel-info">
                <div className="hotel-img">
                  <img
                    src={h.image || "/logo.png"}
                    alt={h.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
                  />
                </div>
                <div className="hotel-txt">
                  <div className="name">{h.title}</div>
                  <div className="code">{h.code}</div>
                </div>
              </div>
              <div className="hotel-links">
                {h.links?.booking && <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">Booking.com</a>}
                {h.links?.expedia && <a className="btn" href={h.links.expedia} target="_blank" rel="noreferrer">Expedia</a>}
                {h.links?.hotels && <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">Hotels</a>}
                {h.links?.map && <a className="btn" href={h.links.map} target="_blank" rel="noreferrer">Map</a>}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ---------- small format helpers (defensive) ----------
const fmtTime = (v: any) => {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d?.getTime?.())) return String(v);
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
};

const minsToText = (mins?: number) => {
  if (!mins && mins !== 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
};

const guessCode = (a: any) =>
  a?.code || a?.iata || a?.iataCode || a?.airportCode || a?.cityCode || a || "";

const airlineName = (codeOrName?: string) => {
  if (!codeOrName) return "";
  // If upstream already gives full name, return it; otherwise leave code.
  if (codeOrName.length > 3) return codeOrName;
  return codeOrName; // keep code (AA, DL, UA...) to avoid wrong mappings
};

// Try to normalize a single leg/segment into a canonical shape
const normLeg = (seg: any) => {
  const depTime =
    seg?.departTimeLocal || seg?.departTime || seg?.departureTime || seg?.departAt;
  const arrTime =
    seg?.arriveTimeLocal || seg?.arriveTime || seg?.arrivalTime || seg?.arriveAt;
  const dep = seg?.depart || seg?.from || seg?.origin || {};
  const arr = seg?.arrive || seg?.to || seg?.destination || {};
  const depCode = guessCode(dep);
  const arrCode = guessCode(arr);
  const dur =
    seg?.durationMinutes ||
    seg?.durationMin ||
    seg?.duration ||
    (typeof seg?.minutes === "number" ? seg.minutes : undefined);

  return {
    airline: airlineName(seg?.airlineName || seg?.carrierName || seg?.airline || seg?.carrier),
    depCode,
    arrCode,
    depTime,
    arrTime,
    durationMin: typeof dur === "number" ? dur : undefined,
  };
};

// Find legs for outbound/return despite different shapes
const extractLegs = (pkg: any) => {
  // Most permissive sources
  const flights = pkg?.flights || pkg?.itinerary || pkg?.itin || {};

  const outRaw =
    flights?.outbound ||
    flights?.out ||
    pkg?.outbound ||
    pkg?.out ||
    (Array.isArray(pkg?.segments)
      ? pkg.segments.filter((s: any) => (s?.dir || s?.direction || "").toLowerCase() === "outbound")
      : []);
  const retRaw =
    flights?.return ||
    flights?.inbound ||
    pkg?.return ||
    pkg?.inbound ||
    (Array.isArray(pkg?.segments)
      ? pkg.segments.filter((s: any) => (s?.dir || s?.direction || "").toLowerCase() === "return")
      : []);

  // If provider already split into legs arrays
  const normalizeArray = (arr: any) =>
    (Array.isArray(arr) ? arr : []).map(normLeg).filter((x) => x.depCode && x.arrCode);

  let outbound = normalizeArray(outRaw);
  let inbound = normalizeArray(retRaw);

  // Some shapes put everything under flights.segments all together in order
  if (!outbound.length && !inbound.length && Array.isArray(flights?.segments)) {
    const segs = flights.segments.map(normLeg).filter((x: any) => x.depCode && x.arrCode);
    // If exactly 2 legs, assume [outboundLegs..., inboundLegs...]
    // or if we have a midpoint marker, you can split by a flag—fall back to even split
    if (segs.length >= 1) {
      // heuristic split: look for turn-around (arrives at destination then later departs from there)
      // fallback: half/half
      const mid = Math.floor(segs.length / 2);
      outbound = segs.slice(0, mid || 1);
      inbound = segs.slice(mid);
    }
  }

  return { outbound, inbound };
};

const LayoverChip = ({ cityCode, nextDepartTime }: { cityCode?: string; nextDepartTime?: any }) => {
  if (!cityCode && !nextDepartTime) return null;
  return (
    <div className="tt-layover-chip" aria-label="Layover">
      <span role="img" aria-label="clock">🕒</span>{" "}
      Layover in{" "}
      <strong>{cityCode || ""}</strong>
      {nextDepartTime ? <> • Next departs at <strong>{fmtTime(nextDepartTime)}</strong></> : null}
    </div>
  );
};

const FlightRow = ({ leg }: { leg: ReturnType<typeof normLeg> }) => {
  return (
    <div className="tt-flight-row">
      {leg.airline ? <div className="tt-flight-airline">{leg.airline}</div> : null}
      <div className="tt-flight-route">
        <strong>{leg.depCode}</strong> → <strong>{leg.arrCode}</strong>
      </div>
      <div className="tt-flight-times">
        {fmtTime(leg.depTime)} — {fmtTime(leg.arrTime)}
      </div>
      {typeof leg.durationMin === "number" ? (
        <div className="tt-flight-duration">{minsToText(leg.durationMin)}</div>
      ) : null}
    </div>
  );
};

const FlightBox = ({
  title,
  legs,
}: {
  title: string;
  legs: ReturnType<typeof normLeg>[];
}) => {
  const hasLayover = legs.length >= 2;
  // compute layover display between leg 0 and leg 1
  const layoverCity = hasLayover ? legs[0]?.arrCode : undefined;
  const nextDepart = hasLayover ? legs[1]?.depTime : undefined;

  return (
    <div className="tt-flight-box">
      <div className="tt-flight-box-title">{title}</div>
      {legs.length === 0 ? (
        <div className="tt-muted">No {title.toLowerCase()} details</div>
      ) : (
        <>
          <FlightRow leg={legs[0]} />
          {hasLayover ? <LayoverChip cityCode={layoverCity} nextDepartTime={nextDepart} /> : null}
          {legs.slice(1).map((lg, i) => (
            <FlightRow key={i} leg={lg} />
          ))}
        </>
      )}
    </div>
  );
};

// ---------- hotels (leave behavior as-is; defensive fields) ----------
const HotelRow = ({ h }: { h: any }) => {
  const name = h?.name || h?.title || "Hotel";
  const city = h?.city || h?.iata || h?.code || "";
  const img = h?.image || h?.img || h?.photo;
  return (
    <div className="tt-hotel-row">
      <div className="tt-hotel-img-wrap">
        <img src={img || "/tourism.png"} alt={name} className="tt-hotel-img" />
      </div>
      <div className="tt-hotel-main">
        <div className="tt-hotel-name">{name}</div>
        {city ? <div className="tt-hotel-sub">{city}</div> : null}
      </div>
      <div className="tt-hotel-actions">
        {h?.links?.booking ? (
          <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">
            Booking.com
          </a>
        ) : null}
        {h?.links?.expedia ? (
          <a className="btn" href={h.links.expedia} target="_blank" rel="noreferrer">
            Expedia
          </a>
        ) : null}
        {h?.links?.hotels ? (
          <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">
            Hotels
          </a>
        ) : null}
        {h?.links?.map ? (
          <a className="btn" href={h.links.map} target="_blank" rel="noreferrer">
            Map
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default function ResultCard(props: Props) {
  const { pkg, index, showHotel, hotelNights, showAllHotels } = props;

  // route + price (defensive)
  const routeText =
    pkg?.routeText ||
    pkg?.route ||
    (pkg?.origin && pkg?.destination ? `${pkg.origin} — ${pkg.destination}` : "");
  const priceText =
    pkg?.price?.display ||
    pkg?.priceText ||
    (typeof pkg?.price?.total === "number" ? `$${pkg.price.total.toFixed(2)}` : undefined);

  const { outbound, inbound } = extractLegs(pkg);

  // hotels
  const hotelsAll: any[] = Array.isArray(pkg?.hotels) ? pkg.hotels : [];
  const hotels = showAllHotels ? hotelsAll : hotelsAll.slice(0, 3);

  return (
    <section className="result-card">
      {/* header row (keep your look & feel) */}
      <div className="tt-result-header">
        <div className="tt-result-title">
          <strong>Option {index + 1}</strong>
          {routeText ? <> • {routeText}</> : null}
          {pkg?.dates?.depart && pkg?.dates?.return ? (
            <>
              {" "}
              • <span>{pkg.dates.depart}</span> <span className="tt-arrow">▸</span>{" "}
              <span>{pkg.dates.return}</span>
            </>
          ) : null}
          {pkg?.carrier || pkg?.airline ? <> • {pkg.carrier || pkg.airline}</> : null}
        </div>
        <div className="tt-result-actions">
          {priceText ? <div className="pill money">{priceText}</div> : null}
          {pkg?.links?.trioTrip ? (
            <a className="btn" href={pkg.links.trioTrip} target="_blank" rel="noreferrer">
              TrioTrip
            </a>
          ) : null}
          {pkg?.links?.google ? (
            <a className="btn" href={pkg.links.google} target="_blank" rel="noreferrer">
              Google Flights
            </a>
          ) : null}
          {pkg?.links?.skyscanner ? (
            <a className="btn" href={pkg.links.skyscanner} target="_blank" rel="noreferrer">
              Skyscanner
            </a>
          ) : null}
          {pkg?.links?.airline ? (
            <a className="btn" href={pkg.links.airline} target="_blank" rel="noreferrer">
              Airline
            </a>
          ) : null}
          <button className="btn" onClick={() => props.onToggleCompare?.(pkg?.id || `${index}`)}>
            + Compare
          </button>
        </div>
      </div>

      {/* FLIGHTS: two clean boxes */}
      <div className="tt-flight-grid">
        <FlightBox title="Outbound" legs={outbound} />
        <FlightBox title="Return" legs={inbound} />
      </div>

      {/* HOTELS */}
      {showHotel && hotels?.length ? (
        <>
          <h4 className="tt-hotels-title">
            Hotels ({showAllHotels ? "all" : "top options"})
            {hotelNights ? <span className="tt-muted"> • {hotelNights} night{hotelNights > 1 ? "s" : ""}</span> : null}
          </h4>
          <div className="tt-hotels-list">
            {hotels.map((h, i) => (
              <HotelRow key={h?.id || i} h={h} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

/* -------------- styles scoped to this card (uses your existing tokens) --------------
   Keep everything light; no font/size changes; only gentle structure.
*/
