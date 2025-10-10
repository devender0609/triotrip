"use client";

import React, { useState } from "react";

/** Airline homepages; fallback = Google "airline + booking" */
const AIRLINE_SITE: Record<string, string> = {
  American: "https://www.aa.com",
  "American Airlines": "https://www.aa.com",
  Delta: "https://www.delta.com",
  "Delta Air Lines": "https://www.delta.com",
  United: "https://www.united.com",
  "United Airlines": "https://www.united.com",
  Alaska: "https://www.alaskaair.com",
  "Alaska Airlines": "https://www.alaskaair.com",
  Southwest: "https://www.southwest.com",
  JetBlue: "https://www.jetblue.com",
  "JetBlue Airways": "https://www.jetblue.com",
  Lufthansa: "https://www.lufthansa.com",
  AirCanada: "https://www.aircanada.com",
  "Air Canada": "https://www.aircanada.com",
  British: "https://www.britishairways.com",
  "British Airways": "https://www.britishairways.com",
};

type Props = {
  pkg: any;
  index?: number;
  currency: string;
  pax?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void;
  large?: boolean;
  showHotel?: boolean; // if omitted we infer from pkg.hotels/pkg.hotel
};

export default function ResultCard({
  pkg,
  index = 0,
  currency,
  pax = 1,
  comparedIds,
  onToggleCompare,
  onSavedChangeGlobal,
  large = true,
  showHotel,
}: Props) {
  const id = pkg.id || `r-${index}`;
  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || "Airline";
  const price =
    pkg.total_cost ??
    pkg.flight_total ??
    pkg.total_cost_flight ??
    pkg.flight?.price_usd_converted ??
    pkg.flight?.price_usd ??
    0;

  const outSegs = pkg.flight?.segments_out || [];
  const inSegs = pkg.flight?.segments_in || [];
  const stops =
    typeof pkg.flight?.stops === "number"
      ? pkg.flight.stops
      : Math.max(0, (outSegs.length || 1) - 1);

  // ----- hotel context (for deeplinks) -----
  const hotelCheckIn = pkg.hotelCheckIn || "";
  const hotelCheckOut = pkg.hotelCheckOut || "";
  const adults = Number(pkg.passengersAdults) || Number(pkg.passengers) || pax || 1;
  const children = Number(pkg.passengersChildren) || 0;
  const infants = Number(pkg.passengersInfants) || 0;
  const childrenAges: number[] = Array.isArray(pkg.passengersChildrenAges)
    ? pkg.passengersChildrenAges
    : [];

  // ----- flight deeplinks -----
  const route = `${outSegs?.[0]?.from || pkg.origin}-${outSegs?.[outSegs.length - 1]?.to || pkg.destination}`;
  const dateOut = (outSegs?.[0]?.depart_time || "").slice(0, 10);
  const dateRet = (inSegs?.[0]?.depart_time || "").slice(0, 10);

  const airlineSite =
    AIRLINE_SITE[airline] ||
    `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;

  const googleFlights =
    `https://www.google.com/travel/flights?q=` +
    encodeURIComponent(
      `${(outSegs?.[0]?.from || pkg.origin || "").toUpperCase()} to ${(outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase()} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${Math.max(1, adults + children + infants)} travelers`
    );

  // Skyscanner wants lowercase IATA + yyyymmdd
  const fromIata = (outSegs?.[0]?.from || pkg.origin || "").toLowerCase();
  const toIata = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toLowerCase();
  const ssOut = (dateOut || "").replace(/-/g, "");
  const ssRet = (dateRet || "").replace(/-/g, "");
  const skyScanner =
    (fromIata && toIata && ssOut)
      ? `https://www.skyscanner.com/transport/flights/${fromIata}/${toIata}/${ssOut}${ssRet ? `/${ssRet}` : ""}/?adults=${Math.max(1, adults)}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
      : "https://www.skyscanner.com/";

  // ----- hotel deeplinks (prefill search & image click target) -----
  function hotelLinks(h: any, cityFallback: string) {
    const city = h.city || cityFallback || "";
    const destName = h.name ? `${h.name}, ${city}` : city;
    const adultsCount = Math.max(1, adults);
    const childrenCount = Math.max(0, children);
    const childAges = childrenAges.filter((n) => Number.isFinite(n)).map(String);

    // Booking.com (prefilled)
    const b = new URL("https://www.booking.com/searchresults.html");
    if (destName) b.searchParams.set("ss", destName);
    if (hotelCheckIn) b.searchParams.set("checkin", hotelCheckIn);
    if (hotelCheckOut) b.searchParams.set("checkout", hotelCheckOut);
    b.searchParams.set("group_adults", String(adultsCount));
    b.searchParams.set("group_children", String(childrenCount));
    childAges.forEach((age) => b.searchParams.append("age", age));
    b.searchParams.set("no_rooms", "1");
    b.searchParams.set("selected_currency", pkg.currency || currency);

    // Expedia (prefilled)
    const e = new URL("https://www.expedia.com/Hotel-Search");
    if (destName) e.searchParams.set("destination", destName);
    if (hotelCheckIn) e.searchParams.set("checkIn", hotelCheckIn);
    if (hotelCheckOut) e.searchParams.set("checkOut", hotelCheckOut);
    e.searchParams.set("adults", String(adultsCount));
    if (childrenCount > 0) {
      e.searchParams.set("children", String(childrenCount));
      if (childAges.length) e.searchParams.set("childAges", childAges.join(","));
    }
    e.searchParams.set("currency", pkg.currency || currency);

    // Hotels.com (prefilled)
    const hcx = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hcx.searchParams.set("destination", destName);
    if (hotelCheckIn) hcx.searchParams.set("checkIn", hotelCheckIn);
    if (hotelCheckOut) hcx.searchParams.set("checkOut", hotelCheckOut);
    hcx.searchParams.set("adults", String(adultsCount));
    if (childrenCount > 0) {
      hcx.searchParams.set("children", String(childrenCount));
      if (childAges.length) hcx.searchParams.set("childAges", childAges.join(","));
    }
    hcx.searchParams.set("currency", pkg.currency || currency);

    // Primary link (image click target)
    const primary =
      (typeof h.url === "string" && h.url) ||
      (typeof h.website === "string" && h.website) ||
      (typeof h.officialUrl === "string" && h.officialUrl) ||
      b.toString();

    // Map link (precise if lat/lng)
    const maps = (typeof h.lat === "number" && typeof h.lng === "number")
      ? `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`
      : (destName
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName)}`
          : undefined);

    return { booking: b.toString(), expedia: e.toString(), hotels: hcx.toString(), maps, primary };
  }

  // ----- Book via TrioTrip -----
  async function bookViaTrioTrip() {
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer: {
            currency: pkg.currency || currency,
            total_cost: price,
            flight: {
              carrier_name: airline,
              origin: outSegs?.[0]?.from || pkg.origin,
              destination: outSegs?.[outSegs.length - 1]?.to || pkg.destination,
              price_usd: price,
            },
            pax,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.bookingUrl) throw new Error(j?.error || "Failed to create booking");
      const url = new URL(j.bookingUrl);
      url.searchParams.set("pax", String(pax));
      url.searchParams.set("count", String(pax));
      window.location.href = url.toString();
    } catch (e: any) {
      alert(e?.message || "Booking failed");
    }
  }

  // ----- Save (requires login) -----
  const [saving, setSaving] = useState(false);
  function requireLoginThenSave() {
    const user = localStorage.getItem("triptrio:user");
    if (!user) {
      if (confirm("Please sign in to save this option. Go to login page now?")) {
        window.location.href = "/login";
      }
      return;
    }
    try {
      setSaving(true);
      const saved = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      const next = Array.isArray(saved) ? saved : [];
      if (!next.find((x: any) => x?.id === id)) next.push({ id, airline, price });
      localStorage.setItem("triptrio:saved", JSON.stringify(next));
      window.dispatchEvent(new Event("triptrio:saved:changed"));
      onSavedChangeGlobal?.(next.length);
    } finally {
      setSaving(false);
    }
  }

  // ----- compare visuals & click-to-compare -----
  const isCompared = Array.isArray(comparedIds) ? comparedIds.includes(id) : false;

  const fs = large ? 15 : 14;
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: isCompared ? "2px solid #0ea5e9" : "1px solid #e2e7eb",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 12,
    fontSize: fs,
    boxShadow: isCompared ? "0 0 0 4px rgba(14,165,233,.15) inset" : "0 6px 18px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  const chipBtn: React.CSSProperties = {
    textDecoration: "none",
    color: "#0f172a",
    height: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 800,
    lineHeight: 1,
  };

  // tiny inline SVG as last resort
  const svgPlaceholder = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#e2e8f0'/><stop offset='100%' stop-color='#cbd5e1'/></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#475569' font-family='system-ui, sans-serif' font-size='16'>No image</text>
    </svg>`
  )}`;

  /** City-specific fallback images (hotel/building only) */
  function cityHotelFallbacks(city: string, name: string, i: number) {
    const qCity = encodeURIComponent(city || "city");
    const unsplash = `https://source.unsplash.com/featured/320x200/?hotel%20building,hotel,building,architecture,${qCity}`;
    const picsum = `https://picsum.photos/seed/${encodeURIComponent(`${city}-${name}-${i}-hotel-building`)}/320/200`;
    const flickr = `https://loremflickr.com/320/200/hotel,building,architecture,${qCity}?lock=${i}`;
    return { unsplash, picsum, flickr };
  }

  function chooseHotelImg(h: any, i: number) {
    const city = h.city || pkg.destination || "city";
    const name = h.name || "hotel";
    const fromData =
      (typeof h.imageUrl === "string" && /^https?:\/\//.test(h.imageUrl) && h.imageUrl) ||
      (typeof h.photoUrl === "string" && /^https?:\/\//.test(h.photoUrl) && h.photoUrl) ||
      "";
    const fb = cityHotelFallbacks(city, name, i);
    return { first: fromData || fb.unsplash, fallbacks: fb };
  }

  return (
    <article
      className={`result-card${isCompared ? " result-card--compared" : ""}`}
      data-offer-id={id}
      onClick={(e) => {
        if (!onToggleCompare) return;
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('a,button,input,select,textarea,[role="button"],[role="tab"],[role="link"]');
        if (!isInteractive) onToggleCompare(id);
      }}
      style={cardStyle}
      aria-pressed={isCompared}
    >
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong style={{ fontSize: 18 }}>{airline}</strong>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ fontWeight: 800 }}>{stops === 0 ? "Nonstop" : `${stops} stop(s)`}</span>
          {pkg.flight?.refundable && (
            <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 900, color: "#0f172a", background: "#e8efff", border: "1px solid #c7d2fe", borderRadius: 999, padding: "2px 8px" }}>
              Refundable
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onToggleCompare && (
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 900, color: "#334155" }}>
              <input
                type="checkbox"
                checked={!!isCompared}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleCompare?.(id);
                }}
              />
              Compare
            </label>
          )}
          <button onClick={(e) => { e.stopPropagation(); requireLoginThenSave(); }} disabled={saving} style={chipBtn}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Price */}
      <div style={{ fontWeight: 900, fontSize: 20 }}>
        {Math.round(Number(price)).toLocaleString()} {pkg.currency || currency}
      </div>

      {/* GRID: left = flight details, right = Book Flight */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 14,
          alignItems: "stretch",
        }}
      >
        {/* LEFT: FLIGHT column */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Flight</div>

          {/* Outbound */}
          {outSegs.length > 0 && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 8, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, color: "#334155" }}>Outbound</div>
              {outSegs.map((s: any, i: number) => (
                <React.Fragment key={`o${i}`}>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{s.from} → {s.to}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        {formatTime(s.depart_time)} – {formatTime(s.arrive_time)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900 }}>{formatDur(s.duration_minutes)}</div>
                  </div>
                  {i < outSegs.length - 1 && (
                    <LayoverRow
                      arrive_time={s.arrive_time}
                      next_depart_time={outSegs[i + 1].depart_time}
                      at={s.to}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Return */}
          {inSegs.length > 0 && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 8, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, color: "#334155" }}>Return</div>
              {inSegs.map((s: any, i: number) => (
                <React.Fragment key={`r${i}`}>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{s.from} → {s.to}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>
                        {formatTime(s.depart_time)} – {formatTime(s.arrive_time)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900 }}>{formatDur(s.duration_minutes)}</div>
                  </div>
                  {i < inSegs.length - 1 && (
                    <LayoverRow
                      arrive_time={s.arrive_time}
                      next_depart_time={inSegs[i + 1].depart_time}
                      at={s.to}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Book Flight card */}
        <div style={{ alignSelf: "stretch" }}>
          <div
            style={{
              height: "100%",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              justifyContent: "flex-start",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Book Flight</div>

            {/* ✅ Animated booking buttons (class-based) */}
            <button
              onClick={(e) => { e.stopPropagation(); bookViaTrioTrip(); }}
              className="book-link book-link--primary"
              style={{ minHeight: 34 }}
            >
              Book via TrioTrip
            </button>
            <a href={airlineSite} target="_blank" rel="noreferrer" className="book-link book-link--airline" onClick={(e) => e.stopPropagation()}>Airline site</a>
            <a href={googleFlights} target="_blank" rel="noreferrer" className="book-link book-link--gflights" onClick={(e) => e.stopPropagation()}>Google Flights</a>
            <a href={skyScanner} target="_blank" rel="noreferrer" className="book-link book-link--skyscanner" onClick={(e) => e.stopPropagation()}>Skyscanner</a>

            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: "#64748b", textAlign: "center" }}>
              Prices and availability may change.
            </div>
          </div>
        </div>
      </section>

      {/* HOTELS */}
      {(showHotel ?? ((Array.isArray(pkg.hotels) && pkg.hotels.length > 0) || (pkg.hotel && !pkg.hotel.filteredOutByStar))) && (
        <div
          style={{
            border: "2px solid #e2e8f0",
            borderRadius: 14,
            padding: 14,
            display: "grid",
            gap: 12,
            background: "#fcfdff",
          }}
        >
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Hotels (top options)</div>

          {(Array.isArray(pkg.hotels) && pkg.hotels.length ? pkg.hotels : (pkg.hotel && !pkg.hotel.filteredOutByStar ? [pkg.hotel] : []))
            .slice(0, 3)
            .map((h: any, i: number) => {
              const city = h.city || pkg.destination || "";
              const links = hotelLinks(h, city);
              const { first, fallbacks } = chooseHotelImg(h, i);

              return (
                <div
                  key={`h${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr",
                    gap: 12,
                    alignItems: "center",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 10,
                    background: "#fff"
                  }}
                >
                  <a
                    href={links.primary}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={`Open ${h.name || "hotel"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={first}
                      alt={h.name || "Hotel photo"}
                      width={160}
                      height={120}
                      style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
                      loading={i === 0 ? "eager" : "lazy"}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        if (!el.dataset.step) { el.dataset.step = "1"; el.src = fallbacks.unsplash; return; }
                        if (el.dataset.step === "1") { el.dataset.step = "2"; el.src = fallbacks.picsum; return; }
                        if (el.dataset.step === "2") { el.dataset.step = "3"; el.src = fallbacks.flickr; return; }
                        if (el.src !== svgPlaceholder) el.src = svgPlaceholder;
                      }}
                    />
                  </a>

                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontWeight: 900 }}>
                        {h.name} {typeof h.star === "number" ? `(${h.star}★)` : ""}
                        {city ? <span style={{ marginLeft: 6, color: "#64748b", fontWeight: 700 }}>• {city}</span> : null}
                      </div>
                      <div style={{ fontWeight: 900 }}>
                        {Math.round(h.price_converted || 0).toLocaleString()} {h.currency || pkg.currency || currency}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      <a href={links.primary} target="_blank" rel="noreferrer noopener" className="book-link" onClick={(e) => e.stopPropagation()}>Hotel website</a>
                      <a href={links.booking} target="_blank" rel="noreferrer noopener" className="book-link" onClick={(e) => e.stopPropagation()}>Booking.com</a>
                      <a href={links.hotels} target="_blank" rel="noreferrer noopener" className="book-link" onClick={(e) => e.stopPropagation()}>Hotels.com</a>
                      <a href={links.expedia} target="_blank" rel="noreferrer noopener" className="book-link" onClick={(e) => e.stopPropagation()}>Expedia</a>
                      {links.maps && (
                        <a href={links.maps} target="_blank" rel="noreferrer noopener" className="book-link" onClick={(e) => e.stopPropagation()}>View on map</a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </article>
  );
}

/* ---------- subcomponents & utils ---------- */

function LayoverRow({
  arrive_time,
  next_depart_time,
  at,
}: {
  arrive_time: string;
  next_depart_time: string;
  at?: string;
}) {
  const mins = layoverMins(arrive_time, next_depart_time);
  return (
    <div
      style={{
        textAlign: "center",
        color: "#64748b",
        fontWeight: 800,
        padding: "4px 8px",
      }}
      aria-label="Layover"
    >
      Layover{at ? ` at ${at}` : ""} • {mins ? `${mins}m` : "~50m"}
    </div>
  );
}

function layoverMins(prevArr: string, nextDep: string) {
  const a = Date.parse(prevArr);
  const d = Date.parse(nextDep);
  if (!Number.isFinite(a) || !Number.isFinite(d) || d <= a) return undefined;
  return Math.round((d - a) / 60000);
}

function formatDur(min?: number) {
  const m = Number(min) || 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
