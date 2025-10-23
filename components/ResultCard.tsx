"use client";
import React from "react";

/* Airline sites */
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

const TRIOTRIP_BASE = process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "";
const TRIOTRIP_BOOK_PATH = process.env.NEXT_PUBLIC_TRIOTRIP_BOOK_PATH || "/checkout";

/* helpers */
function ensureHttps(u?: string | null) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = s.replace(/^http:\/\//i, "https://");
  return s;
}
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
const uniq = (a: any[]) => Array.from(new Set(a.filter(Boolean)));

function fmtTime(t?: string) { if (!t) return ""; return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtDur(min?: number) { if (min == null) return ""; const h = Math.floor(min / 60), m = Math.max(0, min % 60); return h ? `${h}h ${m}m` : `${m}m`; }

type Props = {
  pkg: any; index?: number; currency?: string; pax?: number;
  comparedIds?: string[]; onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void; large?: boolean; showHotel?: boolean;
  showAllHotels?: boolean; hotelNights?: number;
};

export default function ResultCard({
  pkg, index = 0, currency = "USD", pax = 1,
  comparedIds, onToggleCompare, onSavedChangeGlobal,
  large = true, showHotel, showAllHotels = false, hotelNights = 0,
}: Props) {
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  /* pax */
  const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
  const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
  const infants  = Number(pkg.passengersInfants  ?? pkg.infants  ?? 0) || 0;
  const totalPax = Math.max(1, adults + children + infants);

  /* flights */
  const outSegs: any[] = Array.isArray(pkg?.flight?.segments)
    ? pkg.flight.segments
    : (pkg.flight?.segments_out || []);
  const inSegs: any[] = Array.isArray(pkg?.returnFlight?.segments)
    ? pkg.returnFlight.segments
    : (pkg.flight?.segments_in || pkg.flight?.segments_return || []);

  const carriers = uniq([
    ...(outSegs || []).map((s: any) => s?.carrier_name || s?.carrier || s?.airline),
    ...(inSegs || []).map((s: any) => s?.carrier_name || s?.carrier || s?.airline),
    pkg.flight?.carrier_name || pkg.flight?.carrier || pkg.airline,
  ]);

  const out0 = outSegs?.[0];
  const in0  = inSegs?.[0];

  const from    = (out0?.from || pkg.origin || "").toUpperCase();
  const to      = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = (out0?.depart_time || pkg.departDate || "").slice(0, 10);
  const dateRet = (in0?.depart_time  || pkg.returnDate || "").slice(0, 10);
  const route   = `${from}-${to}`;

  const airlineMain = carriers[0] || "";

  const priceRaw =
    (typeof pkg?.total_cost_converted === "number" && pkg.total_cost_converted) ||
    (typeof pkg?.total_cost === "number" && pkg.total_cost) ||
    (typeof pkg?.flight?.price_usd_converted === "number" && pkg.flight.price_usd_converted) ||
    (typeof pkg?.flight?.price_usd === "number" && pkg.flight.price_usd) ||
    (typeof pkg?.flight_total === "number" && pkg.flight_total) || 0;

  let priceFmt = "";
  try { priceFmt = new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "USD").toUpperCase() }).format(Math.round(Number(priceRaw) || 0)); }
  catch { priceFmt = `$${Math.round(Number(priceRaw) || 0).toLocaleString()}`; }

  /* Internal checkout (same tab) */
  const trioTrip = `${TRIOTRIP_BASE}${TRIOTRIP_BOOK_PATH}` +
    `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` +
    (dateOut ? `&depart=${encodeURIComponent(dateOut)}` : "") +
    (dateRet ? `&return=${encodeURIComponent(dateRet)}` : "") +
    `&adults=${adults}&children=${children}&infants=${infants}`;

  /* Flight links */
  const airlineSite = AIRLINE_SITE[airlineMain] ||
    (airlineMain ? `https://www.google.com/search?q=${encodeURIComponent(airlineMain + " booking")}` : "");

  const googleFlights =
    `https://www.google.com/travel/flights?q=${encodeURIComponent(`${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${totalPax} travelers`)}`;

  const ssOut = (dateOut || "").replace(/-/g, "");
  const ssRet = (dateRet || "").replace(/-/g, "");
  const skyScanner = (from && to && ssOut)
    ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${dateRet ? `${ssRet}/` : ""}?adults=${adults}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
    : "https://www.skyscanner.com/";

  const wrapStyle: React.CSSProperties = {
    display: "grid", gap: 12, border: compared ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
    borderRadius: 14, padding: 12, background: "linear-gradient(180deg,#ffffff,#f6fbff)",
    boxShadow: "0 8px 20px rgba(2,6,23,.06)", cursor: onToggleCompare ? "pointer" : "default",
  };

  /* hotel links */
  function hotelPrimaryLink(h: any, cityFallback: string) {
    const official = ensureHttps(h?.website || h?.officialUrl || h?.url); if (official) return official;
    const city = h?.city || cityFallback || pkg?.destination || "";
    const q = h?.name ? `${h.name}, ${city}` : city;
    const b = new URL("https://www.booking.com/searchresults.html");
    if (q) b.searchParams.set("ss", q);
    if (pkg?.hotelCheckIn)  b.searchParams.set("checkin",  pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) b.searchParams.set("checkout", pkg.hotelCheckOut);
    b.searchParams.set("group_adults", String(adults || 1));
    if (children > 0) b.searchParams.set("group_children", String(children));
    b.searchParams.set("no_rooms", "1");
    b.searchParams.set("selected_currency", pkg.currency || currency || "USD");
    return b.toString();
  }
  function hotelAltLinks(h: any, cityFallback: string) {
    const city = h?.city || cityFallback || pkg?.destination || "";
    const destName = h?.name ? `${h.name}, ${city}` : city;
    const exp = new URL("https://www.expedia.com/Hotel-Search");
    if (destName) exp.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn)  exp.searchParams.set("startDate", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) exp.searchParams.set("endDate",   pkg.hotelCheckOut);
    exp.searchParams.set("adults", String(adults || 1));
    if (children > 0) exp.searchParams.set("children", String(children));
    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hcx.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn)  hcx.searchParams.set("checkIn",  pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) hcx.searchParams.set("checkOut", pkg.hotelCheckOut);
    hcx.searchParams.set("adults", String(adults || 1));
    if (children > 0) hcx.searchParams.set("children", String(children));
    const maps = new URL("https://www.google.com/maps/search/"); maps.searchParams.set("api","1"); maps.searchParams.set("query", destName || "hotels");
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
      (h?.optimizedThumbUrls && ensureHttps(h.optimizedThumbUrls.srpDesktop || h.optimizedThumbUrls.srpMobile)) || "";
    if (candidate) return candidate;
    const city = h?.city || h?.address?.city || pkg?.destination || "";
    const seed = hash(`${h?.id || ""}|${h?.name || ""}|${city}|${i ?? ""}`) % 1_000_000;
    return `https://picsum.photos/seed/${seed}/400/250`;
  };

  const hotelTotal: number | undefined =
    typeof pkg.hotel_total === "number" ? pkg.hotel_total :
    typeof pkg.hotel?.price_total === "number" ? pkg.hotel.price_total :
    undefined;
  const perNight = showHotel && hotelNights > 0 && typeof hotelTotal === "number"
    ? hotelTotal / hotelNights
    : undefined;

  /* render */
  return (
    <section
      className={`result-card ${compared ? "result-card--compared" : ""}`}
      style={wrapStyle}
      onClick={() => onToggleCompare?.(id)}
    >
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ fontWeight: 800, color:"#0f172a" }}>
          Option {index + 1} • {route} {dateOut ? `• ${dateOut}` : ""} {pkg.roundTrip && dateRet ? `↩ ${dateRet}` : ""}
          {carriers.length ? <div style={{ fontWeight:700, color:"#0b3b52" }}>{carriers.join(", ")}</div> : null}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ fontWeight:900, color:"#0b3b52", background:"#e7f5ff", border:"1px solid #cfe3ff", borderRadius:10, padding:"6px 10px" }}>
            💵 {priceFmt}{perNight!=null ? <span style={{ marginLeft:8, fontWeight:700, color:"#0369a1" }}>(~{new Intl.NumberFormat(undefined,{style:"currency",currency}).format(perNight)} / night)</span> : null}
          </div>
          <a className="book-link" href={trioTrip} rel="noreferrer">TrioTrip</a>
          <a className="book-link" href={googleFlights} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="book-link" href={skyScanner} target="_blank" rel="noreferrer">Skyscanner</a>
          {airlineMain && <a className="book-link" href={airlineSite} target="_blank" rel="noreferrer">{airlineMain}</a>}
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCompare(id); }}
              aria-pressed={compared}
              title={compared ? "Remove from Compare" : "Add to Compare"}
              style={{ border: compared ? "2px solid #0ea5e9" : "1px solid #94a3b8", background: compared ? "#e0f2fe" : "#fff",
                       color:"#0f172a", padding:"6px 10px", borderRadius:10, cursor:"pointer", fontWeight:700 }}
            >
              {compared ? "🆚 In Compare" : "➕ Compare"}
            </button>
          )}
        </div>
      </header>

      {/* Outbound */}
      {outSegs.length > 0 && (
        <div style={{ border:"1px solid #cfe3ff", borderRadius:12, padding:10, display:"grid", gap:8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
          <div style={{ fontWeight:600, color:"#0b3b52" }}>Outbound</div>
          {outSegs.map((s: any, i: number) => (
            <React.Fragment key={`o${i}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600 }}>{s.from} → {s.to}</div>
                  <div style={{ fontSize:12, color:"#475569" }}>{fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)} {s.carrier_name ? `• ${s.carrier_name}` : ""}</div>
                </div>
                <div style={{ fontWeight:600 }}>{fmtDur(s.duration_minutes)}</div>
              </div>
              {i < outSegs.length - 1 && (
                <div style={{ display:"grid", placeItems:"center" }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 10px",
                                border:"1px dashed #94a3b8", background:"#fff", color:"#334155",
                                borderRadius:999, fontSize:12 }}>
                    ⏱️ Layover in <strong style={{ marginLeft:4 }}>{s.to}</strong>
                    <span style={{ opacity:.7 }}>•</span>
                    Next departs at <strong>{fmtTime(outSegs[i + 1].depart_time)}</strong>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Return */}
      {inSegs.length > 0 && (
        <div style={{ border:"1px solid #cfe3ff", borderRadius:12, padding:10, display:"grid", gap:8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
          <div style={{ fontWeight:600, color:"#0b3b52" }}>Return</div>
          {inSegs.map((s: any, i: number) => (
            <React.Fragment key={`i${i}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600 }}>{s.from} → {s.to}</div>
                  <div style={{ fontSize:12, color:"#475569" }}>{fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)} {s.carrier_name ? `• ${s.carrier_name}` : ""}</div>
                </div>
                <div style={{ fontWeight:600 }}>{fmtDur(s.duration_minutes)}</div>
              </div>
              {i < inSegs.length - 1 && (
                <div style={{ display:"grid", placeItems:"center" }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 10px",
                                border:"1px dashed #94a3b8", background:"#fff", color:"#334155",
                                borderRadius:999, fontSize:12 }}>
                    ⏱️ Layover in <strong style={{ marginLeft:4 }}>{s.to}</strong>
                    <span style={{ opacity:.7 }}>•</span>
                    Next departs at <strong>{fmtTime(inSegs[i + 1].depart_time)}</strong>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Hotels */}
      {showHotel && (
        <div style={{ display:"grid", gap:10 }}>
          <div style={{ fontWeight:600, color:"#0f172a" }}>Hotels (top options)</div>
          {(Array.isArray(pkg.hotels) && pkg.hotels.length
              ? pkg.hotels
              : (pkg.hotel && !pkg.hotel.filteredOutByStar ? [pkg.hotel] : []))
            .slice(0, showAllHotels ? undefined : 3)
            .map((h: any, i: number) => {
              const city = h?.city || pkg?.destination || "";
              const primary = hotelPrimaryLink(h, city);
              const alt = hotelAltLinks(h, city);
              const img = hotelImg(h, i);
              return (
                <div key={`h${i}`} style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:12, border:"1px solid #e2e8f0", borderRadius:12, padding:10, background:"#fff" }}>
                  <a href={primary} target="_blank" rel="noreferrer" style={{ borderRadius:10, overflow:"hidden", background:"#f1f5f9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={h?.name || "Hotel"} loading="lazy"
                         onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; const seed = hash(`${h?.name || ""}|${city}|${i}`) % 1_000_000; t.src = `https://picsum.photos/seed/${seed}/400/250`; }}
                         style={{ width:160, height:100, objectFit:"cover", display:"block" }} />
                  </a>
                  <div style={{ display:"grid", gap:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                      <a href={primary} target="_blank" rel="noreferrer" style={{ fontWeight:700, color:"#0f172a", textDecoration:"none" }}>
                        {h?.name || "Hotel"}
                      </a>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <a className="book-link" href={primary} target="_blank" rel="noreferrer">{primary.includes("booking.com") ? "Booking.com" : "Hotel site"}</a>
                        <a className="book-link" href={alt.expedia} target="_blank" rel="noreferrer">Expedia</a>
                        <a className="book-link" href={alt.hotels} target="_blank" rel="noreferrer">Hotels</a>
                        <a className="book-link" href={alt.maps} target="_blank" rel="noreferrer">Map</a>
                      </div>
                    </div>
                    <div style={{ color:"#475569", fontSize:13 }}>{h?.address || h?.city || city}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
