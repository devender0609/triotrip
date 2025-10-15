// app/page.tsx
"use client";
export const dynamic = "force-dynamic";

import React from "react";
import AirportField from "@/components/AirportField";
import ResultCard from "@/components/ResultCard";
import SavedChip from "@/components/SavedChip";
import SavorExploreLinks from "@/components/SavorExploreLinks";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";

type SearchPayload = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  roundTrip: boolean;
  passengers: number;
  passengersAdults: number;
  passengersChildren: number;
  passengersInfants: number;
  cabin: Cabin;
  includeHotel: boolean;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  minHotelStar?: number;
  minBudget?: number;
  maxBudget?: number;
  currency: string;
  sort: SortKey;
  maxStops?: 0 | 1 | 2;
  refundable?: boolean;
  greener?: boolean;
  sortBasis?: "flightOnly" | "bundle";
};

// ---- helpers ----
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

function extractIATA(display: string): string {
  const s = String(display || "").toUpperCase().trim();
  const m1 = /\(([A-Z]{3})\)/.exec(s);
  if (m1) return m1[1];
  const m2 = /^([A-Z]{3})\b/.exec(s);
  return m2 ? m2[1] : "";
}
function cityOnly(input: string) {
  if (!input) return "";
  const withoutIata = input.replace(/\([A-Z]{3}\)/g, " ").trim();
  const parts = withoutIata.split(/[,|-]+/).map((p) => p.trim()).filter(Boolean);
  const pick = parts.find((p) => !/\bairport\b/i.test(p)) || parts[0] || withoutIata;
  return pick;
}
function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Page() {
  // Locations
  const [originCode, setOriginCode] = React.useState("");
  const [destCode, setDestCode] = React.useState("");
  const [originDisplay, setOriginDisplay] = React.useState("");
  const [destDisplay, setDestDisplay] = React.useState("");

  // Dates / trip
  const [roundTrip, setRoundTrip] = React.useState(true);
  const [departDate, setDepartDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState("");

  // Pax
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [infants, setInfants] = React.useState(0);

  // Options
  const [cabin, setCabin] = React.useState<Cabin>("ECONOMY");
  const [currency, setCurrency] = React.useState("USD");
  const [includeHotel, setIncludeHotel] = React.useState(false);
  const [hotelCheckIn, setHotelCheckIn] = React.useState("");
  const [hotelCheckOut, setHotelCheckOut] = React.useState("");
  const [minHotelStar, setMinHotelStar] = React.useState(0);
  const [minBudget, setMinBudget] = React.useState<string | number>("");
  const [maxBudget, setMaxBudget] = React.useState<string | number>("");
  const [maxStops, setMaxStops] = React.useState<0 | 1 | 2>(2);
  const [refundable, setRefundable] = React.useState(false);
  const [greener, setGreener] = React.useState(false);
  const [sortBasis, setSortBasis] = React.useState<"flightOnly" | "bundle">("flightOnly");

  // Sorting
  const [sort, setSort] = React.useState<SortKey>("best");

  // Results & UX
  const [results, setResults] = React.useState<any[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Chips: Explore / Savor / Compare
  const [showExplore, setShowExplore] = React.useState(false);
  const [showSavor, setShowSavor] = React.useState(false);
  const [showCompare, setShowCompare] = React.useState(false);

  // Compare selection
  const [comparedIds, setComparedIds] = React.useState<string[]>([]);
  const onToggleCompare = (id: string) =>
    setComparedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Saved chip
  const [savedCount, setSavedCount] = React.useState(0);
  React.useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      setSavedCount(Array.isArray(arr) ? arr.length : 0);
    } catch {
      setSavedCount(0);
    }
  }, []);

  function swapOriginDest() {
    setOriginCode((oc) => {
      const dc = destCode;
      setDestCode(oc);
      return dc;
    });
    setOriginDisplay((od) => {
      const dd = destDisplay;
      setDestDisplay(od);
      return dd;
    });
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    setResults([]);
    setComparedIds([]);
    setShowExplore(false);
    setShowSavor(false);
    setShowCompare(false);

    try {
      const o = originCode || extractIATA(originDisplay);
      const d = destCode || extractIATA(destDisplay);
      if (!o || !d) throw new Error("Please select both origin and destination.");
      if (!departDate) throw new Error("Pick a departure date.");
      if (roundTrip && !returnDate) throw new Error("Pick a return date.");

      const payload: SearchPayload = {
        origin: o,
        destination: d,
        departDate,
        returnDate: roundTrip ? returnDate : undefined,
        roundTrip,
        passengers: adults + children + infants,
        passengersAdults: adults,
        passengersChildren: children,
        passengersInfants: infants,
        cabin,
        includeHotel,
        hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: minBudget === "" ? undefined : Number(minBudget),
        maxBudget: maxBudget === "" ? undefined : Number(maxBudget),
        currency,
        sort,
        maxStops,
        refundable,
        greener,
        sortBasis,
      };

      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Search failed.");

      const arr = Array.isArray(j?.results) ? j.results : [];
      const merged = arr.map((x: any, i: number) => ({
        ...x,
        id: x.id || `pkg-${i}`,
        destination: d,
        hotelCheckIn: payload.hotelCheckIn,
        hotelCheckOut: payload.hotelCheckOut,
        currency: payload.currency,
        roundTrip: payload.roundTrip,
        passengersAdults: adults,
        passengersChildren: children,
        passengersInfants: infants,
      }));

      setResults(merged);
      setHasSearched(true);
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  const destCity = cityOnly(destDisplay) || "Destination";

  // simple client sort (keep your own if backend sorts)
  const sorted = React.useMemo(() => {
    const arr = [...results];
    if (sort === "cheapest") {
      const price = (p: any) =>
        p.total_cost ??
        p.flight_total ??
        p?.flight?.price_usd ??
        p?.flight?.price_usd_converted ??
        Number.MAX_SAFE_INTEGER;
      arr.sort((a, b) => (price(a) as number) - (price(b) as number));
    }
    return arr;
  }, [results, sort]);

  const comparedPkgs = React.useMemo(
    () => sorted.filter((x) => comparedIds.includes(x.id)),
    [sorted, comparedIds]
  );

  // --- small styles to match your screenshot chips ---
  const chip = (active?: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: active ? "2px solid #22c55e" : "1px solid #cbd5e1",
    background: active ? "#f0fdf4" : "#fff",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  });

  return (
    <main style={{ display: "grid", gap: 16, padding: 12 }}>
      {/* Title */}
      <section>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Find your perfect trip</h1>
        <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap", color: "#334155", fontWeight: 600 }}>
          <span>Top-3 picks</span>
          <span>•</span>
          <span>Explore &amp; Savor your city guide</span>
          <span>•</span>
          <span>Compare flights in style</span>
        </div>
      </section>

      {/* Search form (layout mirrors your screenshot) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          display: "grid",
          gap: 14,
        }}
      >
        {/* Origin / Destination with swap */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 54px 1fr", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Origin</label>
            <AirportField
              id="origin"
              label="" // required by your component
              code={originCode}
              initialDisplay={originDisplay}
              onTextChange={setOriginDisplay}
              onChangeCode={(c, disp) => {
                setOriginCode(c);
                setOriginDisplay(disp);
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end" }} aria-hidden>
            <button
              type="button"
              title="Swap origin & destination"
              onClick={swapOriginDest}
              style={{
                height: 46,
                width: 46,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ⇄
            </button>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Destination</label>
            <AirportField
              id="destination"
              label="" // required by your component
              code={destCode}
              initialDisplay={destDisplay}
              onTextChange={setDestDisplay}
              onChangeCode={(c, disp) => {
                setDestCode(c);
                setDestDisplay(disp);
              }}
            />
          </div>
        </div>

        {/* Trip row */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "130px 1fr 1fr 1fr 1fr 1fr" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Trip</label>
            <div style={{ display: "inline-flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setRoundTrip(false)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: roundTrip ? "#fff" : "#e0f2fe",
                  fontWeight: 700,
                }}
              >
                One-way
              </button>
              <button
                type="button"
                onClick={() => setRoundTrip(true)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: roundTrip ? "#e0f2fe" : "#fff",
                  fontWeight: 700,
                }}
              >
                Round-trip
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Depart</label>
            <input
              type="date"
              min={today}
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Return</label>
            <input
              type="date"
              disabled={!roundTrip}
              min={departDate ? plusDays(departDate, 1) : plusDays(today, 1)}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Adults</label>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", gap: 6, alignItems: "center" }}>
              <button type="button" onClick={() => setAdults((v) => Math.max(1, v - 1))} style={{ height: 44, borderRadius: 10, border: "1px solid #e2e8f0" }}>−</button>
              <input readOnly value={adults} style={{ height: 44, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 10 }} />
              <button type="button" onClick={() => setAdults((v) => v + 1)} style={{ height: 44, borderRadius: 10, border: "1px solid #e2e8f0" }}>+</button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Children</label>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", gap: 6, alignItems: "center" }}>
              <button type="button" onClick={() => setChildren((v) => Math.max(0, v - 1))} style={{ height: 44, borderRadius: 10, border: "1px solid #e2e8f0" }}>−</button>
              <input readOnly value={children} style={{ height: 44, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 10 }} />
              <button type="button" onClick={() => setChildren((v) => v + 1)} style={{ height: 44, borderRadius: 10, border: "1px solid #e2e8f0" }}>+</button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Infants</label>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", gap: 6, alignItems: "center" }}>
              <button type="button" onClick={() => setInfants((v) => Math.max(0, v - 1))} style={{ height: 44, borderRadius: 10, border: "1px solid #e2e8f0" }}>−</button>
              <input readOnly value={infants} style={{ height: 44, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 10 }} />
              <button type="button" onClick={() => setInfants((v) => v + 1)} style={{ height: 44, borderRadius: 10, border: "1px solid #e2e8f0" }}>+</button>
            </div>
          </div>
        </div>

        {/* Cabin / Stops / Flags */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Cabin</label>
            <select value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)} style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Stops</label>
            <select value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value) as 0 | 1 | 2)} style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}>
              <option value={0}>Nonstop</option>
              <option value={1}>1 stop</option>
              <option value={2}>More than 1 stop</option>
            </select>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, color: "#0f172a" }}>
            <input type="checkbox" checked={refundable} onChange={(e) => setRefundable(e.target.checked)} />
            Refundable
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, color: "#0f172a" }}>
            <input type="checkbox" checked={greener} onChange={(e) => setGreener(e.target.checked)} />
            Greener
          </label>
        </div>

        {/* Currency / Budget */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}>
              {["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "SGD", "AED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Min budget</label>
            <input
              type="number"
              placeholder="min"
              min={0}
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Max budget</label>
            <input
              type="number"
              placeholder="max"
              min={0}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            />
          </div>
        </div>

        {/* Include hotel */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, color: "#0f172a" }}>
            <input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
            Include hotel
          </label>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Hotel check-in</label>
            <input
              type="date"
              disabled={!includeHotel}
              min={departDate || today}
              value={hotelCheckIn}
              onChange={(e) => setHotelCheckIn(e.target.value)}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Hotel check-out</label>
            <input
              type="date"
              disabled={!includeHotel}
              min={hotelCheckIn ? plusDays(hotelCheckIn, 1) : departDate ? plusDays(departDate, 1) : plusDays(today, 1)}
              value={hotelCheckOut}
              onChange={(e) => setHotelCheckOut(e.target.value)}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a" }}>Min hotel stars</label>
            <select
              disabled={!includeHotel}
              value={minHotelStar}
              onChange={(e) => setMinHotelStar(Number(e.target.value))}
              style={{ height: 44, width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 10px" }}
            >
              <option value={0}>Any</option>
              <option value={3}>3★+</option>
              <option value={4}>4★+</option>
              <option value={5}>5★</option>
            </select>
          </div>
        </div>

        {/* Sort basis + Search/Reset */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Sort by (basis)</label>
            <div style={{ display: "inline-flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setSortBasis("flightOnly")}
                style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 12px", background: sortBasis === "flightOnly" ? "#e0f2fe" : "#fff", fontWeight: 700 }}
              >
                Flight only
              </button>
              <button
                type="button"
                onClick={() => setSortBasis("bundle")}
                style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 12px", background: sortBasis === "bundle" ? "#e0f2fe" : "#fff", fontWeight: 700 }}
              >
                Bundle total
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={loading} style={{ height: 46, minWidth: 130, border: "1px solid #93c5fd", borderRadius: 10, background: "linear-gradient(180deg,#f0fbff,#e6f7ff)", fontWeight: 700 }}>
              {loading ? "Searching…" : "Search"}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ height: 46, minWidth: 100, border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", fontWeight: 700 }}
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Chips row (like your screenshot) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          style={chip(showExplore)}
          onClick={() => hasSearched && setShowExplore((v) => !v)}
          disabled={!hasSearched}
          title={!hasSearched ? "Run a search to enable" : "Toggle Explore"}
        >
          🧭 Explore - {cityOnly(destDisplay) || "Destination"}
        </button>

        <button
          type="button"
          style={chip(showSavor)}
          onClick={() => hasSearched && setShowSavor((v) => !v)}
          disabled={!hasSearched}
          title={!hasSearched ? "Run a search to enable" : "Toggle Savor"}
        >
          🧭‍➡️🍽️ Savor - {cityOnly(destDisplay) || "Destination"}
        </button>

        <button
          type="button"
          style={chip(showCompare || comparedIds.length > 0)}
          onClick={() => setShowCompare((v) => !v)}
          title="Toggle Compare panel"
        >
          🧮 Compare {comparedIds.length ? `(${comparedIds.length})` : ""}
        </button>

        {/* sort pills like screenshot */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {(["best", "cheapest", "fastest", "flexible"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #cbd5e1",
                background: sort === k ? "#eef2ff" : "#fff",
                fontWeight: 700,
              }}
            >
              {k === "best" ? "Best" : k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
          <button type="button" style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#eef9ff", fontWeight: 700 }}>
            Top-3
          </button>
          <button type="button" style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", fontWeight: 700 }} onClick={() => window.print()}>
            Print
          </button>
          <span style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", fontWeight: 700 }}>
            Saved <span style={{ opacity: 0.7 }}>{savedCount}</span>
          </span>
        </div>
      </div>

      {/* EXPLORE panel */}
      {hasSearched && showExplore && (
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
          <SavorExploreLinks category="explore" city={cityOnly(destDisplay) || undefined} limit={4} title="Explore" />
        </section>
      )}
      {/* SAVOR panel */}
      {hasSearched && showSavor && (
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
          <SavorExploreLinks category="savor" city={cityOnly(destDisplay) || undefined} limit={4} title="Savor" when={new Date().toISOString()} />
        </section>
      )}

      {/* COMPARE panel (works even if chips collapsed) */}
      {showCompare && (
        <section
          aria-label="Compare selected results"
          style={{ border: "2px solid #22c55e", borderRadius: 14, padding: 12, background: "#f0fdf4", display: "grid", gap: 12 }}
        >
          <div style={{ fontWeight: 800, color: "#064e3b" }}>🆚 Compare {comparedIds.length ? `(${comparedIds.length})` : ""}</div>

          {comparedIds.length < 2 ? (
            <div style={{ color: "#065f46", fontWeight: 600 }}>
              Tip: click <strong>“➕ Compare”</strong> on two results to see them side-by-side.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720, background: "#fff", border: "1px solid #d1fae5" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Field</th>
                    {comparedPkgs.map((p: any, i: number) => {
                      const from = (p.origin || p.flight?.segments_out?.[0]?.from || "").toUpperCase();
                      const to = (p.destination || p.flight?.segments_out?.slice(-1)?.[0]?.to || "").toUpperCase();
                      return (
                        <th key={i} style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                          Option {i + 1} — {from}→{to}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>Airline</td>
                    {comparedPkgs.map((p: any, i: number) => (
                      <td key={i} style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                        {p.flight?.carrier_name || p.flight?.carrier || p.airline || "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>Outbound duration</td>
                    {comparedPkgs.map((p: any, i: number) => {
                      const segs = p.flight?.segments_out || [];
                      const mins = segs.reduce((t: number, s: any) => t + (Number(s?.duration_minutes) || 0), 0);
                      const h = Math.floor(mins / 60), m = mins % 60;
                      return (
                        <td key={i} style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                          {mins ? `${h}h ${m}m` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>Price (basis)</td>
                    {comparedPkgs.map((p: any, i: number) => (
                      <td key={i} style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                        {(p.currency || "USD") + " " + (p.total_cost ?? p.flight_total ?? p.flight?.price_usd_converted ?? p.flight?.price_usd ?? "—")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 12px" }}>Stops</td>
                    {comparedPkgs.map((p: any, i: number) => {
                      const segs = p.flight?.segments_out || [];
                      return <td key={i} style={{ padding: "10px 12px" }}>{Math.max(0, segs.length - 1)}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Error */}
      {error && <div role="alert" style={{ color: "#b91c1c", fontWeight: 700 }}>⚠ {error}</div>}

      {/* Results list (ResultCard handles layovers + hotels; also exposes “➕ Compare”) */}
      <section style={{ display: "grid", gap: 16 }}>
        {sorted.map((pkg, i) => (
          <ResultCard
            key={pkg.id || i}
            pkg={pkg}
            index={i}
            comparedIds={comparedIds}
            onToggleCompare={onToggleCompare}
            showHotel={includeHotel}
          />
        ))}
      </section>
    </main>
  );
}
