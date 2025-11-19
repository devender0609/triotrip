import React, { useState } from "react";

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

const sumDuration = (segs: any[]): number =>
  segs.reduce((t, s) => t + (Number(s?.duration_minutes) || 0), 0);

const extractAirline = (flight: any): string => {
  if (!flight) return "";
  const segs = flight.segments_out || flight.segments || [];
  if (!Array.isArray(segs) || !segs.length) return "";
  const names = new Set<string>();

  for (const s of segs) {
    const n =
      s.marketingCarrierName ||
      s.carrierName ||
      s.airlineName ||
      s.marketingCarrier ||
      s.carrierCode ||
      s.airline ||
      "";
    if (n) names.add(String(n));
  }
  const arr = Array.from(names);
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} & ${arr[1]}`;
  return `${arr[0]} + ${arr.length - 1} more`;
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
  const extraHotels = showHotel && hotels.length > 1 ? hotels.slice(1) : [];

  const [showAllHotelsLocal, setShowAllHotelsLocal] = useState(
    showAllHotels || false
  );

  const isCompared = comparedIds.includes(id);

  const airlineName = extractAirline(pkg.flight);

  const departDate =
    pkg.departDate ||
    pkg.departureDate ||
    pkg.departure_date ||
    pkg.departure;
  const returnDate =
    pkg.returnDate ||
    pkg.return_date ||
    pkg.return;

  // Booking URLs
  const flightQueryParts = [
    `Flights from ${originCode} to ${destCode}`,
    departDate ? `on ${departDate}` : "",
    returnDate ? ` returning ${returnDate}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const flightBookingUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    flightQueryParts
  )}`;

  const airlineSitesUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `airlines flying ${originCode} to ${destCode}`
  )}`;

  const hotelCity =
    pkg.destinationCity ||
    pkg.city ||
    pkg.destinationName ||
    destCode;

  const hotelCheckIn =
    pkg.hotelCheckIn ||
    pkg.checkIn ||
    pkg.hotel_check_in ||
    departDate;
  const hotelCheckOut =
    pkg.hotelCheckOut ||
    pkg.checkOut ||
    pkg.hotel_check_out ||
    returnDate;

  let hotelBookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    hotelCity
  )}`;
  if (hotelCheckIn) hotelBookingUrl += `&checkin=${hotelCheckIn}`;
  if (hotelCheckOut) hotelBookingUrl += `&checkout=${hotelCheckOut}`;

  const flightKayakUrl = `https://www.kayak.com/flights/${originCode}-${destCode}`;
  const flightSkyscannerUrl = `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/`;
  const hotelExpediaUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(
    hotelCity
  )}`;
  const hotelHotelsUrl = `https://www.hotels.com/search.do?destination=${encodeURIComponent(
    hotelCity
  )}`;

  return (
    <article className="card">
      {/* HEADER */}
      <div className="card-header">
        <div className="header-left">
          <div className="option-label">Option {index + 1}</div>
          <div className="route">
            {originCode} <span className="arrow">➝</span> {destCode}
          </div>
          <div className="subroute">
            {airlineName && (
              <>
                <span className="airline">{airlineName}</span> •{" "}
              </>
            )}
            {outStops === 0
              ? "Non-stop"
              : outStops === 1
              ? "1 stop"
              : `${outStops} stops`}
            {outDur ? ` • ${fmtDuration(outDur)}` : ""}
          </div>
        </div>

        <div className="header-right">
          <div className="price-main">
            {fmtMoney(bundleTotal, currency)}
          </div>
          <div className="price-sub">
            {pax > 1 ? `${fmtMoney(perPerson, currency)} / person` : "Total"}
          </div>
          <div className="badge-row">
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
      </div>

      {/* DETAILS */}
      <div className="details-row">
        {showHotel ? (
          <>
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

                  {extraHotels.length > 0 && !showAllHotelsLocal && (
                    <button
                      type="button"
                      className="hotel-more-btn"
                      onClick={() => setShowAllHotelsLocal(true)}
                    >
                      + {extraHotels.length} more hotel option
                      {extraHotels.length > 1 ? "s" : ""} in this bundle
                    </button>
                  )}

                  {showAllHotelsLocal && extraHotels.length > 0 && (
                    <ul className="hotel-extra-list">
                      {extraHotels.map((h: any, idx: number) => (
                        <li key={idx}>
                          <span className="hotel-extra-name">
                            {h.name || `Extra hotel ${idx + 1}`}
                          </span>
                          {h.stars && (
                            <span className="hotel-extra-meta">
                              {" "}
                              • ⭐ {h.stars}
                            </span>
                          )}
                          {h.area && (
                            <span className="hotel-extra-meta">
                              {" "}
                              • 📍 {h.area}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="hotel-line">
                  Includes hotel for your stay (exact hotel to be chosen
                  at booking).
                </div>
              )}
            </div>

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
          </>
        ) : (
          <div className="col col-full">
            <div className="section-title">Flight details</div>
            <ul className="bullets">
              <li>
                <strong>Route:</strong> {originCode} → {destCode}{" "}
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
              {airlineName && (
                <li>
                  <strong>Airline:</strong> {airlineName}
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
        )}
      </div>

      {/* FOOTER */}
      <div className="footer-row">
        <div className="footer-left">
          <button
            type="button"
            className={`compare-btn ${isCompared ? "on" : ""}`}
            onClick={() => onToggleCompare(id)}
          >
            {isCompared ? "✓ In compare" : "Compare"}
          </button>

          <a
            href={flightBookingUrl}
            target="_blank"
            rel="noreferrer"
            className="book-btn"
          >
            ✈ Google Flights
          </a>

          {showHotel && (
            <a
              href={hotelBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="book-btn hotel"
            >
              🛏 Booking.com
            </a>
          )}
        </div>
        <div className="footer-right">
          <span className="small-note">
            Prices and availability are examples and may change at booking.
          </span>
        </div>
      </div>

      {/* EXTRA PROVIDERS AS COLOURFUL TABS */}
      <div className="more-links">
        <div className="more-links-row">
          <span className="more-label">More flight options</span>
          <div className="more-chip-row">
            <a
              href={flightSkyscannerUrl}
              target="_blank"
              rel="noreferrer"
              className="more-chip flight"
            >
              Skyscanner
            </a>
            <a
              href={flightKayakUrl}
              target="_blank"
              rel="noreferrer"
              className="more-chip flight"
            >
              KAYAK
            </a>
            <a
              href={airlineSitesUrl}
              target="_blank"
              rel="noreferrer"
              className="more-chip flight alt"
            >
              Airline sites
            </a>
          </div>
        </div>

        {showHotel && (
          <div className="more-links-row">
            <span className="more-label">More hotel options</span>
            <div className="more-chip-row">
              <a
                href={hotelExpediaUrl}
                target="_blank"
                rel="noreferrer"
                className="more-chip hotel"
              >
                Expedia
              </a>
              <a
                href={hotelHotelsUrl}
                target="_blank"
                rel="noreferrer"
                className="more-chip hotel alt"
              >
                Hotels.com
              </a>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .card {
          background: #020617;
          border-radius: 18px;
          border: 1px solid #1e293b;
          padding: 16px 18px;
          color: #e5e7eb;
          display: grid;
          gap: 12px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.45);
          font-family: system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 14px;
          border-radius: 16px;
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
          font-size: 19px;
          font-weight: 800;
        }
        .arrow {
          margin: 0 6px;
        }
        .subroute {
          font-size: 13px;
          opacity: 0.95;
        }
        .airline {
          font-weight: 600;
        }
        .header-right {
          text-align: right;
          display: grid;
          gap: 4px;
        }
        .price-main {
          font-size: 21px;
          font-weight: 800;
        }
        .price-sub {
          font-size: 13px;
          opacity: 0.9;
        }
        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: flex-end;
        }
        .badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
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
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 16px;
        }
        .col {
          background: #020617;
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid #1f2937;
        }
        .col-full {
          grid-column: 1 / -1;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #e5e7eb;
        }
        .bullets {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          display: grid;
          gap: 3px;
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
        .hotel-more-btn {
          margin-top: 4px;
          padding: 4px 0;
          background: transparent;
          border: none;
          color: #38bdf8;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }
        .hotel-more-btn:hover {
          color: #0ea5e9;
        }
        .hotel-extra-list {
          margin: 4px 0 0;
          padding-left: 18px;
          font-size: 12px;
          color: #9ca3af;
          display: grid;
          gap: 2px;
        }
        .hotel-extra-name {
          font-weight: 600;
          color: #e5e7eb;
        }
        .hotel-extra-meta {
          color: #9ca3af;
        }
        .footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .footer-left {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
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
        .book-btn {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #0ea5e9;
          background: #0ea5e9;
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }
        .book-btn.hotel {
          border-color: #22c55e;
          background: #22c55e;
          color: #022c22;
        }
        .small-note {
          font-size: 11px;
          color: #9ca3af;
        }
        .more-links {
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed rgba(148, 163, 184, 0.5);
          display: grid;
          gap: 6px;
        }
        .more-links-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .more-label {
          font-size: 12px;
          font-weight: 700;
          color: #e5e7eb;
        }
        .more-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .more-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid transparent;
          box-shadow: 0 2px 5px rgba(15, 23, 42, 0.4);
        }
        .more-chip.flight {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #0f172a;
        }
        .more-chip.flight.alt {
          background: #0f172a;
          border-color: #38bdf8;
          color: #e0f2fe;
        }
        .more-chip.hotel {
          background: linear-gradient(135deg, #22c55e, #14b8a6);
          color: #022c22;
        }
        .more-chip.hotel.alt {
          background: #020617;
          border-color: #22c55e;
          color: #bbf7d0;
        }
        .more-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(56, 189, 248, 0.5);
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
            font-size: 17px;
          }
        }
      `}</style>
    </article>
  );
};

export default ResultCard;
