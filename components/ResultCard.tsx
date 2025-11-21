"use client";

import React from "react";

type ResultCardProps = {
  pkg: any;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal?: () => void;
};

function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

function minutesToLabel(mins: number | undefined) {
  if (!mins || !Number.isFinite(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function parseDateTime(dt: string | undefined) {
  if (!dt) return null;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatTime(dt: string | undefined) {
  const d = parseDateTime(dt);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(dt: string | undefined) {
  const d = parseDateTime(dt);
  if (!d) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function computeLayoverMinutes(a: any, b: any) {
  const arrive = parseDateTime(a?.arrival_time_local);
  const depart = parseDateTime(b?.departure_time_local);
  if (!arrive || !depart) return null;
  const diff = (depart.getTime() - arrive.getTime()) / 60000;
  return diff > 0 ? diff : null;
}

function getSegmentsOut(pkg: any) {
  const f = pkg.flight || {};
  return (
    f.segments_out ||
    f.outbound_segments ||
    f.segments ||
    ([] as any[])
  );
}

function getSegmentsReturn(pkg: any) {
  const f = pkg.flight || {};
  return (
    f.segments_return ||
    f.inbound_segments ||
    f.return_segments ||
    ([] as any[])
  );
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
}: ResultCardProps) {
  const id = String(pkg.id ?? index);
  const isCompared = comparedIds.includes(id);

  const totalCost =
    pkg.total_cost ??
    pkg.bundle_total ??
    pkg.flight_total ??
    pkg.total_cost_flight ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd;

  const perPerson =
    totalCost != null && pax > 0 ? totalCost / pax : undefined;

  const segmentsOut = getSegmentsOut(pkg);
  const segmentsReturn = getSegmentsReturn(pkg);

  const destCity =
    pkg.destinationCity ||
    pkg.destinationName ||
    pkg.city ||
    pkg.destination ||
    "";

  const hotelOptions: any[] =
    pkg.hotels ||
    pkg.hotel_options ||
    pkg.hotelSuggestions ||
    (pkg.hotel ? [pkg.hotel] : []);

  return (
    <article className="result-card">
      {/* Top row: title + price + actions */}
      <div className="result-header">
        <div className="result-title">
          <div className="result-chip">Option {index + 1}</div>
          {destCity && (
            <div className="result-destination">{String(destCity)}</div>
          )}
        </div>

        <div className="result-price-block">
          <div className="price-total">
            {formatMoney(totalCost, currency)}
          </div>
          {perPerson != null && (
            <div className="price-sub">
              {formatMoney(perPerson, currency)} / person
            </div>
          )}
        </div>

        <div className="result-actions">
          <button
            type="button"
            className={`chip compare ${isCompared ? "on" : ""}`}
            onClick={() => onToggleCompare(id)}
          >
            {isCompared ? "In compare" : "Compare"}
          </button>
        </div>
      </div>

      {/* Flights section */}
      <div className="result-section">
        <div className="section-header">Flights</div>

        {/* Outbound */}
        {segmentsOut.length > 0 && (
          <div className="flight-card">
            <div className="flight-header">
              <span className="badge">Outbound</span>
              <span className="flight-date">
                {formatShortDate(segmentsOut[0]?.departure_time_local)}
              </span>
            </div>

            {segmentsOut.map((seg: any, idx: number) => {
              const airline =
                seg.airline_name ||
                seg.marketing_airline ||
                seg.airline ||
                "";
              const flightNo =
                seg.flight_number || seg.marketing_flight_number || "";
              const originCode = seg.origin_code || seg.from || "";
              const destCode = seg.destination_code || seg.to || "";
              const originName =
                seg.origin_city || seg.origin_name || originCode;
              const destName =
                seg.destination_city || seg.destination_name || destCode;

              const layoverMinutes =
                idx > 0
                  ? computeLayoverMinutes(segmentsOut[idx - 1], seg)
                  : null;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && layoverMinutes && (
                    <div className="layover-row">
                      Layover in{" "}
                      {segmentsOut[idx - 1]?.destination_city ||
                        segmentsOut[idx - 1]?.destination_code ||
                        ""}{" "}
                      – {minutesToLabel(layoverMinutes)}
                    </div>
                  )}

                  <div className="segment-row">
                    <div className="segment-times">
                      <div className="time-large">
                        {formatTime(seg.departure_time_local)}
                      </div>
                      <div className="time-sub">
                        {originCode} • {originName}
                      </div>
                    </div>

                    <div className="segment-middle">
                      <div className="segment-line" />
                      <div className="segment-duration">
                        {minutesToLabel(seg.duration_minutes)}
                      </div>
                    </div>

                    <div className="segment-times right">
                      <div className="time-large">
                        {formatTime(seg.arrival_time_local)}
                      </div>
                      <div className="time-sub">
                        {destCode} • {destName}
                      </div>
                    </div>

                    <div className="segment-airline">
                      <div className="airline-name">
                        {airline || "Flight"}
                      </div>
                      {flightNo && (
                        <div className="airline-sub">
                          Flight {String(flightNo)}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Return */}
        {segmentsReturn.length > 0 && (
          <div className="flight-card">
            <div className="flight-header">
              <span className="badge badge-return">Return</span>
              <span className="flight-date">
                {formatShortDate(
                  segmentsReturn[0]?.departure_time_local
                )}
              </span>
            </div>

            {segmentsReturn.map((seg: any, idx: number) => {
              const airline =
                seg.airline_name ||
                seg.marketing_airline ||
                seg.airline ||
                "";
              const flightNo =
                seg.flight_number || seg.marketing_flight_number || "";
              const originCode = seg.origin_code || seg.from || "";
              const destCode = seg.destination_code || seg.to || "";
              const originName =
                seg.origin_city || seg.origin_name || originCode;
              const destName =
                seg.destination_city || seg.destination_name || destCode;

              const layoverMinutes =
                idx > 0
                  ? computeLayoverMinutes(segmentsReturn[idx - 1], seg)
                  : null;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && layoverMinutes && (
                    <div className="layover-row">
                      Layover in{" "}
                      {segmentsReturn[idx - 1]?.destination_city ||
                        segmentsReturn[idx - 1]?.destination_code ||
                        ""}{" "}
                      – {minutesToLabel(layoverMinutes)}
                    </div>
                  )}

                  <div className="segment-row">
                    <div className="segment-times">
                      <div className="time-large">
                        {formatTime(seg.departure_time_local)}
                      </div>
                      <div className="time-sub">
                        {originCode} • {originName}
                      </div>
                    </div>

                    <div className="segment-middle">
                      <div className="segment-line" />
                      <div className="segment-duration">
                        {minutesToLabel(seg.duration_minutes)}
                      </div>
                    </div>

                    <div className="segment-times right">
                      <div className="time-large">
                        {formatTime(seg.arrival_time_local)}
                      </div>
                      <div className="time-sub">
                        {destCode} • {destName}
                      </div>
                    </div>

                    <div className="segment-airline">
                      <div className="airline-name">
                        {airline || "Flight"}
                      </div>
                      {flightNo && (
                        <div className="airline-sub">
                          Flight {String(flightNo)}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Hotels section */}
      {showHotel && hotelOptions.length > 0 && (
        <div className="result-section">
          <div className="section-header">
            Hotels{" "}
            {hotelNights > 0 && (
              <span className="section-sub">
                • {hotelNights} night{hotelNights > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="hotel-grid">
            {hotelOptions.slice(0, showAllHotels ? 6 : 3).map(
              (h, idx) =>
                h && (
                  <div key={idx} className="hotel-card">
                    <div className="hotel-name">
                      {h.name || h.hotel_name || "Hotel option"}
                    </div>
                    <div className="hotel-meta">
                      {h.neighborhood ||
                        h.area ||
                        h.location ||
                        h.city ||
                        ""}
                    </div>
                    {h.stars && (
                      <div className="hotel-stars">
                        {"★".repeat(Math.round(h.stars))}
                      </div>
                    )}
                    {h.price_per_night && (
                      <div className="hotel-price">
                        {formatMoney(h.price_per_night, currency)} / night
                      </div>
                    )}
                  </div>
                )
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .result-card {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .result-title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .result-chip {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
        }

        .result-destination {
          font-weight: 700;
          font-size: 18px;
        }

        .result-price-block {
          text-align: right;
          min-width: 120px;
        }

        .price-total {
          font-size: 20px;
          font-weight: 800;
        }

        .price-sub {
          font-size: 13px;
          color: #64748b;
        }

        .result-actions {
          display: flex;
          gap: 6px;
        }

        .chip.compare {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .chip.compare.on {
          border-color: #0f172a;
          background: #0f172a;
          color: #ffffff;
        }

        .result-section {
          border-radius: 14px;
          background: #f8fafc;
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .section-header {
          font-weight: 800;
          font-size: 16px;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .section-sub {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .flight-card {
          border-radius: 12px;
          background: #0f172a;
          color: #e5e7eb;
          padding: 10px 12px;
          display: grid;
          gap: 6px;
        }

        .flight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .badge {
          padding: 3px 8px;
          border-radius: 999px;
          background: #22c55e;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-return {
          background: #f97316;
        }

        .flight-date {
          font-size: 13px;
          opacity: 0.9;
        }

        .segment-row {
          display: grid;
          grid-template-columns: 1.5fr 1.2fr 1.5fr 1.4fr;
          gap: 8px;
          align-items: center;
          padding: 8px 0;
        }

        .segment-times {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .segment-times.right {
          text-align: right;
        }

        .time-large {
          font-size: 17px;
          font-weight: 700;
        }

        .time-sub {
          font-size: 12px;
          opacity: 0.8;
        }

        .segment-middle {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 11px;
        }

        .segment-line {
          width: 100%;
          border-top: 1px dashed rgba(148, 163, 184, 0.8);
          position: relative;
        }

        .segment-line::after {
          content: "";
          position: absolute;
          right: -3px;
          top: -4px;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #e5e7eb;
        }

        .segment-duration {
          font-size: 11px;
          opacity: 0.9;
        }

        .segment-airline {
          text-align: right;
          font-size: 12px;
        }

        .airline-name {
          font-weight: 600;
        }

        .airline-sub {
          opacity: 0.8;
        }

        .layover-row {
          font-size: 12px;
          color: #fed7aa;
          background: rgba(248, 250, 252, 0.05);
          padding: 4px 8px;
          border-radius: 999px;
          display: inline-block;
          margin: 4px 0;
        }

        .hotel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
        }

        .hotel-card {
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          font-size: 13px;
        }

        .hotel-name {
          font-weight: 700;
          margin-bottom: 2px;
        }

        .hotel-meta {
          font-size: 12px;
          color: #64748b;
        }

        .hotel-stars {
          margin-top: 4px;
          color: #facc15;
        }

        .hotel-price {
          margin-top: 4px;
          font-weight: 700;
        }

        @media (max-width: 720px) {
          .segment-row {
            grid-template-columns: 1.2fr 1fr;
            grid-template-rows: auto auto;
            grid-auto-flow: row;
          }
          .segment-middle {
            grid-column: 1 / span 2;
          }
          .segment-airline {
            grid-column: 1 / span 2;
            text-align: left;
          }
        }
      `}</style>
    </article>
  );
}
