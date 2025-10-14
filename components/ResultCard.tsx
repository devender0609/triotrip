// components/ResultCard.tsx
"use client";
import React from "react";

const AIRLINE_SITE: Record<string, string> = {
  American: "https://www.aa.com","American Airlines":"https://www.aa.com",
  Delta:"https://www.delta.com","Delta Air Lines":"https://www.delta.com",
  United:"https://www.united.com","United Airlines":"https://www.united.com",
  Alaska:"https://www.alaskaair.com","Alaska Airlines":"https://www.alaskaair.com",
  Southwest:"https://www.southwest.com", JetBlue:"https://www.jetblue.com",
  Lufthansa:"https://www.lufthansa.com", Qatar:"https://www.qatarairways.com",
  Emirates:"https://www.emirates.com", "Air France":"https://wwws.airfrance.us",
  KLM:"https://www.klm.com", ANA:"https://www.ana.co.jp", JAL:"https://www.jal.co.jp",
  "British Airways":"https://www.britishairways.com",
};

<<<<<<< HEAD
const TRIOTRIP_BASE =
  process.env.NEXT_PUBLIC_TRIOTRIP_BASE ||
  "https://triotrip.vercel.app";

/* ----------------- small helpers ----------------- */
function ensureHttps(u?: string | null) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = s.replace(/^http:\/\//i, "https://");
  return s;
}
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

/* =================== COMPONENT =================== */
=======
// Always usable default so TrioTrip opens even without a local /book route
const TRIOTRIP_BASE = process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "https://triotrip.ai";

>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')
type Props = {
  pkg: any; index?: number; currency?: string; pax?: number;
  comparedIds?: string[]; onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void; large?: boolean; showHotel?: boolean;
};

function ensureHttps(u?: string | null) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = s.replace(/^http:\/\//i, "https://");
  return s;
}

export default function ResultCard({
  pkg, index = 0, currency, pax = 1,
  comparedIds, onToggleCompare, onSavedChangeGlobal, large = true, showHotel,
}: Props) {
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  // ----- passengers -----
  const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
  const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
  const infants = Number(pkg.passengersInfants ?? pkg.infants ?? 0) || 0;

  // ----- flights -----
  const outSegs = Array.isArray(pkg?.flight?.segments) ? pkg.flight.segments : (pkg.flight?.segments_out || []);
  const inSegs  = Array.isArray(pkg?.returnFlight?.segments) ? pkg.returnFlight.segments : (pkg.flight?.segments_in || []);
  const out0 = outSegs?.[0]; const in0 = inSegs?.[0];

<<<<<<< HEAD
=======
  const fs = large ? 15 : 14;
  const wrapStyle: React.CSSProperties = {
    background: "linear-gradient(180deg,#ffffff,#f3f9ff)",
    border: compared ? "2px solid #0ea5e9" : "1px solid #dfe6f5",
    borderRadius: 16, padding: 14, display: "grid", gap: 12, fontSize: fs,
    boxShadow: compared ? "0 0 0 4px rgba(14,165,233,.15) inset" : "0 8px 20px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  const out0 = outSegs?.[0]; const ret0 = inSegs?.[0];
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')
  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (in0?.depart_time || "").slice(0, 10);
  const route = `${from}-${to}`;

<<<<<<< HEAD
  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || pkg.airline || "";

=======
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')
  const trioTrip = `${TRIOTRIP_BASE}/book?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&depart=${encodeURIComponent(dateOut)}${dateRet ? `&return=${encodeURIComponent(dateRet)}` : ""}&adults=${adults}&children=${children}&infants=${infants}`;

  const airlineSite =
    AIRLINE_SITE[airline] || (airline ? `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}` : "");

  const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(`${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${Math.max(1, adults + children + infants)} travelers`)}`;
  const ssOut = (dateOut || "").replace(/-/g, ""); const ssRet = (dateRet || "").replace(/-/g, "");
  const skyScanner = (from && to && ssOut)
    ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${dateRet ? `${ssRet}/` : ""}?adults=${adults}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
    : "https://www.skyscanner.com/";

<<<<<<< HEAD
  // ----- styles -----
  const wrapStyle: React.CSSProperties = {
    display: "grid",
    gap: 12,
    border: compared ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "linear-gradient(180deg,#ffffff,#f6fbff)",
    boxShadow: "0 8px 20px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };
=======
  function hotelLinks(h: any, cityFallback: string) {
    const city = h.city || cityFallback || "";
    const destName = h.name ? `${h.name}, ${city}` : (city || pkg.destination || "");
    const ci = pkg.hotelCheckIn || ""; const co = pkg.hotelCheckOut || "";
    const adultsCount = adults; const childrenCount = children;
    const childAges = Array.isArray(pkg.passengersChildrenAges) ? pkg.passengersChildrenAges : [];
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')

  /* =================== HOTEL HELPERS =================== */
  // Build best available link: official site if present, else Booking scoped to hotel+city.
  function hotelPrimaryLink(h: any, cityFallback: string) {
    const official = ensureHttps(h?.website || h?.officialUrl || h?.url);
    if (official) return official;
    const city = h?.city || cityFallback || pkg?.destination || "";
    const q = h?.name ? `${h.name}, ${city}` : city;
    const b = new URL("https://www.booking.com/searchresults.html");
    if (q) b.searchParams.set("ss", q);
    if (pkg?.hotelCheckIn) b.searchParams.set("checkin", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) b.searchParams.set("checkout", pkg.hotelCheckOut);
    b.searchParams.set("group_adults", String(adults || 1));
    if (children > 0) b.searchParams.set("group_children", String(children));
    b.searchParams.set("no_rooms", "1");
    b.searchParams.set("selected_currency", pkg.currency || "USD");
    return b.toString();
  }
  function hotelAltLinks(h: any, cityFallback: string) {
    const city = h?.city || cityFallback || pkg?.destination || "";
    const destName = h?.name ? `${h.name}, ${city}` : city;

    const exp = new URL("https://www.expedia.com/Hotel-Search");
    if (destName) exp.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn) exp.searchParams.set("startDate", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) exp.searchParams.set("endDate", pkg.hotelCheckOut);
    exp.searchParams.set("adults", String(adults || 1));
    if (children > 0) exp.searchParams.set("children", String(children));

    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hcx.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn) hcx.searchParams.set("checkIn", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) hcx.searchParams.set("checkOut", pkg.hotelCheckOut);
    hcx.searchParams.set("adults", String(adults || 1));
    if (children > 0) hcx.searchParams.set("children", String(children));

<<<<<<< HEAD
    const maps = new URL("https://www.google.com/maps/search/");
    maps.searchParams.set("api", "1");
    maps.searchParams.set("query", destName || "hotels");
=======
    const official = ensureHttps(h.website || h.officialUrl || h.url || "");
    const maps = (typeof h.lat === "number" && typeof h.lng === "number")
      ? `https://www.google.com/maps/@?api=1&map_action=map&center=${h.lat},${h.lng}&zoom=16`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name ? `${h.name}, ${city}` : city)}`;
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')

    return { expedia: exp.toString(), hotels: hcx.toString(), maps: maps.toString() };
  }

  // Unique, deterministic, city-based fallback image (no flicker)
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

<<<<<<< HEAD
    const city =
      h?.city || h?.location?.city || h?.address?.city || h?.cityName || pkg?.destination || pkg?.to || pkg?.arrivalCity || "";

    // Build a unique, stable seed per hotel (differs per hotel, but won't flicker)
    const seedParts = [
      h?.id || "",
      h?.name || "",
      city || "",
      (h?.address?.line1 || h?.address || ""),
      (typeof h?.lat === "number" && typeof h?.lng === "number") ? `${h.lat},${h.lng}` : "",
      typeof i === "number" ? `idx:${i}` : "",
    ];
    const lock = hash(seedParts.filter(Boolean).join("|")) % 1000000;

    // loremflickr serves city/topic-relevant images; lock makes it deterministic + unique per hotel
    const topic = city ? `hotel,${city}` : "hotel,travel";
    return `https://loremflickr.com/400/250/${encodeURIComponent(topic)}?lock=${lock}`;
  };

  /* =================== RENDER =================== */
  function formatTime(t?: string) { if (!t) return ""; return new Date(t).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); }
  function formatDur(min?: number) { if (!min && min !== 0) return ""; const h = Math.floor(min/60); const m = min%60; return h?`${h}h ${m}m`:`${m}m`; }

  const currencyLabel = pkg.currency || currency || "USD";

  return (
    <section
      className={`result-card ${compared ? "result-card--compared" : ""}`}
      style={wrapStyle}
      onClick={() => onToggleCompare?.(id)}
    >
      {/* HEADER + quick actions */}
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 8 }}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>
          Option {index + 1} • {route} {dateOut ? `• ${dateOut}` : ""} {pkg.roundTrip && dateRet ? `↩ ${dateRet}` : ""}
=======
  function LayoverRow({ arrive_time, next_depart_time, at }: any) {
    const a = new Date(arrive_time); const b = new Date(next_depart_time);
    the: {
    }
    const mins = Math.max(0, Math.round((+b - +a) / 60000));
    return (
      <div style={{ padding: 6, color: "#0f172a", fontSize: 16, display: "flex", justifyContent: "center" }}>
        ⏳ Layover at <strong style={{ margin: "0 6px", fontWeight: 600 }}>{at}</strong> — {formatDur(mins)}
      </div>
    );
  }

  // Robust hotel image getter + HTTPS normalization + city fallback
  const hotelImg = (h: any) => {
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
      h?.city || pkg?.destination || "";
    return city
      ? `https://source.unsplash.com/featured/400x250/?hotel,${encodeURIComponent(city)}`
      : "https://images.unsplash.com/photo-1551776235-dde6d4829808?auto=format&fit=crop&w=800&q=60";
  };

  return (
    <section className={`result-card ${compared ? "result-card--compared" : ""}`} style={wrapStyle} onClick={() => onToggleCompare?.(id)}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 600, fontSize: 18, color: "#0f172a" }}>
          {airline}
          <span style={{ opacity: 0.7, fontWeight: 500, marginLeft: 8 }}>{route} {dateOut ? `· ${dateOut}` : ""}</span>
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <a className="book-link" href={trioTrip} target="_blank" rel="noreferrer">TrioTrip</a>
          <a className="book-link" href={googleFlights} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="book-link" href={skyScanner} target="_blank" rel="noreferrer">Skyscanner</a>
          {airline && <a className="book-link" href={airlineSite} target="_blank" rel="noreferrer">{airline}</a>}
        </div>
      </header>

<<<<<<< HEAD
      {/* FLIGHT OUTBOUND */}
      {outSegs.length > 0 && (
        <div style={{ border:"1px solid #cfe3ff", borderRadius:12, padding:10, display:"grid", gap:8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
          <div style={{ fontWeight: 600, color: "#0b3b52" }}>Outbound</div>
          {outSegs.map((s: any, i: number) => (
            <React.Fragment key={`o${i}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.from} → {s.to}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{formatTime(s.depart_time)} – {formatTime(s.arrive_time)}</div>
=======
      <div style={{ display: "grid", gap: 8 }}>
        {outSegs.length > 0 && (
          <div style={{ border: "1px solid #cfe3ff", borderRadius: 12, padding: 8, display: "grid", gap: 8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
            <div style={{ fontWeight: 600, color: "#0b3b52" }}>Outbound</div>
            {outSegs.map((s: any, i: number) => (
              <React.Fragment key={`o${i}`}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background:"#fff" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.from} → {s.to}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{formatTime(s.depart_time)} – {formatTime(s.arrive_time)}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatDur(s.duration_minutes)}</div>
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')
                </div>
                <div style={{ fontWeight: 600 }}>{formatDur(s.duration_minutes)}</div>
              </div>
              {i < outSegs.length - 1 && (
                <div style={{ fontSize: 12, color: "#334155" }}>
                  Layover in {s.to} • {formatTime(outSegs[i + 1].depart_time)}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

<<<<<<< HEAD
      {/* FLIGHT RETURN */}
      {inSegs.length > 0 && (
        <div style={{ border:"1px solid #cfe3ff", borderRadius:12, padding:10, display:"grid", gap:8, background:"linear-gradient(180deg,#ffffff,#eef6ff)" }}>
          <div style={{ fontWeight: 600, color: "#0b3b52" }}>Return</div>
          {inSegs.map((s: any, i: number) => (
            <React.Fragment key={`i${i}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.from} → {s.to}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{formatTime(s.depart_time)} – {formatTime(s.arrive_time)}</div>
                </div>
                <div style={{ fontWeight: 600 }}>{formatDur(s.duration_minutes)}</div>
              </div>
              {i < inSegs.length - 1 && (
                <div style={{ fontSize: 12, color: "#334155" }}>
                  Layover in {s.to} • {formatTime(inSegs[i + 1].depart_time)}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* HOTELS */}
=======
>>>>>>> f73a3db (fix(ui): TrioTrip default to triotrip.ai; stronger hotel image extraction + https; preserve international-only 'Know before you go')
      {showHotel && (
        <div style={{ display:"grid", gap:10 }}>
          <div style={{ fontWeight: 600, color:"#0f172a" }}>Hotels (top options)</div>
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
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.onerror = null;
                        // final fallback ensures something shows even if loremflickr fails
                        const seed = hash(`${h?.name || ""}|${city}|${i}`) % 1000000;
                        t.src = `https://picsum.photos/seed/${seed}/400/250`;
                      }}
                      style={{ width:160, height:100, objectFit:"cover", display:"block" }}
                    />
                  </a>
                  <div style={{ display:"grid", gap:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                      {/* Hotel name links to the same primary URL */}
                      <a href={primary} target="_blank" rel="noreferrer" style={{ fontWeight:700, color:"#0f172a", textDecoration:"none" }}>
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
