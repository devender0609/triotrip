"use client";

import React from "react";
import Link from "next/link";

function minsToHM(mins?: number) {
  if (!mins || !Number.isFinite(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}
function unique<T>(arr: T[]) { return Array.from(new Set(arr.filter(Boolean) as any)); }

// Google Flights & Skyscanner deeplinks
function buildFlightLink(kind: "google" | "skyscanner", ctx: {
  origin: string; destination: string; departDate: string; returnDate?: string;
  pax: number; cabin: string;
}) {
  const { origin, destination, departDate, returnDate, pax, cabin } = ctx;
  const rStr = returnDate ? `/${returnDate}` : "";
  if (kind === "google") {
    // https://www.google.com/travel/flights?hl=en#flt=ORIG.DEST.DEP[.RET];c:USD;e:1;sc:b
    const c = encodeURIComponent(cabin || "ECONOMY");
    return `https://www.google.com/travel/flights?hl=en#flt=${origin}.${destination}.${departDate}${rStr};tt:o;px:${pax};c:USD;cl:${c}`;
  } else {
    // https://www.skyscanner.com/transport/flights/ORIG/DEST/DEP/RET/?adults=1&cabinclass=economy
    const dep = departDate?.replace(/-/g, "");
    const ret = (returnDate || "")?.replace(/-/g, "");
    const cab = (cabin || "ECONOMY").toLowerCase().replace("_", "");
    const retPart = returnDate ? `/${ret}` : "";
    return `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${dep}${retPart}/?adults=${pax}&cabinclass=${cab}`;
  }
}

function buildHotelLink(kind: "booking" | "expedia" | "hotels", ctx: {
  city?: string; hotelCheckIn?: string; hotelCheckOut?: string;
}) {
  const { city = "", hotelCheckIn = "", hotelCheckOut = "" } = ctx;
  const ci = hotelCheckIn.replace(/-/g, "");
  const co = hotelCheckOut.replace(/-/g, "");
  const q = encodeURIComponent(city);
  if (kind === "booking") {
    return `https://www.booking.com/searchresults.html?ss=${q}&checkin=${hotelCheckIn}&checkout=${hotelCheckOut}`;
  }
  if (kind === "expedia") {
    return `https://www.expedia.com/Hotel-Search?destination=${q}&startDate=${hotelCheckIn}&endDate=${hotelCheckOut}`;
  }
  return `https://www.hotels.com/search.do?q-destination=${q}&q-check-in=${hotelCheckIn}&q-check-out=${hotelCheckOut}`;
}

export default function ResultCard({
  pkg,
  index,
  currency,
  pax,
  showHotel,
  hotelNights = 0,
  searchCtx,
  comparedIds = [],
  onToggleCompare,
  onSavedChangeGlobal,
}: {
  pkg: any;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights?: number;
  searchCtx: {
    origin: string; destination: string; departDate: string; returnDate?: string;
    pax: number; cabin: string; hotelCheckIn?: string; hotelCheckOut?: string; city?: string;
  };
  comparedIds?: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
}) {
  const id = String(pkg.id || `pkg-${index}`);

  // Airline names
  const outSegs = pkg?.flight?.segments_out || [];
  const retSegs = pkg?.flight?.segments_return || [];
  const carriers = unique([
    ...outSegs.map((s: any) => s?.carrier_name || s?.carrier || s?.airline),
    ...retSegs.map((s: any) => s?.carrier_name || s?.carrier || s?.airline),
  ]).join(", ");

  // Dates (Outbound / Return)
  const outDepISO = outSegs?.[0]?.depart_time_iso || outSegs?.[0]?.depart || pkg?.departDate;
  const retDepISO = retSegs?.[0]?.depart_time_iso || retSegs?.[0]?.depart || pkg?.returnDate;
  const outDate = outDepISO ? new Date(outDepISO) : null;
  const retDate = retDepISO ? new Date(retDepISO) : null;
  const outDateLabel = outDate ? outDate.toLocaleDateString() : (pkg?.departDate || "");
  const retDateLabel = retDate ? retDate.toLocaleDateString() : (pkg?.returnDate || "");

  // Prices
  const flightPrice =
    pkg.flight_total ??
    pkg.total_cost_flight ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    pkg.total_cost;

  const hotelPrice = pkg.hotel_total ?? pkg.hotel?.price_total ?? pkg.hotel?.price;
  const perNight =
    showHotel && hotelNights > 0 && Number.isFinite(Number(hotelPrice))
      ? Number(hotelPrice) / hotelNights
      : undefined;

  // Fancy layovers timeline
  function layoverRows(segs: any[]) {
    if (!segs || segs.length < 2) return null;
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < segs.length - 1; i++) {
      const a = segs[i];
      const b = segs[i + 1];
      const arrive = new Date(a?.arrive_time_iso || a?.arrive || 0).getTime();
      const depart = new Date(b?.depart_time_iso || b?.depart || 0).getTime();
      const layoverMins = Number.isFinite(arrive) && Number.isFinite(depart) ? Math.max(0, Math.round((depart - arrive) / 60000)) : undefined;
      const airport = a?.arrive_airport || a?.arrive_iata || a?.arrive_city || "—";
      nodes.push(
        <div key={`lo-${i}`} className="layover">
          <div className="lo-line">
            <div className="lo-dot" />
            <div className="lo-dash" />
            <div className="lo-dot" />
          </div>
          <div className="lo-chip">
            Layover in <strong>{airport}</strong>
            {layoverMins ? <span>&nbsp;•&nbsp;{minsToHM(layoverMins)}</span> : null}
          </div>
        </div>
      );
    }
    return <div className="layovers">{nodes}</div>;
  }

  const isCompared = comparedIds.includes(id);

  return (
    <section className="card" role="region" aria-label={`Option ${index + 1}`}>
      <header className="row between">
        <div className="stack">
          <div className="muted">Option {index + 1}</div>
          {carriers && <div className="airline">{carriers}</div>}
          <div className="dates">
            {outDateLabel ? <span>Outbound: <strong>{outDateLabel}</strong></span> : null}
            {retDateLabel ? <span style={{ marginLeft: 12 }}>Return: <strong>{retDateLabel}</strong></span> : null}
          </div>
        </div>

        <div className="prices">
          {flightPrice != null && (
            <div className="price">
              <span className="muted">Flight</span>
              <strong>{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(flightPrice))}</strong>
            </div>
          )}
          {showHotel && hotelPrice != null && (
            <div className="price">
              <span className="muted">Hotel</span>
              <strong>{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(hotelPrice))}</strong>
              {perNight != null && Number.isFinite(perNight) ? (
                <div className="pernight">~{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(perNight)} / night</div>
              ) : null}
            </div>
          )}
        </div>
      </header>

      {/* Outbound */}
      {outSegs?.length ? (
        <div className="flight-block">
          <div className="leg-title">Outbound</div>
          <div className="leg">
            {outSegs.map((s: any, i: number) => (
              <div key={`out-${i}`} className="segment">
                <div className="times">
                  <div>{s?.depart_time_local || s?.depart_time || s?.depart}</div>
                  <div className="muted">{s?.depart_airport || s?.from_iata}</div>
                </div>
                <div className="dash" />
                <div className="times">
                  <div>{s?.arrive_time_local || s?.arrive_time || s?.arrive}</div>
                  <div className="muted">{s?.arrive_airport || s?.to_iata}</div>
                </div>
                <div className="dur">{minsToHM(s?.duration_minutes)}</div>
              </div>
            ))}
          </div>
          {layoverRows(outSegs)}
        </div>
      ) : null}

      {/* Return */}
      {retSegs?.length ? (
        <div className="flight-block">
          <div className="leg-title">Return</div>
          <div className="leg">
            {retSegs.map((s: any, i: number) => (
              <div key={`ret-${i}`} className="segment">
                <div className="times">
                  <div>{s?.depart_time_local || s?.depart_time || s?.depart}</div>
                  <div className="muted">{s?.depart_airport || s?.from_iata}</div>
                </div>
                <div className="dash" />
                <div className="times">
                  <div>{s?.arrive_time_local || s?.arrive_time || s?.arrive}</div>
                  <div className="muted">{s?.arrive_airport || s?.to_iata}</div>
                </div>
                <div className="dur">{minsToHM(s?.duration_minutes)}</div>
              </div>
            ))}
          </div>
          {layoverRows(retSegs)}
        </div>
      ) : null}

      {/* Compare / Save / Book */}
      <footer className="row between">
        <div className="left">
          <button
            type="button"
            className={`pill ${isCompared ? "on" : ""}`}
            onClick={() => onToggleCompare(id)}
            title="Add to compare"
          >
            {isCompared ? "✓ Added" : "+ Compare"}
          </button>
          <button type="button" className="pill" onClick={() => onSavedChangeGlobal()}>
            ☆ Save
          </button>
        </div>

        {/* Pre-filled booking links */}
        <div className="right">
          <Link href={buildFlightLink("google", searchCtx)} className="pill" target="_blank" rel="noopener noreferrer">
            Google Flights
          </Link>
          <Link href={buildFlightLink("skyscanner", searchCtx)} className="pill" target="_blank" rel="noopener noreferrer">
            Skyscanner
          </Link>

          {showHotel && (
            <>
              <Link href={buildHotelLink("booking", { city: searchCtx.city, hotelCheckIn: searchCtx.hotelCheckIn, hotelCheckOut: searchCtx.hotelCheckOut })} className="pill" target="_blank" rel="noopener noreferrer">Booking.com</Link>
              <Link href={buildHotelLink("expedia", { city: searchCtx.city, hotelCheckIn: searchCtx.hotelCheckIn, hotelCheckOut: searchCtx.hotelCheckOut })} className="pill" target="_blank" rel="noopener noreferrer">Expedia</Link>
              <Link href={buildHotelLink("hotels", { city: searchCtx.city, hotelCheckIn: searchCtx.hotelCheckIn, hotelCheckOut: searchCtx.hotelCheckOut })} className="pill" target="_blank" rel="noopener noreferrer">Hotels</Link>
            </>
          )}
        </div>
      </footer>

      <style jsx>{`
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; display: grid; gap: 10px; }
        .row { display: flex; align-items: center; gap: 12px; }
        .between { justify-content: space-between; }
        .stack { display: grid; gap: 4px; }
        .muted { color: #64748b; font-weight: 600; }
        .airline { font-weight: 800; color: #0f172a; }
        .dates { color: #334155; font-weight: 700; }

        .prices { display: flex; gap: 14px; align-items: flex-end; }
        .price { display: grid; gap: 2px; text-align: right; }
        .pernight { font-size: 12px; color: #0f172a; opacity: .75; font-weight: 700; }

        .flight-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; }
        .leg-title { font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .leg { display: grid; gap: 8px; }
        .segment {
          display: grid; grid-template-columns: 1fr 40px 1fr auto; gap: 8px; align-items: center;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px;
        }
        .times { display: grid; gap: 2px; }
        .dash { height: 2px; background: linear-gradient(90deg,#06b6d4,#0ea5e9); border-radius: 1px; }
        .dur { font-weight: 800; color: #0ea5e9; }

        /* Fancy layovers */
        .layovers { display: grid; gap: 8px; margin-top: 8px; }
        .layover { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: center;
                   background: #ffffff; border: 1px dashed #bae6fd; border-radius: 12px; padding: 10px; }
        .lo-line { display: grid; justify-items: center; align-items: center; }
        .lo-dot { width: 10px; height: 10px; border-radius: 50%; background: #0ea5e9; }
        .lo-dash { width: 2px; height: 24px; background: linear-gradient(#0ea5e9, transparent); border-radius: 1px; }
        .lo-chip { font-weight: 700; color: #0369a1; }

        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 999px;
          background: #fff; color: #0f172a; text-decoration: none;
          font-weight: 800;
        }
        .pill.on { background: linear-gradient(90deg,#06b6d4,#0ea5e9); border: none; color: #fff; }

        .left, .right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      `}</style>
    </section>
  );
}
