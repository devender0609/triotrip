"use client";

import React from "react";
import Image from "next/image";

type Leg = {
  from: string;
  to: string;
  depart: string; // "06:00 AM"
  arrive: string; // "07:45 AM"
  duration: string; // "1h 45m"
  airlineCode?: string;
  airlineName?: string;
};

type Segment = {
  legs: Leg[];
  layover?: {
    airport: string; // "CLT"
    nextDepart: string; // "08:50 AM"
  };
};

type HotelLinkSet = {
  booking?: string;
  expedia?: string;
  hotels?: string;
  map?: string;
};

type Hotel = {
  id: string;
  name: string;
  cityCode: string;
  image?: string;
  priceNight?: number; // optional: show /night if present
  priceTotal?: number; // optional total for stay
  currency?: string;
  links: HotelLinkSet;
};

type Pkg = {
  id?: string;
  title?: string;
  price?: number;
  currency?: string;
  vendorLinks?: {
    triotrip?: string;
    googleFlights?: string;
    skyscanner?: string;
    airline?: string;
  };
  outbound: Segment;
  inbound?: Segment;
  hotels?: Hotel[];
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
  onSavedChangeGlobal: () => void;
};

function FlightRow({ leg }: { leg: Leg }) {
  return (
    <div className="fr">
      <div className="fr__route">
        <div className="fr__city">
          {leg.from} <span>→</span> {leg.to}
        </div>
        <div className="fr__time">
          {leg.depart} — {leg.arrive}
        </div>
      </div>
      <div className="fr__meta">
        {leg.airlineName ? (
          <span className="fr__airline">{leg.airlineName}</span>
        ) : leg.airlineCode ? (
          <span className="fr__airline">{leg.airlineCode}</span>
        ) : null}
        <span className="fr__dur">{leg.duration}</span>
      </div>
    </div>
  );
}

function Layover({ airport, nextDepart }: { airport: string; nextDepart: string }) {
  return (
    <div className="lay">
      <span className="lay__dot" />
      <span className="lay__label">
        Layover in <b>{airport}</b> • Next departs at <b>{nextDepart}</b>
      </span>
    </div>
  );
}

export default function ResultCard(props: Props) {
  const {
    pkg,
    index,
    currency,
    showHotel,
    hotelNights,
    showAllHotels,
    comparedIds,
    onToggleCompare,
  } = props;

  const id = pkg.id || `pkg-${index}`;
  const isCompared = comparedIds.includes(id);

  const fmtMoney = (n?: number, cur = currency) =>
    typeof n === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n)
      : "";

  return (
    <div className="rc">
      {/* Header bar with dates + price + vendor buttons + compare */}
      <div className="rc__hdr">
        <div className="rc__title">
          <span className="rc__opt">Option {index + 1}</span>
          {pkg.title && <span className="rc__route"> • {pkg.title}</span>}
        </div>

        <div className="rc__actions">
          {typeof pkg.price === "number" && (
            <span className="rc__price">{fmtMoney(pkg.price, pkg.currency || currency)}</span>
          )}
          {pkg.vendorLinks?.triotrip && (
            <a className="btn" href={pkg.vendorLinks.triotrip} target="_blank" rel="noreferrer">
              TrioTrip
            </a>
          )}
          {pkg.vendorLinks?.googleFlights && (
            <a className="btn" href={pkg.vendorLinks.googleFlights} target="_blank" rel="noreferrer">
              Google Flights
            </a>
          )}
          {pkg.vendorLinks?.skyscanner && (
            <a className="btn" href={pkg.vendorLinks.skyscanner} target="_blank" rel="noreferrer">
              Skyscanner
            </a>
          )}
          {pkg.vendorLinks?.airline && (
            <a className="btn" href={pkg.vendorLinks.airline} target="_blank" rel="noreferrer">
              Airline
            </a>
          )}
          <button
            className={`btn btn--ghost ${isCompared ? "is-on" : ""}`}
            onClick={() => onToggleCompare(id)}
          >
            + Compare
          </button>
        </div>
      </div>

      {/* Outbound */}
      <div className="rc__blk">
        <div className="rc__blkTitle">Outbound</div>
        {pkg.outbound.legs.map((leg, i) => (
          <React.Fragment key={`out-${i}`}>
            <FlightRow leg={leg} />
            {i === 0 && pkg.outbound.layover && (
              <Layover
                airport={pkg.outbound.layover.airport}
                nextDepart={pkg.outbound.layover.nextDepart}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Return */}
      {pkg.inbound && (
        <div className="rc__blk">
          <div className="rc__blkTitle">Return</div>
          {pkg.inbound.legs.map((leg, i) => (
            <React.Fragment key={`in-${i}`}>
              <FlightRow leg={leg} />
              {i === 0 && pkg.inbound?.layover && (
                <Layover
                  airport={pkg.inbound.layover.airport}
                  nextDepart={pkg.inbound.layover.nextDepart}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Hotels */}
      {showHotel && pkg.hotels?.length ? (
        <div className="rc__hotels">
          <div className="rc__hotelsTitle">Hotels (top options)</div>
          {(showAllHotels ? pkg.hotels : pkg.hotels.slice(0, 3)).map((h) => (
            <div className="h" key={h.id}>
              <div className="h__left">
                <div className="h__img">
                  {h.image ? (
                    <Image src={h.image} alt="" fill style={{ objectFit: "cover" }} />
                  ) : (
                    <Image src="/logo.png" alt="" fill style={{ objectFit: "cover" }} />
                  )}
                </div>
                <div className="h__info">
                  <div className="h__name">{h.name}</div>
                  <div className="h__city">{h.cityCode}</div>
                </div>
              </div>
              <div className="h__right">
                {(h.priceNight || h.priceTotal) && (
                  <div className="h__price">
                    {h.priceNight ? (
                      <span>
                        {fmtMoney(h.priceNight, h.currency || currency)} <em>/ night</em>
                      </span>
                    ) : null}
                    {h.priceTotal ? (
                      <span className="h__priceTotal">
                        {fmtMoney(h.priceTotal, h.currency || currency)}{" "}
                        <em>total · {hotelNights} night{hotelNights > 1 ? "s" : ""}</em>
                      </span>
                    ) : null}
                  </div>
                )}
                <div className="h__links">
                  {h.links.booking && (
                    <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">
                      Booking.com
                    </a>
                  )}
                  {h.links.expedia && (
                    <a className="btn" href={h.links.expedia} target="_blank" rel="noreferrer">
                      Expedia
                    </a>
                  )}
                  {h.links.hotels && (
                    <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">
                      Hotels
                    </a>
                  )}
                  {h.links.map && (
                    <a className="btn" href={h.links.map} target="_blank" rel="noreferrer">
                      Map
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Scoped styles so formatting never “disappears” again */}
      <style jsx>{`
        .rc {
          border: 1px solid #e6eef7;
          border-radius: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.04);
          margin: 14px 0;
        }

        .rc__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid #e6eef7;
          background: linear-gradient(90deg, #eef7ff, #ffffff);
          border-top-left-radius: 14px;
          border-top-right-radius: 14px;
        }
        .rc__title {
          font-weight: 800;
          color: #0b3b52;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .rc__opt { white-space: nowrap; }
        .rc__route { color: #335; }

        .rc__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rc__price {
          background: linear-gradient(90deg, #e0f2fe, #f0f9ff);
          border: 1px solid #dbeafe;
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 900;
          color: #0b3b52;
        }
        .btn {
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 700;
          text-decoration: none;
          color: #0f172a;
          transition: box-shadow 0.2s ease, transform 0.05s ease;
        }
        .btn:hover {
          box-shadow: 0 6px 16px rgba(2, 6, 23, 0.08);
          transform: translateY(-1px);
        }
        .btn--ghost { background: #f8fafc; }
        .btn--ghost.is-on { background: #e0f2fe; border-color: #bae6fd; }

        .rc__blk {
          padding: 12px;
          border-top: 1px dashed #e6eef7;
        }
        .rc__blkTitle {
          font-weight: 800;
          margin-bottom: 8px;
          color: #0b3b52;
        }

        .fr {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 6px;
        }
        .fr + .fr { border-top: 1px dotted #e6eef7; }
        .fr__route { display: grid; }
        .fr__city { font-weight: 800; color: #0f172a; }
        .fr__city span { opacity: 0.65; }
        .fr__time { color: #334155; }
        .fr__meta { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
        .fr__airline {
          font-weight: 700;
          color: #0b3b52;
          padding: 2px 8px;
          background: #eef6ff;
          border: 1px solid #e6eef7;
          border-radius: 999px;
        }
        .fr__dur { color: #475569; }

        .lay {
          margin: 10px 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px dashed #d1e3f8;
          color: #334155;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .lay__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }

        .rc__hotels {
          padding: 12px;
          border-top: 1px solid #e6eef7;
          background: linear-gradient(180deg, #ffffff, #f9fbff);
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
        }
        .rc__hotelsTitle {
          font-weight: 800;
          color: #0b3b52;
          margin-bottom: 10px;
        }

        .h {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 10px 0;
          border-top: 1px dashed #e6eef7;
        }
        .h:first-of-type { border-top: none; }
        .h__left {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .h__img {
          position: relative;
          width: 120px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e6eef7;
          background: #fff;
        }
        .h__info { display: grid; gap: 2px; }
        .h__name { font-weight: 800; color: #0f172a; }
        .h__city { color: #64748b; font-weight: 600; }

        .h__right {
          display: grid;
          gap: 8px;
          justify-items: end;
        }
        .h__price {
          display: grid;
          gap: 4px;
          text-align: right;
        }
        .h__price em { color: #64748b; font-style: normal; font-weight: 600; }
        .h__priceTotal { color: #0b3b52; font-weight: 800; }
        .h__links { display: flex; gap: 8px; flex-wrap: wrap; justify-content: end; }
      `}</style>
    </div>
  );
}
