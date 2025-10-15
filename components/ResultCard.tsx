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

const TRIOTRIP_BASE = process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "https://triotrip.ai";

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
    background: "linear-gradient(180deg,#ffffff,#f3f9ff)",
    border: compared ? "2px solid #0ea5e9" : "1px solid #dfe6f5",
    borderRadius: 16, padding: 14, display: "grid", gap: 12, fontSize: fs,
    boxShadow: compared ? "0 0 0 4px rgba(14,165,233,.15) inset" : "0 8px 20px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  const out0 = outSegs?.[0]; const ret0 = inSegs?.[0];
  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const route = `${from}-${to}`;
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (ret0?.depart_time || "").slice(0, 10);

  const trioTrip = `${TRIOTRIP_BASE}/book?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&depart=${encodeURIComponent(dateOut)}${dateRet ? `&return=${encodeURIComponent(dateRet)}` : ""}&adults=${adults}&children=${children}&infants=${infants}`;

  const airlineSite =
    AIRLINE_SITE[airline] || `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;

  const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(`${from} to ${to} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${Math.max(1, adults + children + infants)} travelers`)}`;
  const ssOut = (dateOut || "").replace(/-/g, ""); const ssRet = (dateRet || "").replace(/-/g, "");
  const skyScanner = (from && to && ssOut)
    ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${dateRet ? ssRet + "/" : ""}?adults=${adults}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
    : "https://www.skyscanner.com/";

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

    const official = ensureHttps(h.website || h.officialUrl || h.url || "");
    const maps = (typeof h.lat === "number" && typeof h.lng === "number")
      ? `https://www.google.com/maps/@?api=1&map_action=map&center=${h.lat},${h.lng}&zoom=16`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name ? `${h.name}, ${city}` : city)}`;

    const primary = official || b.toString();
    return { booking: b.toString(), expedia: e.toString(), hotels: hcx.toString(), maps, primary, official };
  }

  // 🔑 Deterministic, no-flicker hotel image resolver
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

    const seedBase = (h?.id || h?.name || h?.city || h?.address?.city || pkg?.destination || "hotel-placeholder") + "";
    const seed = encodeURIComponent(seedBase.toLowerCase().replace(/\s+/g, "-"));
    return `https://picsum.photos/seed/${seed}/400/250`;
  };

  return (
    <section className={`result-card ${compared ? "result-card--compared" : ""}`} style={wrapStyle} onClick={() => onToggleCompare?.(id)}>
      {/* ... flight UI omitted for brevity ... */}

      {showHotel && (
        <div className="hotel-card" style={{ border: "1px solid #cfeadf", borderRadius: 14, padding: 14, display: "grid", gap: 12, background: "linear-gradient(180deg,#ffffff,#effef8)" }}>
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
                    <img
                      src={img}
                      alt={h.name || "Hotel"}
                      loading="lazy"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.onerror = null;
                        t.src = "https://picsum.photos/seed/hotel-fallback/400/250";
                      }}
                      style={{ width: 160, height: 100, objectFit: "cover", display: "block" }}
                    />
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
