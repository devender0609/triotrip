"use client";
import React from "react";

const AIRLINE_SITE: Record<string, string> = {
  American: "https://www.aa.com", "American Airlines": "https://www.aa.com",
  Delta: "https://www.delta.com", "Delta Air Lines": "https://www.delta.com",
  United: "https://www.united.com", "United Airlines": "https://www.united.com",
  Alaska: "https://www.alaskaair.com", "Alaska Airlines": "https://www.alaskaair.com",
  Southwest: "https://www.southwest.com", JetBlue: "https://www.jetblue.com",
  Lufthansa: "https://www.lufthansa.com", Qatar: "https://www.qatarairways.com",
  Emirates: "https://www.emirates.com", "Air France": "https://wwws.airfrance.us",
  KLM: "https://www.klm.com", ANA: "https://www.ana.co.jp", JAL: "https://www.jal.co.jp",
  "British Airways":"https://www.britishairways.com",
};

const TRIOTRIP_BASE = process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "https://triotrip.vercel.app";
const TRIOTRIP_BOOK_PATH = process.env.NEXT_PUBLIC_TRIOTRIP_BOOK_PATH || "/book/checkout";

const fmtMoney = (v?: number, c = "USD") => {
  if (v == null || !Number.isFinite(v)) return "—";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(v); }
  catch { return `${c} ${v.toFixed(0)}`; }
};

function ensureHttps(u?: string | null) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = s.replace(/^http:\/\//i, "https://");
  return s;
}
const hash = (s: string) => { let h = 0; for (let i=0;i<s.length;i++){ h=(h<<5)-h+s.charCodeAt(i); h|=0; } return Math.abs(h); };
const fmtTime = (t?: string) => !t ? "" : new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDur  = (min?: number) => min==null ? "" : (Math.floor(min/60) ? `${Math.floor(min/60)}h ${min%60}m` : `${min%60}m`);

type Props = {
  pkg: any; index?: number; currency?: string; pax?: number;
  comparedIds?: string[]; onToggleCompare?: (id: string) => void;
  large?: boolean; showHotel?: boolean;
};

export default function ResultCard({
  pkg, index = 0, currency = "USD", pax = 1,
  comparedIds, onToggleCompare, large = true, showHotel,
}: Props) {
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  const outSegs: any[] = Array.isArray(pkg?.flight?.segments)
    ? pkg.flight.segments : (pkg.flight?.segments_out || []);
  const inSegs: any[] = Array.isArray(pkg?.returnFlight?.segments)
    ? pkg.returnFlight.segments : (pkg.flight?.segments_in || []);

  const out0 = outSegs?.[0];
  const in0  = inSegs?.[0];

  const from    = (out0?.from || pkg.origin || "").toUpperCase();
  const to      = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (in0?.depart_time || "").slice(0, 10);
  const route   = `${from}-${to}`;
  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || pkg.airline || "";

  const price =
    pkg.total_cost ?? pkg.flight_total ??
    pkg.flight?.price_usd_converted ?? pkg.flight?.price_usd ?? null;

  const trioTrip =
    `${TRIOTRIP_BASE}${TRIOTRIP_BOOK_PATH}` +
    `?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}` +
    `&depart=${encodeURIComponent(dateOut)}` +
    (dateRet ? `&return=${encodeURIComponent(dateRet)}` : "") +
    `&adults=${pkg.passengersAdults ?? pkg.adults ?? 1}` +
    `&children=${pkg.passengersChildren ?? pkg.children ?? 0}` +
    `&infants=${pkg.passengersInfants ?? pkg.infants ?? 0}`;

  const airlineSite =
    AIRLINE_SITE[airline] ||
    (airline ? `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}` : "");

  function hotelPrimaryLink(h: any, cityFallback: string) {
    const official = ensureHttps(h?.website || h?.officialUrl || h?.url);
    if (official) return official;
    const city = h?.city || cityFallback || pkg?.destination || "";
    const q = h?.name ? `${h.name}, ${city}` : city;

    const b = new URL("https://www.booking.com/searchresults.html");
    if (q) b.searchParams.set("ss", q);
    if (pkg?.hotelCheckIn)  b.searchParams.set("checkin",  pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) b.searchParams.set("checkout", pkg.hotelCheckOut);
    b.searchParams.set("group_adults", String((pkg.passengersAdults ?? 1) || 1));
    if ((pkg.passengersChildren ?? 0) > 0) b.searchParams.set("group_children", String(pkg.passengersChildren));
    b.searchParams.set("no_rooms", "1");
    b.searchParams.set("selected_currency", currency || "USD");
    return b.toString();
  }
  function hotelAltLinks(h: any, cityFallback: string) {
    const city = h?.city || cityFallback || pkg?.destination || "";
    const destName = h?.name ? `${h.name}, ${city}` : city;

    const exp = new URL("https://www.expedia.com/Hotel-Search");
    if (destName) exp.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn)  exp.searchParams.set("startDate", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) exp.searchParams.set("endDate",   pkg.hotelCheckOut);
    exp.searchParams.set("adults", String((pkg.passengersAdults ?? 1) || 1));
    if ((pkg.passengersChildren ?? 0) > 0) exp.searchParams.set("children", String(pkg.passengersChildren));

    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hcx.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn)  hcx.searchParams.set("checkIn",  pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) hcx.searchParams.set("checkOut", pkg.hotelCheckOut);
    hcx.searchParams.set("adults", String((pkg.passengersAdults ?? 1) || 1));
    if ((pkg.passengersChildren ?? 0) > 0) hcx.searchParams.set("children", String(pkg.passengersChildren));

    const maps = new URL("https://www.google.com/maps/search/");
    maps.searchParams.set("api", "1");
    maps.searchParams.set("query", destName || "hotels");

    return { expedia: exp.toString(), hotels: hcx.toString(), maps: maps.toString() };
  }

  const hotelImg = (h: any, i?: number) => {
    const candidate =
      ensureHttps(h?.image) || ensureHttps(h?.photo) || ensureHttps(h?.photoUrl) ||
      ensureHttps(h?.image_url) || ensureHttps(h?.imageUrl) || ensureHttps(h?.thumbnail) ||
      ensureHttps(h?.thumbnailUrl) || ensureHttps(h?.img) ||
      ensureHttps(h?.leadPhoto?.image?.url) ||
      ensureHttps(h?.media?.images?.[0]?.url) ||
      ensureHttps(h?.gallery?.[0]) ||
      (h?.images && Array.isArray(h.images) ? ensureHttps(h.images[0]?.url || h.images[0]) : "") ||
      (h?.optimizedThumbUrls && ensureHttps(h.optimizedThumbUrls.srpDesktop || h.optimizedThumbUrls.srpMobile)) ||
      "";
    if (candidate) return candidate;

    const city =
      h?.city || h?.location?.city || h?.address?.city || h?.cityName ||
      pkg?.destination || pkg?.to || pkg?.arrivalCity || "";

    const seed = hash(`${h?.id || ""}|${h?.name || ""}|${city}|${i ?? 0}`) % 1_000_000;
    return `https://source.unsplash.com/collection/483251/400x250/?sig=${seed}`;
  };

  return (
    <section
      className={`result-card ${compared ? "result-card--compared" : ""}`}
      onClick={() => onToggleCompare?.(id)}
    >
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ fontWeight: 900 }}>
          Option {index + 1} • {route} {dateOut ? `• ${dateOut}` : ""} {pkg.roundTrip && dateRet ? `↩ ${dateRet}` : ""}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ fontWeight:900 }}>{fmtMoney(price ?? undefined, currency)}</div>
          <a className="book-link" href={trioTrip} target="_blank" rel="noreferrer">TrioTrip</a>
          {airline && <a className="book-link" href={AIRLINE_SITE[airline] || "#"} target="_blank" rel="noreferrer">{airline}</a>}
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCompare(id); }}
              aria-pressed={compared}
              className="segbtn"
              style={{ borderColor: compared ? "#0ea5e9" : undefined, background: compared ? "#e0f2fe" : undefined }}
            >
              {compared ? "🆚 In Compare" : "➕ Compare"}
            </button>
          )}
        </div>
      </header>

      {/* Outbound */}
      {outSegs.length > 0 && (
        <div style={{ border:"1px solid #cfe3ff", borderRadius:12, padding:10, display:"grid", gap:8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
          <div style={{ fontWeight: 800, color:"#0b3b52" }}>Outbound</div>
          {outSegs.map((s: any, i: number) => (
            <React.Fragment key={`o${i}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.from} → {s.to}</div>
                  <div className="small">{fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtDur(s.duration_minutes)}</div>
              </div>
              {i < outSegs.length - 1 && (
                <div className="center small">
                  ⏱️ Layover in {s.to} • Departs {fmtTime(outSegs[i + 1].depart_time)}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Return */}
      {inSegs.length > 0 && (
        <div style={{ border:"1px solid #cfe3ff", borderRadius:12, padding:10, display:"grid", gap:8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
          <div style={{ fontWeight: 800, color:"#0b3b52" }}>Return</div>
          {inSegs.map((s: any, i: number) => (
            <React.Fragment key={`i${i}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.from} → {s.to}</div>
                  <div className="small">{fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtDur(s.duration_minutes)}</div>
              </div>
              {i < inSegs.length - 1 && (
                <div className="center small">
                  ⏱️ Layover in {s.to} • Departs {fmtTime(inSegs[i + 1].depart_time)}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Hotels */}
      {showHotel && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Hotels (top options)</div>
          {(Array.isArray(pkg.hotels) && pkg.hotels.length ? pkg.hotels : (pkg.hotel && !pkg.hotel.filteredOutByStar ? [pkg.hotel] : []))
            .slice(0, 3)
            .map((h: any, i: number) => {
              const city = h?.city || pkg?.destination || "";
              const primary = hotelPrimaryLink(h, city);
              const alt = hotelAltLinks(h, city);
              const img = hotelImg(h, i);

              return (
                <div key={`h${i}`} style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:12, border:"1px solid #e2e8f0", borderRadius:12, padding:10, background:"#fff" }}>
                  <a href={primary} target="_blank" rel="noreferrer" style={{ borderRadius:10, overflow:"hidden", background:"#f1f5f9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={h?.name || "Hotel"}
                      loading="lazy"
                      width={160}
                      height={100}
                      style={{ width: 160, height: 100, objectFit: "cover" }}
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.onerror = null;
                        const seed = hash(`${h?.name || ""}|${city}|${i}`) % 1_000_000;
                        t.src = `https://picsum.photos/seed/${seed}/400/250`;
                      }}
                    />
                  </a>
                  <div style={{ display:"grid", gap:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                      <a href={primary} target="_blank" rel="noreferrer" style={{ fontWeight:900 }}>
                        {h?.name || "Hotel"}
                      </a>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <a className="book-link book-link--booking" href={primary} target="_blank" rel="noreferrer">
                          {primary.includes("booking.com") ? "Booking.com" : "Hotel site"}
                        </a>
                        <a className="book-link book-link--expedia" href={alt.expedia} target="_blank" rel="noreferrer">Expedia</a>
                        <a className="book-link book-link--hotels" href={alt.hotels} target="_blank" rel="noreferrer">Hotels</a>
                        <a className="book-link book-link--maps" href={alt.maps} target="_blank" rel="noreferrer">Map</a>
                      </div>
                    </div>
                    <div className="small">{h?.address || h?.city || city}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
