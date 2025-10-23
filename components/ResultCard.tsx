"use client";

import React, { useMemo } from "react";

type Props = {
  pkg: any;
  index: number;
  currency: string;
  pax: number;
  large?: boolean;
  showHotel?: boolean;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (n: number) => void;
};

export default function ResultCard(props: Props) {
  const { pkg, index, currency, pax, large, showHotel, comparedIds, onToggleCompare } = props;
  const id = String(pkg?.id || `pkg-${index}`);
  const compared = !!comparedIds && comparedIds.includes(id);

  const fmtPrice = useMemo(() => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "USD").toUpperCase() }); }
    catch { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }); }
  }, [currency]);

  const f = pkg?.flight || {};
  const segmentsOut: any[] = Array.isArray(f?.segments_out) ? f.segments_out : (Array.isArray(f?.segments) ? f.segments : []);
  const segmentsIn: any[] = Array.isArray(f?.segments_in) ? f.segments_in : (Array.isArray(f?.return_segments) ? f.return_segments : []);

  const depart = f?.depart_date || pkg?.departDate || pkg?.depart || "";
  const ret = f?.return_date || pkg?.returnDate || "";
  const dateOut = depart ? new Date(depart).toLocaleDateString() : "";
  const dateRet = pkg?.roundTrip && ret ? new Date(ret).toLocaleDateString() : "";

  const origin = f?.origin || pkg?.origin || segmentsOut?.[0]?.from || "";
  const destination = f?.destination || pkg?.destination || segmentsOut?.slice(-1)?.[0]?.to || "";

  const durOutMin = segmentsOut.reduce((t, s) => t + (Number(s?.duration_minutes) || 0), 0);
  const durRetMin = segmentsIn.reduce((t, s) => t + (Number(s?.duration_minutes) || 0), 0);

  const airline =
    f?.carrier_name ||
    segmentsOut?.[0]?.airlineName ||
    segmentsOut?.[0]?.marketingCarrier ||
    f?.carrier ||
    "Airline";

  const flightOnlyPrice =
    (typeof pkg?.flight_total === "number" && pkg.flight_total) ||
    (typeof f?.price_usd_converted === "number" && f.price_usd_converted) ||
    (typeof f?.price_usd === "number" && f.price_usd) ||
    0;

  const totalCost = (typeof pkg?.total_cost === "number" && pkg.total_cost) || flightOnlyPrice;

  // --- Google Flights prefilled deep link: f=OUT, r=RET (if any); also pax and cabin soft defaults
  function gfURL() {
    const outFrom = (segmentsOut?.[0]?.fromCode || segmentsOut?.[0]?.from || origin || "").toString().slice(-3).toUpperCase();
    const outTo = (segmentsOut?.slice(-1)?.[0]?.toCode || segmentsOut?.slice(-1)?.[0]?.to || destination || "").toString().slice(-3).toUpperCase();
    const d1 = (depart || "").slice(0,10);
    const d2 = (ret || "").slice(0,10);
    const base = new URL("https://www.google.com/travel/flights");
    const fparam = `${outFrom}.${outTo}.${d1}`;
    base.searchParams.set("f", fparam);
    if (pkg?.roundTrip && d2) base.searchParams.set("r", `${outTo}.${outFrom}.${d2}`);
    // pax param isn't officially documented, but q param is: keep a friendly query as fallback
    base.searchParams.set("q", `${outFrom} to ${outTo} on ${d1}${pkg?.roundTrip && d2 ? " return " + d2 : ""}`);
    return base.toString();
  }

  // Airline site and others
  const airlineSite = f?.bookingLinks?.airlineSite || "";
  const skyScanner = f?.bookingLinks?.skyscanner || `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${(depart||"").replaceAll("-","")}/`;
  const trioTrip = f?.bookingLinks?.triptrio || "#";

  const priceFmt = fmtPrice.format(Math.round(Number(totalCost) || 0));
  const route = `${origin} → ${destination}`;

  const fmtTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (!Number.isFinite(+d)) return iso;
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };
  const fmtDur = (mins?: number) => Number.isFinite(mins) ? `${Math.floor((mins||0)/60)}h ${(mins||0)%60}m` : "";

  // ---- Layover blocks (bigger & elegant), with explicit duration
  function renderLeg(segs: any[]) {
    if (!Array.isArray(segs) || segs.length === 0) return null;
    const rows: React.ReactNode[] = [];
    segs.forEach((s, i) => {
      const from = s?.fromCode || s?.from || s?.departure?.iata || s?.departure?.iataCode || "—";
      const to = s?.toCode || s?.to || s?.arrival?.iata || s?.arrival?.iataCode || "—";
      rows.push(
        <div key={`leg-${i}`} className="leg">
          <div className="leg-route"><strong>{from}</strong> {fmtTime(s?.depart_time || s?.departureTime)} → <strong>{to}</strong> {fmtTime(s?.arrive_time || s?.arrivalTime)}</div>
          <div className="leg-meta">Flight time {fmtDur(Number(s?.duration_minutes) || 0)}</div>
        </div>
      );
      // layover after this segment (if not last)
      if (i < segs.length - 1) {
        const lay = Number(segs[i]?.layover_minutes) || 0;
        const airport = segs[i]?.arrivalCity || segs[i]?.arrivalAirport || to;
        rows.push(
          <div key={`lay-${i}`} className="layover">
            <div className="layover-title">Layover — {airport}</div>
            <div className="layover-meta">Duration {fmtDur(lay)}</div>
          </div>
        );
      }
    });
    return rows;
  }

  const wrapStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 16, padding: 12, background: "#fff", cursor: onToggleCompare ? "pointer" : "default" };

  return (
    <section className={`result-card ${compared ? "result-card--compared" : ""}`} style={wrapStyle} onClick={() => onToggleCompare?.(id)}>
      {/* Header + quick actions */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800, color: "#0f172a", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span>Option {index + 1}</span>
          <span>• {route}</span>
          {dateOut ? <span>• Outbound {dateOut}</span> : null}
          {pkg.roundTrip && dateRet ? <span>↩ Return {dateRet}</span> : null}
          <span style={{ opacity: .6 }}>•</span>
          <span style={{ fontWeight: 900 }}>{airline}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Price */}
          <div style={{ fontWeight: 900, color: "#0b3b52", background: "#e7f5ff", border: "1px solid #cfe3ff", borderRadius: 10, padding: "6px 10px" }}>
            💵 {priceFmt}
          </div>
          {/* Booking actions */}
          <a className="book-link" href={trioTrip} rel="noreferrer">TrioTrip</a>
          <a className="book-link" href={gfURL()} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="book-link" href={skyScanner} target="_blank" rel="noreferrer">Skyscanner</a>
          {airlineSite && <a className="book-link" href={airlineSite} target="_blank" rel="noreferrer">{airline}</a>}
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCompare(id); }}
              aria-pressed={compared}
              title={compared ? "Remove from Compare" : "Add to Compare"}
              style={{
                border: compared ? "2px solid #0ea5e9" : "1px solid #94a3b8",
                background: compared ? "#e0f2fe" : "#fff",
                color: "#0f172a",
                padding: "6px 10px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {compared ? "✓ In Compare" : "＋ Compare"}
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {/* Outbound */}
        <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 10, background: "#f8fafc" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>➡️ Outbound — total {fmtDur(durOutMin)}</div>
          {renderLeg(segmentsOut)}
        </div>

        {/* Return */}
        {pkg.roundTrip && segmentsIn?.length > 0 && (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 10, background: "#f8fafc" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>↩️ Return — total {fmtDur(durRetMin)}</div>
            {renderLeg(segmentsIn)}
          </div>
        )}

        {/* Hotel summary (if included) */}
        {showHotel && (pkg?.hotel || pkg?.hotel_total) && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>🏨 Hotel</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div>Min stars: {pkg?.minHotelStar ?? "—"}</div>
              {typeof pkg?.hotel_total === "number" && <div>Hotel est: {fmtPrice.format(Math.round(pkg.hotel_total))}</div>}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .book-link {
          display:inline-block; padding: 6px 10px; border-radius: 10px; border: 1px solid #e2e8f0;
          text-decoration: none; font-weight: 800; background: #fff;
        }
        .result-card--compared { outline: 2px solid #0ea5e9; }
        .leg { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:8px 10px; margin:4px 0; }
        .leg-route { font-weight: 800; }
        .leg-meta { color:#334155; font-weight: 600; font-size: 13px; }
        .layover { background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:10px; margin:6px 0; }
        .layover-title { font-weight: 900; color:#9a3412; }
        .layover-meta { font-weight: 700; color:#7c2d12; }
      `}</style>
    </section>
  );
}