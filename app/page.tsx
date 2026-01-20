"use client";

import React, { useMemo, useState } from "react";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortBasis = "flightOnly" | "bundle";

type Segment = {
  from?: string;
  to?: string;
  depart_time?: string; // "2026-01-20T06:00"
  arrive_time?: string;
  duration_minutes?: number;
};

type Hotel = {
  name?: string;
  star?: number;
  city?: string;
  price_converted?: number;
  currency?: string;
  imageUrl?: string;
  deeplinks?: Record<string, any>;
};

type Candidate = {
  id?: string;
  currency?: string;

  flight?: {
    carrier_name?: string;
    cabin?: string;
    stops?: number;
    refundable?: boolean;
    greener?: boolean;
    price_usd?: number;
    duration_minutes?: number;
    segments_out?: Segment[];
    segments_in?: Segment[];
    deeplinks?: {
      airline?: {
        name?: string;
        url?: string;
      };
    };
  };

  deeplinks?: {
    airline?: {
      name?: string;
      url?: string;
    };
  };

  hotelCheckIn?: string;
  hotelCheckOut?: string;

  flight_total?: number;
  hotel_total?: number;
  total_cost?: number;
  display_total?: number;

  hotels?: Hotel[];
  hotel?: Hotel;
};

type SearchResponse = {
  results?: Candidate[];
  hotelWarning?: string | null;
  sortBasis?: SortBasis | string;
};

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

function fmtDT(s?: string) {
  if (!s) return "";
  return s.replace("T", " ");
}

function minutesToHM(m?: number) {
  const mm = Number(m || 0);
  const h = Math.floor(mm / 60);
  const r = mm % 60;
  if (!mm) return "";
  return `${h}h ${r}m`;
}

function safeNumber(v: any): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getCandidatePrice(c: Candidate): number | null {
  // Your payload has display_total=flight price. total_cost includes hotel.
  return (
    safeNumber(c.display_total) ??
    safeNumber(c.total_cost) ??
    safeNumber(c.flight_total) ??
    safeNumber(c.flight?.price_usd) ??
    null
  );
}

export default function Page() {
  const [tab, setTab] = useState<"manual" | "ai">("manual");

  // Manual inputs
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
  const [sortBasis, setSortBasis] = useState<SortBasis>("flightOnly");
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");

  // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [raw, setRaw] = useState<SearchResponse | null>(null);
  const [results, setResults] = useState<Candidate[]>([]);
  const [hotelWarning, setHotelWarning] = useState<string | null>(null);

  const allHotels: Hotel[] = useMemo(() => {
    const h = results.flatMap((c) => {
      const arr = Array.isArray(c.hotels) ? c.hotels : [];
      if (arr.length) return arr;
      return c.hotel ? [c.hotel] : [];
    });
    return h;
  }, [results]);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setRaw(null);
    setResults([]);
    setHotelWarning(null);

    try {
      const payload: any = {
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        departDate,
        roundTrip,
        returnDate: roundTrip ? returnDate : undefined,

        passengers: adults + children + infants,
        passengersAdults: adults,
        passengersChildren: children,
        passengersInfants: infants,
        passengersChildrenAges: Array.from({ length: children }, () => 8),

        cabin,
        currency,
        maxStops,
        sortBasis,

        includeHotel,
        hotelCheckIn: includeHotel ? (hotelCheckIn || departDate || undefined) : undefined,
        hotelCheckOut: includeHotel
          ? (hotelCheckOut || (roundTrip ? returnDate : addDays(departDate, 1)) || undefined)
          : undefined,
      };

      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const j = (await r.json()) as SearchResponse;
      setRaw(j);

      if (!r.ok) {
        throw new Error((j as any)?.error || "Search failed");
      }

      const arr = Array.isArray(j?.results) ? j.results : [];
      setResults(arr);
      setHotelWarning(j?.hotelWarning ?? null);
      setTab("manual");
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 18 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          onClick={() => setTab("manual")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: tab === "manual" ? "#111827" : "white",
            color: tab === "manual" ? "white" : "#111827",
            cursor: "pointer",
          }}
        >
          🔎 Manual Search
        </button>
        <button
          onClick={() => setTab("ai")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: tab === "ai" ? "#111827" : "white",
            color: tab === "ai" ? "white" : "#111827",
            cursor: "pointer",
          }}
        >
          ✨ AI Trip Planning
        </button>
      </div>

      {tab === "ai" ? (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "white" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>AI Trip Planning</div>
          <div style={{ color: "#6b7280" }}>
            AI UI placeholder. Manual is fully wired to your current API response shape.
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "white" }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Manual Search</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Adults</div>
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(e) => setAdults(Math.max(1, Number(e.target.value || 1)))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Children</div>
              <input
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(Math.max(0, Number(e.target.value || 0)))}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Infants</div>
              <input
                type="number"
                min={0}
                value={infants}
                onChange={(e) => setInfants(Math.max(0, Number(e.target.value || 0)))}
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

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={includeHotel}
                onChange={(e) => setIncludeHotel(e.target.checked)}
              />
              Include hotel
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Sort basis</span>
              <select value={sortBasis} onChange={(e) => setSortBasis(e.target.value as SortBasis)}>
                <option value="flightOnly">flightOnly</option>
                <option value="bundle">bundle</option>
              </select>
            </label>

            {includeHotel && (
              <>
                <label>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Hotel check-in</div>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    style={{ width: 180, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  />
                </label>
                <label>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Hotel check-out</div>
                  <input
                    type="date"
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                    style={{ width: 180, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  />
                </label>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRaw(null);
                setResults([]);
                setHotelWarning(null);
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
                minWidth: 140,
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 800 }}>
              {error}
            </div>
          )}

          {hotelWarning && (
            <div style={{ marginTop: 10, color: "#92400e", fontWeight: 700 }}>
              ⚠ {hotelWarning}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>Flights: {results.length}</div>
            <div style={{ fontWeight: 900 }}>Hotels: {allHotels.length}</div>
          </div>

          {/* FLIGHTS */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Flight options</div>
            {results.length === 0 ? (
              <div style={{ color: "#6b7280" }}>No flights yet. Run a search.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {results.map((c) => {
                  const cur = c.currency || currency || "USD";
                  const price = getCandidatePrice(c);
                  const airlineName = c.flight?.carrier_name || c.deeplinks?.airline?.name || "Airline";
                  const stops = c.flight?.stops ?? null;
                  const duration = c.flight?.duration_minutes ?? sumDur(c.flight?.segments_out) + sumDur(c.flight?.segments_in);
                  const link = c.flight?.deeplinks?.airline?.url || c.deeplinks?.airline?.url;

                  return (
                    <div key={c.id || Math.random()} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 900 }}>
                          {airlineName}{" "}
                          <span style={{ fontWeight: 600, color: "#6b7280" }}>
                            • {c.flight?.cabin || cabin}
                            {stops != null ? ` • ${stops} stop${stops === 1 ? "" : "s"}` : ""}
                            {duration ? ` • ${minutesToHM(duration)}` : ""}
                          </span>
                        </div>

                        <div style={{ fontWeight: 900 }}>
                          {price != null ? `${currencySymbol(cur)}${price.toFixed(0)}` : "—"}
                          {c.hotel_total ? (
                            <span style={{ fontWeight: 700, color: "#6b7280" }}>
                              {" "}
                              • Hotel {currencySymbol(cur)}
                              {Number(c.hotel_total).toFixed(0)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Outbound</div>
                          {Array.isArray(c.flight?.segments_out) && c.flight!.segments_out!.length ? (
                            <ul style={{ margin: 6, paddingLeft: 18 }}>
                              {c.flight!.segments_out!.map((s, idx) => (
                                <li key={idx} style={{ fontSize: 13 }}>
                                  {s.from} → {s.to} • {fmtDT(s.depart_time)} → {fmtDT(s.arrive_time)}{" "}
                                  {s.duration_minutes ? `(${minutesToHM(s.duration_minutes)})` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div style={{ color: "#6b7280", fontSize: 13 }}>—</div>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Return</div>
                          {Array.isArray(c.flight?.segments_in) && c.flight!.segments_in!.length ? (
                            <ul style={{ margin: 6, paddingLeft: 18 }}>
                              {c.flight!.segments_in!.map((s, idx) => (
                                <li key={idx} style={{ fontSize: 13 }}>
                                  {s.from} → {s.to} • {fmtDT(s.depart_time)} → {fmtDT(s.arrive_time)}{" "}
                                  {s.duration_minutes ? `(${minutesToHM(s.duration_minutes)})` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div style={{ color: "#6b7280", fontSize: 13 }}>—</div>
                          )}
                        </div>
                      </div>

                      {link ? (
                        <div style={{ marginTop: 8 }}>
                          <a href={link} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>
                            Book on {airlineName}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HOTELS */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Hotels (from candidates)</div>

            {allHotels.length === 0 ? (
              <div style={{ color: "#6b7280" }}>
                No hotels returned in the response. (Expected keys: <code>candidate.hotels</code> or <code>candidate.hotel</code>)
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {allHotels.map((h, idx) => {
                  const cur = h.currency || currency || "USD";
                  const p = typeof h.price_converted === "number" ? h.price_converted : null;
                  return (
                    <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                      {h.imageUrl ? (
                        <img src={h.imageUrl} alt={h.name || "Hotel"} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                      ) : null}
                      <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>{h.name || "Hotel"}</div>
                        <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
                          {h.city ? `${h.city}` : ""} {typeof h.star === "number" ? `• ${h.star}★` : ""}
                        </div>
                        <div style={{ marginTop: 8, fontWeight: 900 }}>
                          {p != null ? `${currencySymbol(cur)}${p.toFixed(0)}` : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DEBUG */}
          <details style={{ marginTop: 18 }}>
            <summary style={{ cursor: "pointer", color: "#374151", fontWeight: 800 }}>
              Debug: raw API response JSON
            </summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f9fafb", padding: 12, borderRadius: 12 }}>
              {raw ? JSON.stringify(raw, null, 2) : "No response yet."}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
