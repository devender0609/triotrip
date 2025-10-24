"use client";
import React, { useMemo } from "react";

/* Airline domains for the Airline button fallback */
const AIRLINE_SITE: Record<string, string> = {
  American: "https://www.aa.com",
  "American Airlines": "https://www.aa.com",
  Delta: "https://www.delta.com",
  "Delta Air Lines": "https://www.delta.com",
  United: "https://www.united.com",
  "United Airlines": "https://www.united.com",
  Alaska: "https://www.alaskaair.com",
  Southwest: "https://www.southwest.com",
  JetBlue: "https://www.jetblue.com",
  Lufthansa: "https://www.lufthansa.com",
};

type Props = {
  pkg: any;
  index?: number;
  currency?: string;
  pax?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (n: number) => void;

  /* hotel bits (provided by page) */
  showHotel?: boolean;
  showAllHotels?: boolean;
  hotelNights?: number;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
};

const nfMoney = (n: number, ccy = "USD") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
};
const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
const fmtDate = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const minsBetween = (a?: string, b?: string) =>
  a && b ? Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000)) : 0;
const fmtDur = (m: number) => (m <= 0 ? "" : `${Math.floor(m / 60)}h ${m % 60}m`);

export default function ResultCard({
  pkg,
  index = 0,
  currency = "USD",
  pax = 1,
  comparedIds,
  onToggleCompare,
  onSavedChangeGlobal,
  showHotel = true,
  showAllHotels = false,
  hotelNights = 0,
  hotelCheckIn,
  hotelCheckOut,
}: Props) {
  const id = pkg?.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  /* segments: support multiple shapes from different sources */
  const outSegs: any[] = pkg?.flight?.segments_out ?? pkg?.flight?.segments ?? pkg?.segments_out ?? [];
  const inSegs: any[] = pkg?.flight?.segments_in ?? pkg?.flight?.segments_return ?? pkg?.segments_in ?? [];

  const out0 = outSegs[0];
  const ret0 = inSegs[0];

  const from = (out0?.from || pkg.origin || pkg.from || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || pkg.to || "").toUpperCase();
  const dateOut = fmtDate(out0?.depart_time || pkg.departDate);
  const dateRet = fmtDate(ret0?.depart_time || pkg.returnDate);

  const price =
    pkg.total_cost_converted ??
    pkg.total_cost ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    pkg.flight_total ??
    0;

  /* Airline name (first unique carrier found) */
  const carriers = Array.from(
    new Set(
      [
        pkg.flight?.carrier_name,
        pkg.flight?.carrier,
        ...outSegs.map((s: any) => s?.carrier_name || s?.carrier),
        ...inSegs.map((s: any) => s?.carrier_name || s?.carrier),
      ].filter(Boolean)
    )
  );
  const airline = carriers[0];

  /* External links */
  const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${pax} travelers`
  )}`;
  const skyscanner = (() => {
    const o = dateOut?.replace(/-/g, "");
    const r = dateRet?.replace(/-/g, "");
    return from && to && o
      ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${o}/${r ? r + "/" : ""}`
      : "https://www.skyscanner.com/";
  })();
  const airlineUrl =
    AIRLINE_SITE[airline || ""] ||
    `https://www.google.com/search?q=${encodeURIComponent(`${airline || "airline"} ${from} ${to} ${dateOut}`)}`;

  /* Save handling */
  const saved = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem("triptrio:saved") || "[]") as string[]).includes(id);
    } catch {
      return false;
    }
  }, [id]);
  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const k = "triptrio:saved";
      const arr = JSON.parse(localStorage.getItem(k) || "[]") as string[];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      localStorage.setItem(k, JSON.stringify(next));
      onSavedChangeGlobal?.(next.length);
    } catch {}
  };

  /* Hotels — accept several possible field names so we don’t lose them */
  const hotels: any[] =
    pkg?.hotels ??
    pkg?.hotelResults ??
    pkg?.hotel_options ??
    pkg?.topHotels ??
    pkg?.hotelsTopOptions ??
    [];

  /* Render helpers */
  const LegRows: React.FC<{ segs: any[] }> = ({ segs }) => {
    if (!segs?.length) return null;
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const dur = fmtDur(minsBetween(s?.depart_time, s?.arrive_time));
      rows.push(
        <div className="r-row" key={`row-${i}`}>
          <div className="r-left">
            <div className="r-city">
              {String(s?.from || "").toUpperCase()} <span className="arrow">→</span>{" "}
              {String(s?.to || "").toUpperCase()}
            </div>
            <div className="r-time">
              {fmtTime(s?.depart_time)} — {fmtTime(s?.arrive_time)}
            </div>
            {s?.carrier_name || s?.carrier ? (
              <div className="r-airline">{s?.carrier_name || s?.carrier}</div>
            ) : null}
          </div>
          <div className="r-right">{dur}</div>
        </div>
      );
      const next = segs[i + 1];
      if (next) {
        const lay = minsBetween(s?.arrive_time, next?.depart_time);
        rows.push(
          <div className="layover" key={`lay-${i}`}>
            <span className="clock">⏱</span>
            <span>Layover in</span>
            <strong>&nbsp;{String(next?.from || "").toUpperCase()}&nbsp;</strong>
            <span>• Next departs at</span>
            <strong>&nbsp;{fmtTime(next?.depart_time)}&nbsp;</strong>
            <span className="lo-dur">({fmtDur(lay)})</span>
          </div>
        );
      }
    }
    return <>{rows}</>;
  };

  const HotelRow: React.FC<{ h: any }> = ({ h }) => {
    const name = h?.name || h?.hotel_name || "Hotel";
    const code = (h?.city || h?.iata || h?.code || to || "").toUpperCase();

    /* price: prefer nightly, else compute nightly from total and nights, else show total */
    const total =
      h?.total ??
      h?.totalPrice ??
      h?.price_total ??
      h?.price ??
      undefined;
    const nightly =
      h?.nightly ??
      h?.priceNight ??
      h?.price_per_night ??
      (hotelNights && total ? total / Math.max(1, hotelNights) : undefined);

    /* links if present (don’t invent deep links to avoid breakage) */
    const linkBooking = h?.links?.booking || h?.links?.bookingcom || h?.bookingUrl;
    const linkExpedia = h?.links?.expedia || h?.expediaUrl;
    const linkHotels = h?.links?.hotels || h?.hotelsUrl || h?.links?.hotelscom;
    const linkMap =
      h?.links?.map ||
      h?.mapUrl ||
      `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${code}`)}`;

    const img = h?.image || h?.photo || h?.thumbnail;

    return (
      <div className="hotel-row">
        <div className="hotel-left">
          <div className="thumb">{img ? <img src={img} alt={name} /> : <div className="ph" />}</div>
          <div className="hotel-meta">
            <div className="hotel-name">{name}</div>
            <div className="hotel-sub">{code}</div>
          </div>
        </div>
        <div className="hotel-cta">
          {nightly != null && (
            <div className="price-night">/night {nfMoney(nightly, currency)}</div>
          )}
          {total != null && hotelNights > 0 && (
            <div className="price-total">total {nfMoney(total, currency)}</div>
          )}
          <div className="hotel-links">
            {linkBooking && (
              <a className="btn" href={linkBooking} target="_blank" rel="noreferrer">
                Booking.com
              </a>
            )}
            {linkExpedia && (
              <a className="btn" href={linkExpedia} target="_blank" rel="noreferrer">
                Expedia
              </a>
            )}
            {linkHotels && (
              <a className="btn" href={linkHotels} target="_blank" rel="noreferrer">
                Hotels
              </a>
            )}
            {linkMap && (
              <a className="btn" href={linkMap} target="_blank" rel="noreferrer">
                Map
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={`result-card ${compared ? "is-compared" : ""}`} onClick={() => onToggleCompare?.(id)}>
      {/* compact header */}
      <div className="head">
        <div className="title">
          <strong>Option {index + 1}</strong> • {from} — {to} {dateOut && `• ${dateOut}`}{" "}
          {dateRet && ` ➜ ${dateRet}`}
        </div>
        <div className="cta">
          <div className="price">💵 {nfMoney(Number(price) || 0, currency)}</div>
          <a className="btn" href={googleFlights} target="_blank" rel="noreferrer">
            Google Flights
          </a>
          <a className="btn" href={skyscanner} target="_blank" rel="noreferrer">
            Skyscanner
          </a>
          <a className="btn" href={airlineUrl} target="_blank" rel="noreferrer">
            {airline || "Airline"}
          </a>
          <button className="btn ghost" onClick={toggleSave}>
            {saved ? "💾 Saved" : "＋ Save"}
          </button>
          <button
            className={`btn ${compared ? "on" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare?.(id);
            }}
          >
            {compared ? "🆚 In Compare" : "＋ Compare"}
          </button>
        </div>
      </div>

      {/* Outbound box */}
      {outSegs?.length > 0 && (
        <div className="leg">
          <div className="leg-title">Outbound</div>
          <LegRows segs={outSegs} />
        </div>
      )}

      {/* Return box */}
      {inSegs?.length > 0 && (
        <div className="leg">
          <div className="leg-title">Return</div>
          <LegRows segs={inSegs} />
        </div>
      )}

      {/* Hotels (top options) */}
      {showHotel && hotels?.length > 0 && (
        <div className="hotels">
          <div className="hotels-title">Hotels (top options)</div>
          <div className="hotel-list">
            {(showAllHotels ? hotels : hotels.slice(0, 3)).map((h: any, i: number) => (
              <HotelRow key={h?.id || h?.hotel_id || i} h={h} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .result-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          background: linear-gradient(180deg, #ffffff, #f6fbff);
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.06);
        }
        .is-compared {
          border-color: #0ea5e9;
          border-width: 2px;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .title {
          font-weight: 900;
          color: #0f172a;
        }
        .cta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .price {
          font-weight: 900;
          color: #0b3b52;
          background: #e7f5ff;
          border: 1px solid #cfe3ff;
          border-radius: 10px;
          padding: 6px 10px;
        }
        .btn {
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid #94a3b8;
          background: #fff;
          font-weight: 800;
          color: #0f172a;
          cursor: pointer;
          text-decoration: none;
        }
        .btn.ghost {
          background: #f8fafc;
        }
        .btn.on {
          background: #e0f2fe;
          border: 2px solid #0ea5e9;
        }

        .leg {
          margin-top: 10px;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
          background: #f9fbff;
          border-radius: 12px;
          padding: 12px;
        }
        .leg + .leg {
          margin-top: 12px;
        }
        .leg-title {
          font-weight: 900;
          color: #0b3b52;
          margin-bottom: 8px;
        }

        .r-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 12px;
          margin-bottom: 8px;
        }
        .r-left {
          display: grid;
          gap: 3px;
        }
        .r-city {
          font-weight: 800;
          color: #0f172a;
        }
        .r-airline {
          font-weight: 700;
          color: #334155;
          opacity: 0.9;
        }
        .r-time {
          color: #334155;
          font-weight: 700;
        }
        .r-right {
          font-weight: 900;
          color: #0f172a;
          padding-left: 10px;
        }
        .arrow {
          opacity: 0.65;
          margin: 0 4px;
        }
        .layover {
          margin: 6px auto 10px;
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 6px 10px;
          font-size: 12px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(2, 132, 199, 0.02));
        }
        .clock {
          opacity: 0.8;
        }
        .lo-dur {
          opacity: 0.75;
          margin-left: 2px;
        }

        .hotels {
          margin-top: 14px;
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
        }
        .hotels-title {
          font-weight: 900;
          color: #0b3b52;
          margin-bottom: 10px;
        }
        .hotel-list {
          display: grid;
          gap: 10px;
        }
        .hotel-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 12px;
        }
        .hotel-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .thumb {
          width: 110px;
          height: 70px;
          border-radius: 10px;
          overflow: hidden;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .thumb .ph {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #eef2f7, #f7fafc);
        }
        .hotel-meta {
          display: grid;
          gap: 2px;
        }
        .hotel-name {
          font-weight: 900;
          color: #0f172a;
        }
        .hotel-sub {
          color: #334155;
          font-weight: 700;
          opacity: 0.85;
        }
        .hotel-cta {
          display: grid;
          gap: 6px;
          justify-items: end;
        }
        .price-night,
        .price-total {
          font-weight: 900;
          color: #0b3b52;
        }
        .hotel-links {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      `}</style>
    </section>
  );
}
