"use client";

import React, { useMemo, useState } from "react";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type SortBasis = "flightOnly" | "bundle";

function currencySymbol(code: string) {
  const c = String(code || "").toUpperCase().trim();
  switch (c) {
    case "USD":
    case "CAD":
    case "AUD":
    case "NZD":
    case "SGD":
    case "HKD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "INR":
      return "₹";
    case "JPY":
    case "CNY":
      return "¥";
    case "KRW":
      return "₩";
    case "CHF":
      return "CHF ";
    case "SEK":
    case "NOK":
    case "DKK":
      return "kr ";
    case "AED":
      return "د.إ ";
    case "SAR":
      return "﷼ ";
    case "ZAR":
      return "R ";
    case "BRL":
      return "R$ ";
    default:
      return c ? `${c} ` : "";
  }
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Robustly extract "packages/flights" array from API response
function extractPackages(j: any): any[] {
  if (Array.isArray(j)) return j;
  if (Array.isArray(j?.packages)) return j.packages;
  if (Array.isArray(j?.results)) return j.results;
  if (Array.isArray(j?.data)) return j.data;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.flights)) return j.flights;
  if (Array.isArray(j?.searchResults)) return j.searchResults;
  return [];
}

// Robustly extract hotels
function extractHotels(j: any, packages: any[]): any[] {
  if (Array.isArray(j?.hotels)) return j.hotels;
  if (Array.isArray(j?.hotelResults)) return j.hotelResults;
  if (Array.isArray(j?.hotelsResults)) return j.hotelsResults;

  // Embedded hotels per package
  if (Array.isArray(packages) && packages.length) {
    const embedded = packages.flatMap((p: any) => {
      if (Array.isArray(p?.hotels)) return p.hotels;
      if (Array.isArray(p?.bundle?.hotels)) return p.bundle.hotels;
      return [];
    });
    return embedded;
  }
  return [];
}

export default function Page() {
  const [tab, setTab] = useState<"ai" | "manual">("manual");

  // Manual form state
  const [origin, setOrigin] = useState("AUS");
  const [destination, setDestination] = useState("BOS");
  const [departDate, setDepartDate] = useState(todayISO());
  const [roundTrip, setRoundTrip] = useState(true);
  const [returnDate, setReturnDate] = useState(addDays(todayISO(), 7));

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [cabin, setCabin] = useState<Cabin>("ECONOMY");
  const [currency, setCurrency] = useState("USD");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<SortBasis>("flightOnly");

  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");

  // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawResponse, setRawResponse] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

  // ✅ runSearch is defined in this scope (no TS error)
  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setPackages([]);
    setHotels([]);
    setRawResponse(null);

    try {
      const pax = adults + children + infants;

      const payload: any = {
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        departDate,
        roundTrip,
        returnDate: roundTrip ? returnDate : undefined,
        passengers: pax,
        passengersAdults: adults,
        passengersChildren: children,
        passengersInfants: infants,
        passengersChildrenAges: Array.from({ length: children }, () => 8),
        cabin,
        currency,
        maxStops,
        sort,
        sortBasis,
        includeHotel,
        hotelCheckIn: includeHotel
          ? (hotelCheckIn || departDate || undefined)
          : undefined,
        hotelCheckOut: includeHotel
          ? (hotelCheckOut ||
              (roundTrip ? returnDate : addDays(departDate, 1)) ||
              undefined)
          : undefined,
      };

      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const j = await r.json();
      setRawResponse(j);

      if (!r.ok) throw new Error(j?.error || "Search failed");

      const pkgs = extractPackages(j);
      const hts = extractHotels(j, pkgs);

      setPackages(pkgs);
      setHotels(hts);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const prettyFlightsCount = packages?.length ?? 0;
  const prettyHotelsCount = hotels?.length ?? 0;

  const firstHotelPrice = useMemo(() => {
    const h = hotels?.[0];
    const p =
      typeof h?.priceTotal === "number"
        ? h.priceTotal
        : typeof h?.price === "number"
        ? h.price
        : null;
    return p;
  }, [hotels]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => setTab("ai")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: tab === "ai" ? "#111827" : "white",
            color: tab === "ai" ? "white" : "#111827",
            cursor: "pointer",
            minWidth: 160,
          }}
        >
          ✨ AI Trip Planning
        </button>
        <button
          onClick={() => setTab("manual")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: tab === "manual" ? "#111827" : "white",
            color: tab === "manual" ? "white" : "#111827",
            cursor: "pointer",
            minWidth: 160,
          }}
        >
          🔎 Manual Search
        </button>
      </div>

      {tab === "ai" ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            background: "white",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>AI Trip Planning</div>
          <div style={{ color: "#6b7280" }}>
            This page is a build-safe baseline. If you want, we’ll wire your
            existing AI planner back in after Manual Search is confirmed working.
          </div>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            background: "white",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Manual Search</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>From (IATA)</div>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>To (IATA)</div>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Departure date</div>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Return date</div>
                <label style={{ fontSize: 12, color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={roundTrip}
                    onChange={(e) => setRoundTrip(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  Round-trip
                </label>
              </div>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={!roundTrip}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: roundTrip ? "white" : "#f3f4f6",
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Adults</div>
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value || 1))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Children</div>
              <input
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value || 0))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Infants</div>
              <input
                type="number"
                min={0}
                value={infants}
                onChange={(e) => setInfants(Number(e.target.value || 0))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Cabin</div>
              <select
                value={cabin}
                onChange={(e) => setCabin(e.target.value as Cabin)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </label>

            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Currency</div>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Max stops</div>
              <select
                value={maxStops}
                onChange={(e) => setMaxStops(Number(e.target.value) as 0 | 1 | 2)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              >
                <option value={0}>Nonstop</option>
                <option value={1}>Up to 1 stop</option>
                <option value={2}>Up to 2 stops</option>
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={includeHotel}
                onChange={(e) => setIncludeHotel(e.target.checked)}
              />
              Include hotel
            </label>

            <label>
              <span style={{ fontSize: 12, color: "#6b7280", marginRight: 6 }}>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="best">Best</option>
                <option value="cheapest">Cheapest</option>
                <option value="fastest">Fastest</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>

            <label>
              <span style={{ fontSize: 12, color: "#6b7280", marginRight: 6 }}>Price basis</span>
              <select value={sortBasis} onChange={(e) => setSortBasis(e.target.value as SortBasis)}>
                <option value="flightOnly">Flight only</option>
                <option value="bundle">Bundle</option>
              </select>
            </label>
          </div>

          {includeHotel && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <label>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Hotel check-in</div>
                <input
                  type="date"
                  value={hotelCheckIn}
                  onChange={(e) => setHotelCheckIn(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                />
              </label>
              <label>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Hotel check-out</div>
                <input
                  type="date"
                  value={hotelCheckOut}
                  onChange={(e) => setHotelCheckOut(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                />
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => {
                setPackages([]);
                setHotels([]);
                setRawResponse(null);
                setError(null);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #111827",
                background: "#111827",
                color: "white",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
                minWidth: 120,
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>
              Flights/packages: {prettyFlightsCount}
            </div>
            <div style={{ fontWeight: 800 }}>
              Hotels: {prettyHotelsCount}
            </div>
            {firstHotelPrice != null && (
              <div style={{ color: "#374151" }}>
                Example hotel price: {currencySymbol(currency)}
                {Number(firstHotelPrice).toFixed(0)}
              </div>
            )}
          </div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", color: "#374151" }}>
              Debug: show raw API response JSON
            </summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f9fafb", padding: 12, borderRadius: 12 }}>
              {rawResponse ? JSON.stringify(rawResponse, null, 2) : "No response yet."}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
