"use client";
import React from "react";

/** Airline homepages; fallback = Google "airline + booking" */
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

const TRIOTRIP_BASE = process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "https://triotrip.ai";

type Props = {
  pkg: any; index?: number; currency?: string; pax?: number;
  comparedIds?: string[]; onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void; large?: boolean; showHotel?: boolean;
};

export default function ResultCard({
  pkg, index = 0, currency, pax = 1,
  comparedIds, onToggleCompare, onSavedChangeGlobal, large = true, showHotel,
}: Props) {
  const id = pkg.id || `r-${index}`;
  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || "Airline";
  const price =
    pkg.total_cost ?? pkg.flight_total ?? pkg.total_cost_flight ??
    pkg.flight?.price_usd_converted ?? pkg.flight?.price_usd ?? 0;

  const outSegs = pkg.flight?.segments_out || [];
  const inSegs = pkg.flight?.segments_in || [];

  const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
  const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
  const infants = Number(pkg.passengersInfants ?? pkg.infants ?? 0) || 0;

  const compared = Array.isArray(comparedIds) && comparedIds.includes(id);

  const fs = large ? 15 : 14;
  const wrapStyle: React.CSSProperties = {
    background: "linear-gradient(180deg,#ffffff,#f7fbff)",
    border: compared ? "2px solid #0ea5e9" : "1px solid #dfe6f5",
    borderRadius: 16, padding: 14, display: "grid", gap: 12, fontSize: fs,
    boxShadow: compared ? "0 0 0 4px rgba(14,165,233,.15) inset" : "0 8px 20px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  // ----- flight deeplinks -----
  const out0 = outSegs?.[0]; const ret0 = inSegs?.[0];
  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const route = `${from}-${to}`;
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (ret0?.depart_time || "").slice(0, 10);

  // TrioTrip booking — go to your site (works even if you don’t have the route yet)
  const trioTrip = `${TRIOTRIP_BASE}/book?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&depart=${encodeURIComponent(dateOut)}${dateRet ? `&return=${encodeURIComponent(dateRet)}` : ""}&adults=${adults}&children=${children}&infants=${infants}`;

  const airlineSite =
    AIRLINE_SITE[airline] || `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;

  // Optional alternates
  const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(`${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${Math.max(1, adults + children + infants)} travelers`)}`;
  const ssOut = (dateOut || "").replace(/-/g, ""); const ssRet = (dateRet || "").replace(/-/g, "");
  const skyScanner = (from && to && ssOut)
    ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${dateRet ? ssRet + "/" : ""}?adults=${adults}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
    : "https://www.skyscanner.com/";

  // ----- hotels -----
  function hotelLinks(h: any, cityFallback: string) {
    const city = h.city || cityFallback || "";
    const destName = h.name ? `${h.name}, ${city}` : (city || pkg.destination || "");
    const ci = pkg.hotelCheckIn || ""; const co = pkg.hotelCheckOut || "";
    const adultsCount = adults; const childrenCount = children;
    const childAges = Array.isArray(pkg.passengersChildrenAges) ? pkg.passengersChildrenAges : [];

    const b = new URL("https://www.booking.com/searchresults.html");
    if (destName) b.searchParams.set("ss", destName);
    if (ci) b.searchParams.set("checkin", ci); if (co) b.searchParams.set("checkout", co);
    b.searchParams.set("group_adults", String(adultsCount)); b.searchParams.set("no_rooms","1");
    if (childrenCount > 0) { b.searchParams.set("group_children", String(childrenCount)); if (childAges.length) b.searchParams.set("age", childAges.join(",")); }
    b.searchParams.set("selected_currency", pkg.currency || "USD");

    const e = new URL("https://www.expedia.com/Hotel-Search");
    if (destName) e.searchParams.set("destination", destName);
    if (ci) e.searchParams.set("startDate", ci); if (co) e.searchParams.set("endDate", co);
    e.searchParams.set("adults", String(adultsCount));
    if (childrenCount > 0 && childAges.length) e.searchParams.set("children", childAges.join(","));
    e.searchParams.set("currency", pkg.currency || "USD");

    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hcx.searchParams.set("destination", destName);
    if (ci) hcx.searchParams.set("checkIn", ci); if (co) hcx.searchParams.set("checkOut", co);
    hcx.searchParams.set("adults", String(adultsCount));
    if (childrenCount > 0) { hcx.searchParams.set("children", String(childrenCount)); if (childAges.length) hcx.searchParams.set("childAges", childAges.join(",")); }
    hcx.searchParams.set("currency", pkg.currency || "USD");

    const official = h.website || h.officialUrl || h.url || "";
    const maps = (typeof h.lat === "number" && typeof h.lng === "number")
      ? `https://www.google.com/maps/@?api=1&map_action=map&center=${h.lat},${h.lng}&zoom=16`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name ? `${h.name}, ${city}` : city)}`;

    const primary = official || b.toString();
    return { booking: b.toString(), expedia: e.toString(), hotels: hcx.toString(), maps, primary, official };
  }

  function formatDur(min?: number) { const m = Number(min) || 0; const h = Math.floor(m/60); const mm = m%60; return `${h}h ${mm}m`; }
  function formatTime(iso?: string) { if (!iso) return ""; const d = new Date(iso); if (Number.isNaN(d.getTime())) return ""; return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  function LayoverRow({ arrive_time, next_depart_time, at }: any) {
    const a = new Date(arrive_time); const b = new Date(next_depart_time);
    const mins = Math.max(0, Math.round((+b - +a) / 60000));
    return (
      <div style={{ padding: 6, color: "#334155", fontSize: 14, display: "flex", justifyContent: "center" }}>
        ⏳ Layover at <strong style={{ margin: "0 6px", fontWeight: 600 }}>{at}</strong> — {formatDur(mins)}
      </div>
    );
  }

  // Guaranteed hotel image from many fields + unsplash fallback
  const hotelImg = (h: any) =>
    h?.image || h?.photo || h?.photoUrl || h?.image_url || h?.thumbnail || h?.img ||
    (h?.photos && Array.isArray(h.photos) && h.photos.length ? h.photos[0] : null) ||
    (h?.city ? `https://source.unsplash.com/featured/400x250/?hotel,${encodeURIComponent(h.city)}` :
     pkg?.destination ? `https://source.unsplash.com/featured/400x250/?hotel,${encodeURIComponent(pkg.destination)}` :
     "https://images.unsplash.com/photo-1551776235-dde6d4829808?auto=format&fit=crop&w=800&q=60");

  return (
    <section className={`result-card ${compared ? "result-card--compared" : ""}`} style={wrapStyle} onClick={() => onToggleCompare?.(id)}>
      {/* HEADER / PRICE / CTAs */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 600, fontSize: 18, color: "#0f172a" }}>
          {airline}
          <span style={{ opacity: 0.7, fontWeight: 500, marginLeft: 8 }}>{route} {dateOut ? `· ${dateOut}` : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <a className="book-link book-link--primary" href={trioTrip} target="_blank" rel="noreferrer">TrioTrip</a>
          <a className="book-link book-link--gflights" href={googleFlights} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="book-link book-link--skyscanner" href={skyScanner} target="_blank" rel="noreferrer">Skyscanner</a>
          <a className="book-link book-link--airline" href={airlineSite} target="_blank" rel="noreferrer">Airline</a>
          <div style={{ fontWeight: 600, marginLeft: 6 }}>{Math.round(Number(price || 0)).toLocaleString()} {currency || pkg.currency || "USD"}</div>
        </div>
      </header>

      {/* FLIGHT DETAILS (colorful rows) */}
      <div style={{ display: "grid", gap: 8 }}>
        {outSegs.length > 0 && (
          <div style={{ border: "1px solid #cfe3ff", borderRadius: 12, padding: 8, display: "grid", gap: 8, background:"linear-gradient(180deg,#ffffff,#f0f7ff)" }}>
            <div style={{ fontWeight: 600, color: "#0b3b52" }}>Outbound</div>
            {outSegs.map((s: any, i: number) => (
              <React.Fragment key={`o${i}`}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background:"#fff" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.from} → {s.to}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{formatTime(s.depart_time)} – {formatTime(s.arrive_time)}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatDur(s.duration_minutes)}</div>
                </div>
                {i < outSegs.length - 1 && (<LayoverRow arrive_time={s.arrive_time} next_depart_time={outSegs[i + 1].depart_time} at={s.to} />)}
              </React.Fragment>
            ))}
          </div>
        )}

        {inSegs.length > 0 && (
          <div style={{ border: "1px solid #cfe3ff", borderRadius: 12, padding: 8, display: "grid", gap: 8, background:"linear-gradient(180deg,#ffffff,#f0f7ff)" }}>
            <div style={{ fontWeight: 600, color: "#0b3b52" }}>Return</div>
            {inSegs.map((s: any, i: number) => (
              <React.Fragment key={`i${i}`}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background:"#fff" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.from} → {s.to}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{formatTime(s.depart_time)} – {formatTime(s.arrive_time)}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatDur(s.duration_minutes)}</div>
                </div>
                {i < inSegs.length - 1 && (<LayoverRow arrive_time={s.arrive_time} next_depart_time={inSegs[i + 1].depart_time} at={s.to} />)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* HOTELS (colorful + with images) */}
      {showHotel && (
        <div className="hotel-card" style={{ border: "1px solid #cfeadf", borderRadius: 14, padding: 14, display: "grid", gap: 12, background: "linear-gradient(180deg,#ffffff,#f3fff9)" }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>Hotels (top options)</div>
          {(Array.isArray(pkg.hotels) && pkg.hotels.length ? pkg.hotels : (pkg.hotel && !pkg.hotel.filteredOutByStar ? [pkg.hotel] : []))
            .slice(0, 3)
            .map((h: any, i: number) => {
              const city = h.city || pkg.destination || "";
              const links = hotelLinks(h, city);
              const img = hotelImg(h);

              return (
                <div key={`h${i}`} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <a href={links.primary} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 10, overflow: "hidden", background: "#f1f5f9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={h.name || "Hotel"} style={{ width: 160, height: 100, objectFit: "cover", display: "block" }} />
                  </a>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 600 }}>{h.name || "Hotel"}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {links.official && <a className="book-link book-link--primary" href={links.official} target="_blank" rel="noreferrer">Hotel site</a>}
                        <a className="book-link book-link--booking" href={links.booking} target="_blank" rel="noreferrer">Booking</a>
                        <a className="book-link book-link--expedia" href={links.expedia} target="_blank" rel="noreferrer">Expedia</a>
                        <a className="book-link book-link--hotels" href={links.hotels} target="_blank" rel="noreferrer">Hotels</a>
                        {links.maps && <a className="book-link book-link--maps" href={links.maps} target="_blank" rel="noreferrer">Map</a>}
                      </div>
                    </div>
                    <div style={{ color: "#475569", fontSize: 13 }}>{h.address || h.city || city}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
