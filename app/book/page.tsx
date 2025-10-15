// app/book/page.tsx
"use client";

import * as React from "react";

type SearchParams = {
  from?: string;
  to?: string;
  depart?: string;
  return?: string;
  adults?: string;
  children?: string;
  infants?: string;
  // optional hotel fields if you pass them
  checkin?: string;
  checkout?: string;
  currency?: string;
};

function iata(s?: string) {
  return (s || "").toUpperCase().slice(0, 3);
}

function safeInt(v: string | undefined, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function ymd(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

export default function BookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const from = iata(searchParams.from);
  const to = iata(searchParams.to);
  const depart = ymd(searchParams.depart);
  const ret = ymd(searchParams.return);
  const adults = Math.max(1, safeInt(searchParams.adults, 1));
  const children = safeInt(searchParams.children);
  const infants = safeInt(searchParams.infants);

  const checkin = ymd(searchParams.checkin);
  const checkout = ymd(searchParams.checkout);
  const currency = (searchParams.currency || "USD").toUpperCase();

  const paxTotal = adults + children + infants;

  const missing =
    !from || !to || !depart || (ret === "" && searchParams.return !== undefined);

  // External deep links
  const gf = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `${from} to ${to} on ${depart}${
      ret ? ` return ${ret}` : ""
    } for ${paxTotal} travelers`
  )}`;
  const ssOut = depart?.replace(/-/g, "");
  const ssRet = ret?.replace(/-/g, "");
  const skyscanner =
    from && to && ssOut
      ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${
          ret ? `${ssRet}/` : ""
        }?adults=${adults}${children ? `&children=${children}` : ""}${
          infants ? `&infants=${infants}` : ""
        }`
      : "https://www.skyscanner.com/";

  // Hotel metasearch (optional)
  const booking = new URL("https://www.booking.com/searchresults.html");
  booking.searchParams.set("ss", to || "");
  if (checkin) booking.searchParams.set("checkin", checkin);
  if (checkout) booking.searchParams.set("checkout", checkout);
  booking.searchParams.set("group_adults", String(adults || 1));
  if (children > 0) booking.searchParams.set("group_children", String(children));
  booking.searchParams.set("no_rooms", "1");
  booking.searchParams.set("selected_currency", currency);

  const expedia = new URL("https://www.expedia.com/Hotel-Search");
  expedia.searchParams.set("destination", to || "");
  if (checkin) expedia.searchParams.set("startDate", checkin);
  if (checkout) expedia.searchParams.set("endDate", checkout);
  expedia.searchParams.set("adults", String(adults || 1));
  if (children > 0) expedia.searchParams.set("children", String(children));

  const hotels = new URL("https://www.hotels.com/Hotel-Search");
  hotels.searchParams.set("destination", to || "");
  if (checkin) hotels.searchParams.set("checkIn", checkin);
  if (checkout) hotels.searchParams.set("checkOut", checkout);
  hotels.searchParams.set("adults", String(adults || 1));
  if (children > 0) hotels.searchParams.set("children", String(children));

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Your booking</h1>

      {/* Validation */}
      {missing ? (
        <div
          role="alert"
          style={{
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          We’re missing some info. Please make sure the URL has{" "}
          <code>from</code>, <code>to</code>, and <code>depart</code>{" "}
          (and <code>return</code> if round-trip).
        </div>
      ) : null}

      {/* Summary */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          ✈️ {from} → {to} {ret ? `• return ${ret}` : ""} • depart {depart}
        </div>
        <div style={{ color: "#334155" }}>
          Travelers: {adults} adult{adults !== 1 ? "s" : ""}
          {children ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}
          {infants ? `, ${infants} infant${infants !== 1 ? "s" : ""}` : ""}
        </div>
      </section>

      {/* Flight booking options */}
      <section
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          background: "#f8fbff",
        }}
      >
        <div style={{ fontWeight: 800, color: "#0b3b52", marginBottom: 8 }}>
          Book your flight
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="book-link" href={gf} target="_blank" rel="noreferrer">
            Google Flights
          </a>
          <a
            className="book-link"
            href={skyscanner}
            target="_blank"
            rel="noreferrer"
          >
            Skyscanner
          </a>
        </div>
      </section>

      {/* Hotel booking (optional, only if hotel dates are present or you just want it always visible) */}
      <section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
          {to ? `Stay in ${to}` : "Hotels"}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            className="book-link book-link--booking"
            href={booking.toString()}
            target="_blank"
            rel="noreferrer"
          >
            Booking.com
          </a>
          <a
            className="book-link book-link--expedia"
            href={expedia.toString()}
            target="_blank"
            rel="noreferrer"
          >
            Expedia
          </a>
          <a
            className="book-link book-link--hotels"
            href={hotels.toString()}
            target="_blank"
            rel="noreferrer"
          >
            Hotels.com
          </a>
        </div>
        {(checkin || checkout) && (
          <div style={{ marginTop: 10, color: "#334155" }}>
            Dates: {checkin || "?"} → {checkout || "?"} ({currency})
          </div>
        )}
      </section>
    </main>
  );
}
