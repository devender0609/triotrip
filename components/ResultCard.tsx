import React from "react";

type Props = {
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
};

const fmtMoney = (value: number | undefined | null, currency: string) => {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Math.round(Number(value))}`;
  }
};

const fmtDuration = (minutes: number | undefined) => {
  if (!minutes || !Number.isFinite(minutes)) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
};

const sumDuration = (segs: any[]): number => {
  return segs.reduce(
    (t, s) => t + (Number(s?.duration_minutes) || 0),
    0
  );
};

const ResultCard: React.FC<Props> = ({
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
  const id = String(pkg.id ?? index);

  const originCode =
    pkg.origin || pkg.originCode || pkg.flight?.origin || "ORG";
  const destCode =
    pkg.destination || pkg.destinationCode || pkg.flight?.destination || "DST";

  const segOut =
    pkg.flight?.segments_out ||
    pkg.flight?.segments ||
    pkg.segments_out ||
    [];
  const segBack =
    pkg.flight?.segments_back || pkg.segments_back || [];

  const outStops = Math.max(0, (segOut.length || 1) - 1);
  const backStops = Math.max(0, (segBack.length || 1) - 1);

  const outDur = sumDuration(segOut);
  const backDur = sumDuration(segBack);
  const totalDur = outDur + backDur;

  const flightBase =
    pkg.flight_total ??
    pkg.total_cost_flight ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    pkg.total_cost ??
    0;

  const hotelTotal = showHotel
    ? pkg.hotel_total ?? pkg.total_cost_hotel ?? 0
    : 0;

  const bundleTotal = showHotel
    ? pkg.total_cost ?? flightBase + hotelTotal
    : flightBase;

  const perPerson = pax > 0 ? bundleTotal / pax : bundleTotal;

  const refundable =
    pkg.flight?.refundable ?? pkg.refundable ?? false;

  const cabins =
    pkg.flight?.cabin || pkg.cabin || pkg.travelClass || "";

  const carbon =
    pkg.flight?.carbon_kg ??
    pkg.carbon_kg ??
    null;

  const hotels = Array.isArray(pkg.hotels) ? pkg.hotels : [];
  const primaryHotel = showHotel && hotels.length ? hotels[0] : null;

  const isCompared = comparedIds.includes(id);

  return (
    <article className="card">
      {/* PRICE + SUMMARY ROW */}
      <div className="card-header">
        <div className="header-left">
          <div className="option-label">Option {index + 1}</div>
          <div className="route">
            {originCode} <span className="arrow">➝</span> {destCode}
          </div>
          <div className="subroute">
            {outStops === 0
              ? "Non-stop"
              : outStops === 1
              ? "1 stop"
              : `${outStops} stops`}
            {outDur ? ` • ${fmtDuration(outDur)}` : ""}
            {segBack && segBack.length > 0
              ? ` • Return: ${
                  backStops === 0
                    ? "non-stop"
                    : backStops === 1
                    ? "1 stop"
                    : `${backStops} stops`
                } (${fmtDuration(backDur)})`
              : ""}
          </div>
        </div>

        <div className="header-right">
          <div className="price-main">
            {fmtMoney(bundleTotal, currency)}
          </div>
          <div className="price-sub">
            {pax > 1 ? `${fmtMoney(perPerson, currency)} / person` : "Total"}
          </div>
          {showHotel && hotelNights > 0 && (
            <div className="badge nights">
              🛏 {hotelNights} night
              {hotelNights > 1 ? "s" : ""} hotel
            </div>
          )}
          {refundable && (
            <div className="badge flexi">✓ Flexible / refundable</div>
          )}
        </div>
      </div>

      {/* DETAILS ROW */}
      <div className="details-row">
        <div className="col">
          <div className="section-title">Flight details</div>
          <ul className="bullets">
            <li>
              <strong>Outbound:</strong>{" "}
              {originCode} → {destCode}{" "}
              {outDur ? `• ${fmtDuration(outDur)}` : ""}{" "}
              {outStops === 0
                ? "• Non-stop"
                : outStops === 1
                ? "• 1 stop"
                : `• ${outStops} stops`}
            </li>
            {segBack && segBack.length > 0 && (
              <li>
                <strong>Return:</strong>{" "}
                {destCode} → {originCode}{" "}
                {backDur ? `• ${fmtDuration(backDur)}` : ""}{" "}
                {backStops === 0
                  ? "• Non-stop"
                  : backStops === 1
                  ? "• 1 stop"
                  : `• ${backStops} stops`}
              </li>
            )}
            {cabins && (
              <li>
                <strong>Cabin:</strong> {String(cabins)}
              </li>
            )}
            {totalDur > 0 && (
              <li>
                <strong>Total travel time:</strong>{" "}
                {fmtDuration(totalDur)}
              </li>
            )}
            {carbon != null && (
              <li>
                <strong>Carbon estimate:</strong>{" "}
                {Math.round(Number(carbon))} kg CO₂
              </li>
            )}
          </ul>
        </div>

        {showHotel && (
          <div className="col">
            <div className="section-title">Hotel bundle</div>
            {primaryHotel ? (
              <>
                <div className="hotel-name">
                  {primaryHotel.name || "Selected hotel"}
                </div>
                <div className="hotel-line">
                  {primaryHotel.stars && (
                    <span>
                      ⭐ {primaryHotel.stars}{" "}
                      {primaryHotel.stars === 1 ? "star" : "stars"}
                    </span>
                  )}
                  {primaryHotel.area && (
                    <span> • 📍 {primaryHotel.area}</span>
                  )}
                </div>
                {hotelTotal ? (
                  <div className="hotel-price">
                    {fmtMoney(hotelTotal, currency)} total hotel
                  </div>
                ) : null}
              </>
            ) : (
              <div className="hotel-line">
                Includes hotel for your stay (exact hotel to be chosen
                at booking).
              </div>
            )}

            {showAllHotels && hotels.length > 1 && (
              <div className="hotel-extra">
                + {hotels.length - 1} more hotel option
                {hotels.length - 1 > 1 ? "s" : ""} in this bundle
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER ROW */}
      <div className="footer-row">
        <div className="footer-left">
          <button
            type="button"
            className={`compare-btn ${isCompared ? "on" : ""}`}
            onClick={() => onToggleCompare(id)}
          >
            {isCompared ? "✓ In compare" : "Compare"}
          </button>
        </div>
        <div className="footer-right">
          <span className="small-note">
            Prices and availability are examples and may change at
            booking.
          </span>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: #0b1220;
          border-radius: 18px;
          border: 1px solid #1e293b;
          padding: 14px 16px;
          color: #e5e7eb;
          display: grid;
          gap: 10px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.45);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 12px;
          border-radius: 14px;
          background: linear-gradient(
            90deg,
            #0ea5e9,
            #6366f1,
            #ec4899
          );
          color: #f9fafb;
        }
        .header-left {
          display: grid;
          gap: 2px;
        }
        .option-label {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0.9;
        }
        .route {
          font-size: 18px;
          font-weight: 800;
        }
        .arrow {
          margin: 0 6px;
        }
        .subroute {
          font-size: 13px;
          opacity: 0.95;
        }
        .header-right {
          text-align: right;
          display: grid;
          gap: 2px;
        }
        .price-main {
          font-size: 20px;
          font-weight: 800;
        }
        .price-sub {
          font-size: 12px;
          opacity: 0.9;
        }
        .badge {
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          padding: 2px 8px;
          border-radius: 999px;
          margin-top: 3px;
          border: 1px solid rgba(248, 250, 252, 0.7);
          background: rgba(15, 23, 42, 0.35);
        }
        .badge.nights {
          border-color: rgba(52, 211, 153, 0.7);
          background: rgba(6, 95, 70, 0.4);
        }
        .badge.flexi {
          border-color: rgba(250, 204, 21, 0.8);
          background: rgba(251, 191, 36, 0.25);
        }
        .details-row {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.1fr);
          gap: 16px;
        }
        .col {
          background: #020617;
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid #1f2937;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #e5e7eb;
        }
        .bullets {
          margin: 0;
          padding-left: 18px;
          font-size: 13px;
          display: grid;
          gap: 2px;
        }
        .hotel-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .hotel-line {
          font-size: 13px;
          color: #cbd5f5;
          margin-bottom: 4px;
        }
        .hotel-price {
          font-size: 13px;
          color: #e5e7eb;
          font-weight: 600;
        }
        .hotel-extra {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .compare-btn {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #38bdf8;
          background: #020617;
          color: #e0f2fe;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .compare-btn.on {
          background: #22c55e;
          border-color: #16a34a;
          color: #022c22;
        }
        .small-note {
          font-size: 11px;
          color: #9ca3af;
        }
        @media (max-width: 800px) {
          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-right {
            text-align: left;
          }
          .details-row {
            grid-template-columns: 1fr;
          }
          .route {
            font-size: 16px;
          }
        }
      `}</style>
    </article>
  );
};

export default ResultCard;
