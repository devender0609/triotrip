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
  "Air Canada": "https://www.aircanada.com",
  Lufthansa: "https://www.lufthansa.com",
  "British Airways": "https://www.britishairways.com",
  "Air France": "https://wwws.airfrance.us",
  KLM: "https://www.klm.us",
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
    pkg.flight?.price ??
    pkg.flight?.price_usd ??
    0;

  const outSegs = pkg.flight?.segments_out || [];
  const inSegs = pkg.flight?.segments_in || [];
  const stops =
    typeof pkg.flight?.stops === "number"
      ? pkg.flight.stops
      : Math.max(0, (outSegs.length || 1) - 1);

  // ----- passenger context -----
  const adults = Number(pkg.passengersAdults) || Number(pkg.passengers) || pax || 1;
  const children = Number(pkg.passengersChildren) || 0;
  const infants = Number(pkg.passengersInfants) || 0;
  const childrenAges: number[] = Array.isArray(pkg.childrenAges) ? pkg.childrenAges : [];

  // ----- dates & route -----
  const route = `${outSegs?.[0]?.from || pkg.origin}-${outSegs?.[outSegs.length - 1]?.to || pkg.destination}`;
  const dateOut = (outSegs?.[0]?.depart_time || "").slice(0, 10);
  const dateRet = (inSegs?.[0]?.depart_time || "").slice(0, 10);

  // Skyscanner wants lowercase IATA + yyyymmdd
  const fromIata = (outSegs?.[0]?.from || pkg.origin || "").toLowerCase();
  const toIata = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toLowerCase();
  const ssOut = (dateOut || "").replace(/-/g, "");
  const ssRet = (dateRet || "").replace(/-/g, "");

  // ----- Airline deeplink templates (best-effort) -----
  const AIRLINE_DEEPLINKS: Record<string, (p: any) => string> = {
    United: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.united.com/en/us/fsr/choose-flights?from=${from}&to=${to}` +
      (dateOut ? `&departDate=${dateOut}` : "") +
      (dateRet ? `&returnDate=${dateRet}` : "") +
      `&adult=${Math.max(1, adults || 1)}` +
      (children ? `&child=${children}` : "") +
      (infants ? `&infantLap=${infants}` : "") +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    Delta: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.delta.com/flight-search/book-a-flight` +
      `?fromCity=${from}&toCity=${to}` +
      (dateOut ? `&departureDate=${dateOut}` : "") +
      (dateRet ? `&returnDate=${dateRet}` : "") +
      `&tripType=${dateRet ? "RT" : "OW"}` +
      `&adultPassengersCount=${Math.max(1, adults || 1)}` +
      (children ? `&childPassengersCount=${children}` : "") +
      (infants ? `&infantInLapPassengersCount=${infants}` : "") +
      (cabin ? `&cabinClass=${encodeURIComponent(cabin)}` : ""),

    American: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.aa.com/booking/find-flights` +
      `?tripType=${dateRet ? "roundTrip" : "oneWay"}` +
      `&fromCity=${from}&toCity=${to}` +
      (dateOut ? `&departDate=${dateOut}` : "") +
      (dateRet ? `&returnDate=${dateRet}` : "") +
      `&passengerCount=${Math.max(1, (adults || 1) + (children || 0) + (infants || 0))}` +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    Alaska: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.alaskaair.com/planbook/shopping` +
      `?from=${from}&to=${to}` +
      (dateOut ? `&departureDate=${dateOut}` : "") +
      (dateRet ? `&returnDate=${dateRet}` : "") +
      `&adultCount=${Math.max(1, adults || 1)}` +
      (children ? `&childCount=${children}` : "") +
      (infants ? `&infantInLapCount=${infants}` : "") +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    JetBlue: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.jetblue.com/booking/flights` +
      `?from=${from}&to=${to}` +
      (dateOut ? `&depart=${dateOut}` : "") +
      (dateRet ? `&return=${dateRet}` : "") +
      `&ad=${Math.max(1, adults || 1)}` +
      (children ? `&ch=${children}` : "") +
      (infants ? `&inLap=${infants}` : "") +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    Southwest: ({ from, to, dateOut, dateRet, adults }) =>
      `https://www.southwest.com/air/booking/select.html` +
      `?originationAirportCode=${from}&destinationAirportCode=${to}` +
      (dateOut ? `&departureDate=${dateOut}` : "") +
      (dateRet ? `&returnDate=${dateRet}` : "") +
      `&adultPassengersCount=${Math.max(1, adults || 1)}` +
      `&tripType=${dateRet ? "roundtrip" : "oneway"}`,

    "Air Canada": ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.aircanada.com/ca/en/aco/home/book/flights.html` +
      `?org0=${from}&dest0=${to}` +
      (dateOut ? `&date0=${dateOut}` : "") +
      (dateRet ? `&date1=${dateRet}` : "") +
      `&adults=${Math.max(1, adults || 1)}` +
      (children ? `&children=${children}` : "") +
      (infants ? `&infant=${infants}` : "") +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    Lufthansa: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.lufthansa.com/us/en/flight-search` +
      `?origin=${from}&destination=${to}` +
      (dateOut ? `&outboundDate=${dateOut}` : "") +
      (dateRet ? `&returnDate=${dateRet}` : "") +
      `&adults=${Math.max(1, adults || 1)}` +
      (children ? `&children=${children}` : "") +
      (infants ? `&infants=${infants}` : "") +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    "British Airways": ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.britishairways.com/travel/home/public/en_us/` +
      `?from=${from}&to=${to}` +
      (dateOut ? `&depDate=${dateOut}` : "") +
      (dateRet ? `&retDate=${dateRet}` : "") +
      `&ad=${Math.max(1, adults || 1)}` +
      (children ? `&ch=${children}` : "") +
      (cabin ? `&cabin=${encodeURIComponent(cabin)}` : ""),

    "Air France": ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://wwws.airfrance.us/en/search/` +
      `?origin=${from}&destination=${to}` +
      (dateOut ? `&outboundDate=${dateOut}` : "") +
      (dateRet ? `&inboundDate=${dateRet}` : "") +
      `&adults=${Math.max(1, adults || 1)}` +
      (children ? `&children=${children}` : "") +
      (cabin ? `&cabinClass=${encodeURIComponent(cabin)}` : ""),

    KLM: ({ from, to, dateOut, dateRet, adults, children, infants, cabin }) =>
      `https://www.klm.us/search` +
      `?origin=${from}&destination=${to}` +
      (dateOut ? `&outboundDate=${dateOut}` : "") +
      (dateRet ? `&inboundDate=${dateRet}` : "") +
      `&adults=${Math.max(1, adults || 1)}` +
      (children ? `&children=${children}` : "") +
      (cabin ? `&cabinClass=${encodeURIComponent(cabin)}` : ""),
  };

  function buildAirlineDeepLink() {
    const carrier = airline;
    const params = {
      from: (outSegs?.[0]?.from || pkg.origin || "").toUpperCase(),
      to: (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase(),
      dateOut,
      dateRet,
      adults,
      children,
      infants,
      cabin: (pkg.cabin || pkg.cabinClass || "ECONOMY").toString(),
    };
    const f = AIRLINE_DEEPLINKS[carrier];
    if (typeof f === "function") return f(params);
    return AIRLINE_SITE[carrier] || `https://www.google.com/search?q=${encodeURIComponent(carrier + " booking")}`;
  }

  // ----- external links (flights) -----
  const airlineSite = buildAirlineDeepLink();

  const googleFlights =
    `https://www.google.com/travel/flights?q=` +
    encodeURIComponent(
      `${(outSegs?.[0]?.from || pkg.origin || "").toUpperCase()} to ${(outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase()} on ${dateOut}${dateRet ? ` return ${dateRet}` : ""} for ${Math.max(1, adults + children + infants)} travelers`
    );

  const skyScanner =
    fromIata && toIata && ssOut
      ? `https://www.skyscanner.com/transport/flights/${fromIata}/${toIata}/${ssOut}${ssRet ? `/${ssRet}` : ""}/?adults=${Math.max(
          1,
          adults
        )}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
      : "https://www.skyscanner.com/";

  // ----- hotel deeplinks (prefill search & image click target) -----
  const hotelCheckIn: string = pkg.hotelCheckIn || "";
  const hotelCheckOut: string = pkg.hotelCheckOut || "";
  const currency: string = pkg.currency || "USD";

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
    b.searchParams.set("selected_currency", currency);

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
    e.searchParams.set("currency", currency);

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
    hcx.searchParams.set("currency", currency);

    // Primary link (image click target)
    const primary =
      (typeof h.url === "string" && h.url) ||
      (typeof h.website == "string" && h.website) ||
      (typeof h.officialUrl === "string" && h.officialUrl) ||
      b.toString();

    // Map link (precise if lat/lng)
    const maps =
      typeof h.lat === "number" && typeof h.lng === "number"
        ? `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`
        : destName
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName)}`
        : undefined;

    return { booking: b.toString(), expedia: e.toString(), hotels: hcx.toString(), maps, primary };
  }

  /** Inline SVG fallback for hotel/image thumb */
  const blankImg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#e2e8f0'/><stop offset='100%' stop-color='#cbd5e1'/></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#475569' font-family='system-ui, sans-serif' font-size='16'>No image</text>
    </svg>`
  )}`;

  /** City-specific fallback images (hotel/building only) */
  function cityHotelFallbacks(city: string, name: string, i: number) {
    const qCity = encodeURIComponent(city || "city");
    // Prioritize queries that bias to buildings/hotels, not random nature/coffee
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

  // ----- compare state -----
  const isCompared = Array.isArray(comparedIds) ? comparedIds.includes(id) : false;

  // A visual style that reacts to compare-state (no redeclare)
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: isCompared ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 12,
    fontSize: large ? 16 : 14,
    boxShadow: isCompared ? "0 0 0 4px rgba(14,165,233,.15) inset" : "0 6px 18px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  return (
    <article
      data-offer-id={id}
      onClick={(e) => {
        if (onToggleCompare) {
          const target = e.target as HTMLElement;
          const isInteractive = target.closest(
            'a,button,input,select,textarea,[role="button"],[role="tab"],[role="link"]'
          );
          if (!isInteractive) onToggleCompare(id);
        }
      }}
      style={cardStyle}
    >
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong style={{ fontSize: 18 }}>{airline}</strong>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ fontWeight: 800 }}>{stops === 0 ? "Nonstop" : `${stops} stop(s)`}</span>
          {pkg.flight?.refundable && (
            <span style={{ marginLeft: 6, fontSize: 12, padding: "2px 6px", borderRadius: 8, background: "#ecfeff", color: "#0e7490", fontWeight: 800 }}>
              Refundable
            </span>
          )}
        </div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          {formatMoney(price, currency)}
        </div>
      </header>

      {/* Links row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={airlineSite} target="_blank" rel="noreferrer" style={chipBtn}>Airline site</a>
        <a href={googleFlights} target="_blank" rel="noreferrer" style={chipBtn}>Google Flights</a>
        <a href={skyScanner} target="_blank" rel="noreferrer" style={chipBtn}>Skyscanner</a>
      </div>

      {/* Hotel suggestions (if any) */}
      {(showHotel ?? !!(pkg.hotels || pkg.hotel)) && Array.isArray(pkg.hotels) && pkg.hotels.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 900, opacity: 0.8 }}>Hotels</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {pkg.hotels.slice(0, 3).map((h: any, i: number) => {
              const img = chooseHotelImg(h, i);
              const links = hotelLinks(h, pkg.destination || "");
              return (
                <article key={h.id || i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                  <a href={links.primary} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.first}
                      alt={h.name || "Hotel"}
                      style={{ width: "100%", height: 160, objectFit: "cover", background: "#f1f5f9" }}
                      onError={(e) => {
                        const asImg = e.currentTarget as HTMLImageElement;
                        asImg.onerror = null;
                        asImg.src = blankImg;
                      }}
                    />
                  </a>
                  <div style={{ padding: 10, display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 900 }}>{h.name || "Hotel"}</div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>{h.city || pkg.destination}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <a href={links.booking} target="_blank" rel="noreferrer noopener" style={chipBtn}>Booking.com</a>
                      <a href={links.expedia} target="_blank" rel="noreferrer noopener" style={chipBtn}>Expedia</a>
                      <a href={links.hotels} target="_blank" rel="noreferrer noopener" style={chipBtn}>Hotels.com</a>
                      {links.maps && (
                        <a href={links.maps} target="_blank" rel="noreferrer noopener" style={chipBtn}>Map</a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

function formatMoney(n: number, c: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
  } catch {
    return `$${(n || 0).toFixed(0)}`;
  }
}

const chipBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontWeight: 900,
  fontSize: 14,
  textDecoration: "none",
  display: "inline-block",
};
