"use client";
import React, { useEffect, useMemo, useState } from "react";

/* money/time helpers */
const money = (n: number, ccy: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy || "USD", maximumFractionDigits: 0 }).format(Math.round(n));
  } catch { return `$${Math.round(n).toLocaleString()}`; }
};
const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
const fmtDate = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const mins = (a?: string, b?: string) => (a && b ? Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000)) : 0);
const fmtDur = (m: number) => (m <= 0 ? "" : `${Math.floor(m / 60)}h ${m % 60}m`);
const ensureHttps = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `https://${u.replace(/^\/\//, "")}`);

type Props = {
  pkg: any;
  index?: number;
  currency?: string;
  pax?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (n: number) => void;
  showHotel?: boolean;
  showAllHotels?: boolean;
  hotelNights?: number;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
};

const LegRows: React.FC<{ segs: any[]; label: string; airline?: string }> = ({ segs, label, airline }) => {
  if (!segs?.length) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const carrier = s?.carrier_name || s?.carrier || airline || "—";
    const dep = s?.depart_time;
    const arr = s?.arrive_time;
    const dur = fmtDur(mins(dep, arr));
    out.push(
      <div key={`seg-${label}-${i}`} className="leg-row">
        <div className="leg-left">
          <div className="leg-airline">{carrier}</div>
          <div className="leg-cities">
            {s?.from?.toUpperCase()} <span className="leg-arrow">→</span> {s?.to?.toUpperCase()}
          </div>
          <div className="leg-times">{fmtTime(dep)} — {fmtTime(arr)}</div>
        </div>
        <div className="leg-right">{dur}</div>
      </div>
    );
    const next = segs[i + 1];
    if (next) {
      const lay = mins(arr, next?.depart_time);
      out.push(
        <div key={`lay-${label}-${i}`} className="layover-chip">
          ⏱ Layover at <strong>{next?.from?.toUpperCase()}</strong> ({fmtDur(lay)}) — departs {fmtTime(next?.depart_time)}
        </div>
      );
    }
  }
  return (
    <div className="result-leg">
      <div className="result-leg-title">{label}</div>
      {out}
    </div>
  );
};

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
  const id = pkg?.id || `pkg-${index}`;
  const outSegs = pkg?.flight?.segments_out || pkg?.segments_out || pkg?.outbound || pkg?.segments?.out || [];
  const inSegs = pkg?.flight?.segments_in || pkg?.segments_in || pkg?.inbound || pkg?.segments?.in || [];

  const from = (outSegs?.[0]?.from || pkg?.origin || pkg?.from || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg?.destination || pkg?.to || "").toUpperCase();
  const dateOut = fmtDate(outSegs?.[0]?.depart_time || pkg?.departDate);
  const dateRet = fmtDate(inSegs?.[0]?.depart_time || pkg?.returnDate);
  const carriers = Array.from(new Set([...(outSegs || []).map((s: any) => s?.carrier_name || s?.carrier), ...(inSegs || []).map((s: any) => s?.carrier_name || s?.carrier)].filter(Boolean)));
  const airline = carriers[0];

  const price =
    pkg?.total_cost_converted ??
    pkg?.total_cost ??
    pkg?.flight?.price_usd_converted ??
    pkg?.flight?.price_usd ??
    pkg?.flight_total ??
    0;

  const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${pax} travelers`
  )}`;

  const trioQS = new URLSearchParams({
    from, to, depart: dateOut || "", ...(dateRet ? { return: dateRet } : {}), price: String(Number(price) || 0), airline: airline || "", pax: String(pax || 1),
  }).toString();
  const trioCheckout = `/book/checkout?${trioQS}`;

  // SAVE state (robust)
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]") as string[];
      setSaved(arr.includes(id));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const k = "triptrio:saved";
      const arr = JSON.parse(localStorage.getItem(k) || "[]") as string[];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      localStorage.setItem(k, JSON.stringify(next));
      setSaved(next.includes(id));
      onSavedChangeGlobal?.(next.length);
    } catch {}
  };

  // Hotels (unchanged; only image size tuned elsewhere in your globals.css)
  const hotels: any[] = Array.isArray(pkg?.hotels) && pkg.hotels.length ? pkg.hotels : pkg?.hotel ? [pkg.hotel] : [];

  const hotelLinks = (h: any) => {
    const q = h?.name ? `${h.name}, ${h?.city || to}` : (h?.city || to || "hotels");
    const booking = new URL("https://www.booking.com/searchresults.html");
    booking.searchParams.set("ss", q);
    if (hotelCheckIn) booking.searchParams.set("checkin", hotelCheckIn);
    if (hotelCheckOut) booking.searchParams.set("checkout", hotelCheckOut);

    const exp = new URL("https://www.expedia.com/Hotel-Search");
    exp.searchParams.set("destination", q);
    if (hotelCheckIn) exp.searchParams.set("startDate", hotelCheckIn);
    if (hotelCheckOut) exp.searchParams.set("endDate", hotelCheckOut);

    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    hcx.searchParams.set("destination", q);
    if (hotelCheckIn) hcx.searchParams.set("checkIn", hotelCheckIn);
    if (hotelCheckOut) hcx.searchParams.set("checkOut", hotelCheckOut);

    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    return { booking: booking.toString(), exp: exp.toString(), hcx: hcx.toString(), maps };
  };

  return (
    <section className={`result-card ${comparedIds?.includes(id) ? "result-card--compared" : ""}`} onClick={() => onToggleCompare?.(id)}>
      <header className="result-head">
        <div className="result-title">
          <div className="result-title__main">Option {index + 1} • {from} — {to}</div>
          <div className="result-title__sub">
            {dateOut && <>Outbound {dateOut}</>} {dateRet && <>• Return {dateRet}</>} {airline && <>• {airline}</>}
          </div>
        </div>
        <div className="result-actions">
          <div className="price-badge">💵 {money(Number(price) || 0, currency || "USD")}</div>
          <a className="btn" href={trioCheckout} target="_blank" rel="noreferrer">TrioTrip</a>
          <a className="btn" href={googleFlights} target="_blank" rel="noreferrer">Google Flights</a>
          <button className={`btn ${saved ? "btn--on" : ""}`} onClick={onToggleSave}>{saved ? "💾 Saved" : "＋ Save"}</button>
          <button className="btn" onClick={(e) => { e.stopPropagation(); onToggleCompare?.(id); }}>
            {comparedIds?.includes(id) ? "🆚 In Compare" : "➕ Compare"}
          </button>
        </div>
      </header>

      {/* Outbound & Return legs — each in its own card; layovers appear between segments */}
      <LegRows segs={outSegs} label="Outbound" airline={airline} />
      <LegRows segs={inSegs} label="Return" airline={airline} />

      {showHotel && hotels.length > 0 && (
        <div className="hotels">
          <div className="hotels__title">{showAllHotels ? "Hotels (all)" : "Hotels (top options)"}</div>
          {(showAllHotels ? hotels : hotels.slice(0, 12)).map((h: any, i: number) => {
            const { booking, exp, hcx, maps } = hotelLinks(h);
            const img = ensureHttps(h?.image) || ensureHttps(h?.photoUrl) || ensureHttps(h?.thumbnail) || `https://picsum.photos/seed/${i + 7}/380/220`;
            return (
              <div key={i} className="hotel">
                <a href={booking} target="_blank" rel="noreferrer" className="hotel__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={h?.name || "Hotel"} />
                </a>
                <div className="hotel__body">
                  <div className="hotel__head">
                    <a href={booking} target="_blank" rel="noreferrer" className="hotel__name">{h?.name || "Hotel"}</a>
                  </div>
                  <div className="hotel__links">
                    <a className="btn" href={booking} target="_blank" rel="noreferrer">Booking.com</a>
                    <a className="btn" href={exp} target="_blank" rel="noreferrer">Expedia</a>
                    <a className="btn" href={hcx} target="_blank" rel="noreferrer">Hotels</a>
                    <a className="btn" href={maps} target="_blank" rel="noreferrer">Map</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
