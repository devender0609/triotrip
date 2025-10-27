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
