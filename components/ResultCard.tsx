"use client";

import React, { useMemo, useState } from "react";

type Props = {
  pkg: any;
  index: number;
  currency: string;
  pax: number;
  showHotel?: boolean;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (n: number) => void;
};

export default function ResultCard(props: Props) {
  const { pkg, index, currency, pax, showHotel, comparedIds, onToggleCompare, onSavedChangeGlobal } = props;
  const id = String(pkg?.id || `pkg-${index}`);
  const compared = !!comparedIds && comparedIds.includes(id);

  const fmt = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "USD").toUpperCase() }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }); }
  }, [currency]);

  const f = pkg?.flight || {};
  const segmentsOut: any[] = Array.isArray(f?.segments_out) ? f.segments_out : (Array.isArray(f?.segments) ? f.segments : []);
  const segmentsIn: any[] = Array.isArray(f?.segments_in) ? f.segments_in : (Array.isArray(f?.return_segments) ? f.return_segments : []);
  const airline = f?.carrier_name || segmentsOut?.[0]?.airlineName || f?.carrier || "Airline";
  const origin = f?.origin || pkg?.origin || segmentsOut?.[0]?.from || "";
  const destination = f?.destination || pkg?.destination || segmentsOut?.slice(-1)?.[0]?.to || "";

  const depart = f?.depart_date || pkg?.departDate || pkg?.depart || "";
  const ret = f?.return_date || pkg?.returnDate || "";
  const dateOut = depart ? new Date(depart).toLocaleDateString() : "";
  const dateRet = pkg?.roundTrip && ret ? new Date(ret).toLocaleDateString() : "";

  const flightOnlyPrice = (typeof pkg?.flight_total === "number" && pkg.flight_total) || (typeof f?.price_usd_converted === "number" && f.price_usd_converted) || (typeof f?.price_usd === "number" && f.price_usd) || 0;
  const totalCost = (typeof pkg?.total_cost === "number" && pkg.total_cost) || flightOnlyPrice;

  function gfURL() {
    const outFrom = (segmentsOut?.[0]?.fromCode || segmentsOut?.[0]?.from || origin || "").toString().slice(-3).toUpperCase();
    const outTo = (segmentsOut?.slice(-1)?.[0]?.toCode || segmentsOut?.slice(-1)?.[0]?.to || destination || "").toString().slice(-3).toUpperCase();
    const d1 = (depart || "").slice(0,10);
    const d2 = (ret || "").slice(0,10);
    const base = new URL("https://www.google.com/travel/flights");
    base.searchParams.set("f", `${outFrom}.${outTo}.${d1}`);
    if (pkg?.roundTrip && d2) base.searchParams.set("r", `${outTo}.${outFrom}.${d2}`);
    base.searchParams.set("q", `${outFrom} to ${outTo} on ${d1}${pkg?.roundTrip && d2 ? " return " + d2 : ""}`);
    return base.toString();
  }

  const [isSaved, setIsSaved] = useState<boolean>(() => {
    try { const arr: string[] = JSON.parse(localStorage.getItem("triptrio:saved") || "[]"); return arr.includes(id); }
    catch { return false; }
  });
  function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const arr: string[] = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      const exists = arr.includes(id);
      const next = exists ? arr.filter(x => x !== id) : arr.concat(id);
      localStorage.setItem("triptrio:saved", JSON.stringify(next));
      setIsSaved(!exists);
      window.dispatchEvent(new Event("triptrio:saved:changed"));
      onSavedChangeGlobal?.(next.length);
    } catch {}
  }

  const fmtTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (!Number.isFinite(+d)) return iso;
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };
  const fmtDur = (mins?: number) => Number.isFinite(mins) ? `${Math.floor((mins||0)/60)}h ${(mins||0)%60}m` : "";

  function renderLegs(segs: any[]) {
    if (!Array.isArray(segs) || segs.length === 0) return null;
    const rows: React.ReactNode[] = [];
    segs.forEach((s, i) => {
      const from = s?.fromCode || s?.from || s?.departure?.iata || s?.departure?.iataCode || "—";
      const to = s?.toCode || s?.to || s?.arrival?.iata || s?.arrival?.iataCode || "—";
      rows.push(
        <div key={`leg-${i}`} className="leg">
          <div><strong>{from}</strong> {fmtTime(s?.depart_time || s?.departureTime)} → <strong>{to}</strong> {fmtTime(s?.arrive_time || s?.arrivalTime)}</div>
          <div className="muted">Flight {fmtDur(Number(s?.duration_minutes) || 0)}</div>
        </div>
      );
      if (i < segs.length - 1) {
        const lay = Number(segs[i]?.layover_minutes) || 0;
        const airport = segs[i]?.arrivalCity || segs[i]?.arrivalAirport || to;
        rows.push(
          <div key={`lay-${i}`} className="layover">
            <span className="lo-pill">Layover in <b>{airport}</b> • {fmtDur(lay)}</span>
          </div>
        );
      }
    });
    return rows;
  }

  return (
    <section className={`rc${compared ? " rc--compared":""}`} onClick={() => onToggleCompare?.(id)}>
      <header className="rc-head">
        <div className="row">
          <div className="title">Option {index + 1} • {origin} → {destination} {dateOut ? `• ${dateOut}` : ""} {pkg.roundTrip && dateRet ? `• ${dateRet}` : ""}</div>
          <div className="price">{fmt.format(Math.round(Number(totalCost) || 0))}</div>
        </div>
        <div className="row">
          <div className="airline">{airline}</div>
          <div className="actions">
            <button className={"btn " + (compared ? "btn--on" : "")} onClick={(e)=>{e.stopPropagation(); onToggleCompare?.(id);}}>{compared? "✓ In Compare":"＋ Compare"}</button>
            <button className={"btn " + (isSaved ? "btn--on" : "")} onClick={toggleSave}>{isSaved ? "★ Saved" : "☆ Save"}</button>
            <a className="btn" href={gfURL()} target="_blank" rel="noreferrer">Google Flights</a>
            <a className="btn" href={`https://www.skyscanner.com/`} target="_blank" rel="noreferrer">Skyscanner</a>
          </div>
        </div>
      </header>

      <div className="rc-body">
        <div className="legbox">
          <div className="legttl">Outbound</div>
          {renderLegs(segmentsOut)}
        </div>

        {pkg.roundTrip && segmentsIn?.length > 0 && (
          <div className="legbox">
            <div className="legttl">Return</div>
            {renderLegs(segmentsIn)}
          </div>
        )}

        {showHotel && (pkg?.hotel || pkg?.hotel_total) && (
          <div className="hotels">
            <div className="legttl">Hotels (top options)</div>
            <div className="hlinks">
              <a className="btn" href="https://www.booking.com/" target="_blank" rel="noreferrer">Booking.com</a>
              <a className="btn" href="https://www.expedia.com/" target="_blank" rel="noreferrer">Expedia</a>
              <a className="btn" href="https://www.hotels.com/" target="_blank" rel="noreferrer">Hotels</a>
              <a className="btn" href={`https://www.google.com/maps/search/hotels+in+${encodeURIComponent(pkg?.destination || "")}`} target="_blank" rel="noreferrer">Map</a>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .rc{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}
        .rc--compared{outline:2px solid #0ea5e9}
        .row{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
        .title{font-weight:800;color:#0f172a}
        .airline{font-weight:700;color:#334155}
        .price{font-weight:900;background:#e7f5ff;border:1px solid #cfe3ff;border-radius:10px;padding:6px 10px;color:#0b3b52}
        .actions{display:flex;gap:6px;flex-wrap:wrap}
        .btn{display:inline-block;padding:6px 10px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;text-decoration:none;font-weight:800;color:#0f172a}
        .btn--on{background:#e0f2fe;border-color:#0ea5e9}
        .rc-body{display:grid;gap:10px;margin-top:8px}
        .legbox{border:1px dashed #cbd5e1;border-radius:12px;padding:10px;background:#f8fafc}
        .legttl{font-weight:900;margin-bottom:6px}
        .leg{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin:4px 0}
        .muted{color:#334155;font-weight:600;font-size:13px}
        .layover{display:flex;align-items:center;justify-content:center;margin:6px 0}
        .lo-pill{border:1px dashed #cbd5e1;border-radius:999px;padding:6px 10px;background:#fff; color:#0f172a; font-weight:700}
        .hotels{border-top:1px solid #e5e7eb;padding-top:8px}
        .hlinks{display:flex;gap:6px;flex-wrap:wrap}
      `}</style>
    </section>
  );
}