"use client";
import React, { useMemo } from "react";

/** Known airline homepages for a clean “Airline” button. */
const AIRLINE_SITE: Record<string, string> = {
  "American Airlines": "https://www.aa.com",
  American: "https://www.aa.com",
  "Delta Air Lines": "https://www.delta.com",
  Delta: "https://www.delta.com",
  "United Airlines": "https://www.united.com",
  United: "https://www.united.com",
  "Alaska Airlines": "https://www.alaskaair.com",
  Alaska: "https://www.alaskaair.com",
  Southwest: "https://www.southwest.com",
  JetBlue: "https://www.jetblue.com",
  Lufthansa: "https://www.lufthansa.com",
  Emirates: "https://www.emirates.com",
  Qatar: "https://www.qatarairways.com",
  "British Airways": "https://www.britishairways.com",
  "Air France": "https://wwws.airfrance.us",
  KLM: "https://www.klm.com",
};

const money = (n: number, ccy: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy || "USD",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
};
const ensureHttps = (u?: string) =>
  !u ? "" : u.startsWith("http") ? u : `https://${u.replace(/^\/\//, "")}`;
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
};

/* --------- Small time helpers --------- */
const fmtTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
};
const mins = (a?: string, b?: string) =>
  a && b ? Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 60000)) : 0;
const fmtDur = (m: number) => (m <= 0 ? "" : `${Math.floor(m / 60)}h ${m % 60}m`);

type Props = {
  pkg: any;
  index?: number;
  currency?: string;
  pax?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void;

  /** Hotel display controls + date context (so we can prefill links) */
  showHotel?: boolean;
  showAllHotels?: boolean;
  hotelNights?: number;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
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
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  // Try both shapes you’ve used
  const outSegs: any[] = pkg?.flight?.segments_out || pkg?.flight?.segments || [];
  const inSegs: any[] = pkg?.flight?.segments_in || pkg?.flight?.segments_return || [];

  const carriers = Array.from(
    new Set(
      [
        ...(outSegs || []).map((s: any) => s?.carrier_name || s?.carrier),
        ...(inSegs || []).map((s: any) => s?.carrier_name || s?.carrier),
        pkg.flight?.carrier_name || pkg.flight?.carrier,
      ].filter(Boolean)
    )
  );
  const airline = carriers[0];

  const out0 = outSegs?.[0];
  const in0 = inSegs?.[0];
  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = fmtDate(out0?.depart_time || pkg.departDate);
  const dateRet = fmtDate(in0?.depart_time || pkg.returnDate);

  const price =
    pkg.total_cost_converted ??
    pkg.total_cost ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    pkg.flight_total ??
    0;

  // --- Prefilled booking links for flights ---
  const gf = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${pax || 1} travelers`
  )}`;
  const ssOut = (dateOut || "").replace(/-/g, "");
  const ssRet = (dateRet || "").replace(/-/g, "");
  const sky =
    from && to && ssOut
      ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${dateRet ? `${ssRet}/` : ""}`
      : "https://www.skyscanner.com/";
  const airlineUrl =
    AIRLINE_SITE[airline || ""] ||
    (airline
      ? `https://www.google.com/search?q=${encodeURIComponent(`${airline} ${from} ${to} ${dateOut}`)}`
      : `https://www.google.com/search?q=${encodeURIComponent(`airline booking ${from} ${to} ${dateOut}`)}`);

  // --- Save button state ---
  const saved = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem("triptrio:saved") || "[]") as string[]).includes(id);
    } catch {
      return false;
    }
  }, [id]);

  function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const key = "triptrio:saved";
      const arr = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      localStorage.setItem(key, JSON.stringify(next));
      onSavedChangeGlobal?.(next.length);
    } catch {}
  }

  // ----- Hotels (price detection & links) -----
  const hotels: any[] = Array.isArray(pkg.hotels) && pkg.hotels.length ? pkg.hotels : pkg.hotel ? [pkg.hotel] : [];

  const readNightly = (h: any): number | undefined => {
    const n =
      h?.price_per_night ??
      h?.nightly ??
      h?.rate ??
      h?.nightly_price ??
      h?.night_price ??
      h?.priceNight ??
      h?.price_night ??
      h?.pricePerNight ??
      h?.amountNight ??
      h?.amount_night;
    const v = Number(n);
    return Number.isFinite(v) ? v : undefined;
  };

  const readTotal = (h: any): number | undefined => {
    const t =
      h?.price_total ??
      h?.priceTotal ??
      h?.total ??
      h?.total_price ??
      h?.amount ??
      h?.price ??
      h?.cost;
    const v = Number(t);
    return Number.isFinite(v) ? v : undefined;
  };

  const photo = (h: any, i: number) => {
    const src =
      ensureHttps(h?.image) ||
      ensureHttps(h?.photoUrl) ||
      ensureHttps(h?.thumbnail) ||
      ensureHttps(h?.images?.[0]) ||
      "";
    if (src) return src;
    const seed = hash((h?.name || "hotel") + "|" + i);
    return `https://picsum.photos/seed/${seed}/400/240`;
  };

  const hotelLinks = (h: any) => {
    const city = h?.city || pkg?.destination || "";
    const q = h?.name ? `${h.name}, ${city}` : city;

    const booking = new URL("https://www.booking.com/searchresults.html");
    if (q) booking.searchParams.set("ss", q);
    if (hotelCheckIn) booking.searchParams.set("checkin", hotelCheckIn);
    if (hotelCheckOut) booking.searchParams.set("checkout", hotelCheckOut);

    const exp = new URL("https://www.expedia.com/Hotel-Search");
    if (q) exp.searchParams.set("destination", q);
    if (hotelCheckIn) exp.searchParams.set("startDate", hotelCheckIn);
    if (hotelCheckOut) exp.searchParams.set("endDate", hotelCheckOut);

    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    if (q) hcx.searchParams.set("destination", q);
    if (hotelCheckIn) hcx.searchParams.set("checkIn", hotelCheckIn);
    if (hotelCheckOut) hcx.searchParams.set("checkOut", hotelCheckOut);

    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "hotels")}`;
    return { booking: booking.toString(), exp: exp.toString(), hcx: hcx.toString(), maps };
  };

  const computePrices = (h: any) => {
    const nightly = readNightly(h);
    const total = readTotal(h);

    if (nightly != null && total == null && hotelNights && hotelNights > 0) {
      return { nightly, total: nightly * hotelNights };
    }
    if (total != null && nightly == null && hotelNights && hotelNights > 0) {
      return { nightly: total / hotelNights, total };
    }
    return { nightly, total };
  };

  /* ------- Flight leg renderer (row + layovers) ------- */
  const LegRows: React.FC<{ segs: any[] }> = ({ segs }) => {
    if (!segs?.length) return null;
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const carrier = s?.carrier_name || s?.carrier || airline || "—";
      const dep = s?.depart_time;
      const arr = s?.arrive_time;
      const dur = fmtDur(mins(dep, arr));
      rows.push(
        <div key={`seg-${i}`} className="leg-row">
          <div className="leg-left">
            <div className="leg-route">
              <div className="leg-airline">{carrier}</div>
              <div className="leg-cities">
                {s?.from?.toUpperCase()} <span className="arrow">→</span> {s?.to?.toUpperCase()}
              </div>
            </div>
            <div className="leg-times">
              {fmtTime(dep)} — {fmtTime(arr)}
            </div>
          </div>
          <div className="leg-right">{dur}</div>
        </div>
      );
      // layover (between this arrival and next departure)
      const next = segs[i + 1];
      if (next) {
        const lay = mins(arr, next?.depart_time);
        rows.push(
          <div key={`lay-${i}`} className="layover">
            <span className="dot">⏱</span>
            <span>Layover in</span>
            <strong>{` ${next?.from?.toUpperCase()} `}</strong>
            <span>• Next departs at</span>
            <strong>{` ${fmtTime(next?.depart_time)} `}</strong>
            <span className="lo-dur">({fmtDur(lay)})</span>
          </div>
        );
      }
    }
    return <>{rows}</>;
  };

  return (
    <section onClick={() => onToggleCompare?.(id)} className={`card ${compared ? "card--on" : ""}`}>
      <header className="hdr">
        <div className="route">
          <div className="title">Option {index + 1} • {from} — {to}</div>
          <div className="sub">
            {dateOut && <>Outbound {dateOut}</>} {dateRet && <>• Return {dateRet}</>} {airline && <>• {airline}</>}
          </div>
        </div>
        <div className="actions">
          <div className="price">💵 {money(Number(price) || 0, currency)}</div>
          <a className="btn" href={gf} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="btn" href={sky} target="_blank" rel="noreferrer">Skyscanner</a>
          <a className="btn" href={airlineUrl} target="_blank" rel="noreferrer">{airline ? "Airline" : "Airlines"}</a>
          <button className="btn btn--ghost" onClick={toggleSave}>{saved ? "💾 Saved" : "＋ Save"}</button>
          <button
            className={`btn ${compared ? "btn--on" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleCompare?.(id); }}
          >
            {compared ? "🆚 In Compare" : "➕ Compare"}
          </button>
        </div>
      </header>

      {/* Outbound */}
      {outSegs?.length > 0 && (
        <div className="leg">
          <div className="leg-title">Outbound</div>
          <LegRows segs={outSegs} />
        </div>
      )}

      {/* Return */}
      {inSegs?.length > 0 && (
        <div className="leg">
          <div className="leg-title">Return</div>
          <LegRows segs={inSegs} />
        </div>
      )}

      {/* Hotels */}
      {showHotel && hotels.length > 0 && (
        <div className="hotels">
          <div className="hotels__title">Hotels (top options)</div>
          {(showAllHotels ? hotels : hotels.slice(0, 12)).map((h, i) => {
            const { booking, exp, hcx, maps } = hotelLinks(h);
            const { nightly, total } = computePrices(h);

            return (
              <div key={i} className="hotel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={booking} target="_blank" rel="noreferrer" className="hotel__img">
                  <img src={photo(h, i)} alt={h?.name || "Hotel"} />
                </a>
                <div className="hotel__body">
                  <div className="hotel__head">
                    <a href={booking} target="_blank" rel="noreferrer" className="hotel__name">
                      {h?.name || "Hotel"}
                    </a>
                    <div className="hotel__price">
                      {nightly != null && (
                        <span>
                          {money(nightly, currency)} <span className="muted">/ night</span>
                        </span>
                      )}
                      {total != null && (
                        <span className="muted"> • {money(total, currency)} total</span>
                      )}
                    </div>
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

      <style jsx>{`
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          background: linear-gradient(180deg, #ffffff, #f6fbff);
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.06);
        }
        .card--on { border: 2px solid #0ea5e9; }
        .hdr { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .route .title { font-weight: 900; color: #0f172a; }
        .route .sub { color: #334155; font-weight: 600; }
        .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .price {
          font-weight: 900; color: #0b3b52;
          background: #e7f5ff; border: 1px solid #cfe3ff; border-radius: 10px; padding: 6px 10px;
        }
        .btn { padding: 6px 10px; border-radius: 10px; border: 1px solid #94a3b8; background: #fff; font-weight: 800; color: #0f172a; text-decoration: none; cursor: pointer; }
        .btn--ghost { background: #f8fafc; }
        .btn--on { border: 2px solid #0ea5e9; background: #e0f2fe; }

        .leg { margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .leg-title { font-weight: 900; color: #0b3b52; margin-bottom: 6px; }
        .leg-row {
          display: grid; grid-template-columns: 1fr auto; align-items: center;
          padding: 8px 10px; border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0; margin-bottom: 8px;
        }
        .leg-left { display: grid; gap: 4px; }
        .leg-route { display: flex; gap: 10px; align-items: baseline; }
        .leg-airline { font-weight: 900; color: #0f172a; }
        .leg-cities { font-weight: 800; color: #0f172a; }
        .arrow { opacity: .65; margin: 0 4px; }
        .leg-times { color: #334155; font-weight: 700; }
        .leg-right { font-weight: 900; color: #0f172a; }

        .layover {
          display: inline-flex; align-items: center; gap: 6px;
          border: 1px dashed #cbd5e1; border-radius: 12px; padding: 6px 10px; font-size: 12px;
          background: linear-gradient(135deg, rgba(2,132,199,0.08), rgba(2,132,199,0.02));
          margin: 6px 0 10px 0;
        }
        .dot { opacity: .8; }
        .lo-dur { opacity: .8; margin-left: 4px; }

        .hotels { display: grid; gap: 12px; margin-top: 12px; }
        .hotels__title { font-weight: 800; color: #0f172a; }
        .hotel {
          display: grid; grid-template-columns: 160px 1fr; gap: 12px;
          border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #fff;
        }
        .hotel__img { border-radius: 10px; overflow: hidden; display: block; background: #f1f5f9; }
        .hotel__img img { width: 160px; height: 100px; object-fit: cover; display: block; }
        .hotel__body { display: grid; gap: 6px; }
        .hotel__head { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
        .hotel__name { font-weight: 800; color: #0f172a; text-decoration: none; }
        .hotel__price { font-weight: 800; color: #0369a1; }
        .muted { opacity: 0.7; font-weight: 700; }
        .hotel__links { display: flex; gap: 8px; flex-wrap: wrap; }
      `}</style>
    </section>
  );
}
