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

// Always usable default so TrioTrip opens even without a local /book route
const TRIOTRIP_BASE = "https://triotrip.vercel.app";

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
}: {
  pkg: any; index?: number; currency?: string; pax?: number;
  comparedIds?: string[]; onToggleCompare?: (id: string) => void; onSavedChangeGlobal?: (count: number) => void;
  large?: boolean; showHotel?: boolean;
}) {
  const id = pkg.id || `pkg-${index}`;
  const compared = comparedIds?.includes(id);

  // ---------- flights bits omitted for brevity (unchanged) ----------

  // Robust image resolver for hotels + fallbacks
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

    // Derive city robustly (lots of common shapes)
    const city =
      h?.city || h?.location?.city || h?.address?.city || h?.cityName || pkg?.destination || pkg?.to || pkg?.arrivalCity || "";

    if (city) {
      return `https://source.unsplash.com/featured/400x250/?hotel,${encodeURIComponent(city)}`;
    }

    // Ultimate fallback seeded placeholder
    const seed = encodeURIComponent(h?.id || h?.name || Math.random().toString(36).slice(2));
    return `https://picsum.photos/seed/${seed}/400/250`;
  };

  // ---------- helper to construct hotel links (unchanged) ----------
  function hotelLinks(h: any, cityFallback: string) {
    const city = h.city || cityFallback || "";
    const destName = h.name ? `${h.name}, ${city}` : (city || pkg.destination || "");
    const ci = pkg.hotelCheckIn || ""; const co = pkg.hotelCheckOut || "";
    const adultsCount = pkg.passengersAdults ?? pkg.passengers ?? 1;
    const childrenCount = pkg.passengersChildren ?? 0;
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

    const hcom = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hcom.searchParams.set("destination", destName);
    if (ci) hcom.searchParams.set("startDate", ci); if (co) hcom.searchParams.set("endDate", co);
    hcom.searchParams.set("adults", String(adultsCount));
    if (childrenCount > 0 && childAges.length) hcom.searchParams.set("children", childAges.join(","));

    const maps = new URL("https://www.google.com/maps/search/");
    maps.searchParams.set("api", "1");
    maps.searchParams.set("query", `hotels near ${destName || city}`);

    return { primary: b.toString(), expedia: e.toString(), hotels: hcom.toString(), maps: maps.toString() };
  }

  // ---------- UI (hotels section only) ----------
  const outSegs = Array.isArray(pkg?.flight?.segments) ? pkg.flight.segments : [];
  const out0 = outSegs?.[0] || {};
  const retSegs = Array.isArray(pkg?.returnFlight?.segments) ? pkg.returnFlight.segments : [];
  const ret0 = retSegs?.[0] || {};
  const adults = pkg.passengersAdults ?? pkg.passengers ?? 1;
  const children = pkg.passengersChildren ?? 0;
  const infants = pkg.passengersInfants ?? 0;

  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const route = `${from}-${to}`;
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (ret0?.depart_time || "").slice(0, 10);

  const trioTrip = `${TRIOTRIP_BASE}/book?from=${encodeURIComponent(pkg.origin||"")}&to=${encodeURIComponent(pkg.destination||"")}&depart=${encodeURIComponent(pkg.departDate||"")}${pkg.returnDate?`&return=${encodeURIComponent(pkg.returnDate)}`:""}&adults=${adults}&children=${children}&infants=${infants}`;

  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || pkg.airline || "";
  const airlineSite =
    AIRLINE_SITE[airline] || `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;

  const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(`${route} ${dateOut}${dateRet ? ` ${dateRet}` : ""} for ${Math.max(1, adults + children + infants)} travelers`)}`;
  const ssOut = (dateOut || "").replace(/-/g, ""); const ssRet = (dateRet || "").replace(/-/g, "");
  const skyScanner = (from && to && ssOut)
    ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${ssRet ? `${ssRet}/` : ""}?adults=${adults}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
    : "https://www.skyscanner.com/";

  const currencyLabel = pkg.currency || currency || "USD";

  const wrapStyle: React.CSSProperties = {
    display: "grid",
    gap: 12,
    border: compared ? "2px dashed #3b82f6" : "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    background: "#ffffff",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  return (
    <section className={`result-card ${compared ? "result-card--compared" : ""}`} style={wrapStyle} onClick={() => onToggleCompare?.(id)}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>
          Option {index + 1} • {route} {dateOut ? `• ${dateOut}` : ""} {pkg.roundTrip && dateRet ? `↩ ${dateRet}` : ""}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="book-link" href={trioTrip} target="_blank" rel="noreferrer">TrioTrip</a>
          <a className="book-link" href={googleFlights} target="_blank" rel="noreferrer">Google Flights</a>
          <a className="book-link" href={skyScanner} target="_blank" rel="noreferrer">Skyscanner</a>
          {airline && <a className="book-link" href={airlineSite} target="_blank" rel="noreferrer">{airline}</a>}
        </div>
      </header>

      {/* ... flight details render above here (unchanged) ... */}

      {showHotel && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>Hotels (top options)</div>
          {(Array.isArray(pkg.hotels) && pkg.hotels.length ? pkg.hotels : (pkg.hotel && !pkg.hotel.filteredOutByStar ? [pkg.hotel] : []))
            .slice(0, 3)
            .map((h: any, i: number) => {
              const city = h.city || pkg.destination || "";
              const links = hotelLinks(h, city);
              const img = hotelImg(h);

              return (
                <div key={`h${i}`} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <a href={links.primary} target="_blank" rel="noreferrer" style={{ borderRadius: 10, overflow: "hidden", background: "#f1f5f9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={h.name || "Hotel"}
                      onError={(e) => {
                        const cityFallback = h?.city || pkg?.destination || "";
                        (e.currentTarget as HTMLImageElement).src = cityFallback
                          ? `https://source.unsplash.com/featured/400x250/?hotel,${encodeURIComponent(cityFallback)}`
                          : "https://picsum.photos/400/250";
                      }}
                      style={{ width: 160, height: 100, objectFit: "cover", display: "block" }}
                    />
                  </a>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {h.name || "Hotel"}
                        </div>
                        {h.stars ? <div style={{ color: "#f59e0b", fontWeight: 700 }}>{`${"★".repeat(Math.max(1, Math.round(h.stars)))}`}</div> : null}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <a className="book-link book-link--primary" href={links.primary} target="_blank" rel="noreferrer">Booking.com</a>
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
