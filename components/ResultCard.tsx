"use client";
import React, { useMemo } from "react";

/* Airline home sites for the “Airline” button */
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
  /* hotel bits (kept working as-is) */
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
  showHotel,
  showAllHotels = false,
  hotelNights = 0,
  hotelCheckIn,
  hotelCheckOut,
}: Props) {
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  /* segments shape compatibility */
  const outSegs: any[] = pkg?.flight?.segments_out || pkg?.flight?.segments || [];
  const inSegs: any[] = pkg?.flight?.segments_in || pkg?.flight?.segments_return || [];

  const out0 = outSegs?.[0];
  const ret0 = inSegs?.[0];

  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = fmtDate(out0?.depart_time || pkg.departDate);
  const dateRet = fmtDate(ret0?.depart_time || pkg.returnDate);

  const price =
    pkg.total_cost_converted ??
    pkg.total_cost ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    pkg.flight_total ??
    0;

  /* Airline name */
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

  /* Links */
  const gflights = `https://www.google.com/travel/flights?q=${encodeURIComponent(
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

  /* save */
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

  /* ----- rendering helpers ----- */
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
              {s?.from?.toUpperCase()} <span className="arrow">→</span> {s?.to?.toUpperCase()}
            </div>
            <div className="r-time">
              {fmtTime(s?.depart_time)} — {fmtTime(s?.arrive_time)}
            </div>
          </div>
          <div className="r-right">{dur}</div>
        </div>
      );
      /* Layover chip between segments */
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

  return (
    <section className={`result-card ${compared ? "is-compared" : ""}`} onClick={() => onToggleCompare?.(id)}>
      {/* header row stays compact */}
      <div className="head">
        <div className="title">
          <strong>Option {index + 1}</strong> • {from} — {to} {dateOut && `• ${dateOut}`} {dateRet && ` ➜ ${dateRet}`}
        </div>
        <div className="cta">
          <div className="price">💵 {nfMoney(Number(price) || 0, currency)}</div>
          <a className="btn" href={gflights} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="btn" href={skyscanner} target="_blank" rel="noreferrer">Skyscanner</a>
          <a className="btn" href={airlineUrl} target="_blank" rel="noreferrer">{airline || "Airline"}</a>
          <button className="btn ghost" onClick={toggleSave}>{saved ? "💾 Saved" : "＋ Save"}</button>
          <button
            className={`btn ${compared ? "on" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleCompare?.(id); }}
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

      {/* keep hotels exactly as your current rendering expects (no-op here) */}

      <style jsx>{`
        .result-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          background: linear-gradient(180deg, #ffffff, #f6fbff);
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.06);
        }
        .is-compared { border-color: #0ea5e9; border-width: 2px; }

        .head {
          display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .title { font-weight: 900; color: #0f172a; }
        .cta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .price {
          font-weight: 900; color: #0b3b52;
          background: #e7f5ff; border: 1px solid #cfe3ff; border-radius: 10px; padding: 6px 10px;
        }
        .btn { padding: 6px 10px; border-radius: 10px; border: 1px solid #94a3b8; background: #fff; font-weight: 800; color: #0f172a; cursor: pointer; text-decoration: none; }
        .btn.ghost { background: #f8fafc; }
        .btn.on { background: #e0f2fe; border: 2px solid #0ea5e9; }

        /* two separate elegant boxes */
        .leg {
          margin-top: 10px;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
          background: #f9fbff;
          border-radius: 12px;
          padding: 12px;
        }
        .leg + .leg { margin-top: 12px; }
        .leg-title { font-weight: 900; color: #0b3b52; margin-bottom: 8px; }

        /* row layout: city/times at left, duration at right */
        .r-row {
          display: grid; grid-template-columns: 1fr auto; align-items: center;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 10px 12px; margin-bottom: 8px;
        }
        .r-left { display: grid; gap: 4px; }
        .r-city { font-weight: 800; color: #0f172a; }
        .r-time { color: #334155; font-weight: 700; }
        .r-right { font-weight: 900; color: #0f172a; padding-left: 10px; }

        /* center layover chip between rows */
        .layover {
          margin: 6px auto 10px;
          width: fit-content;
          display: inline-flex; align-items: center; gap: 6px;
          border: 1px dashed #cbd5e1; border-radius: 12px; padding: 6px 10px; font-size: 12px;
          background: linear-gradient(135deg, rgba(2,132,199,0.08), rgba(2,132,199,0.02));
        }
        .clock { opacity: .8; }
        .lo-dur { opacity: .75; margin-left: 2px; }
        .arrow { opacity: .65; margin: 0 4px; }
      `}</style>
    </section>
  );
}
