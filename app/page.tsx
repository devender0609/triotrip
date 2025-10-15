// app/page.tsx
"use client";
export const dynamic = "force-dynamic";

import React from "react";
import ResultCard from "@/components/ResultCard";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";
import AirportField from "@/components/AirportField";     // keep if you already have it
import SavedChip from "@/components/SavedChip";           // optional; remove if not used

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
  currency: string;
  sort: SortKey;
};

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
  const [includeHotel, setIncludeHotel] = React.useState(true);
  const [hotelCheckIn, setHotelCheckIn] = React.useState("");
  const [hotelCheckOut, setHotelCheckOut] = React.useState("");

  // Sorting
  const [sort, setSort] = React.useState<SortKey>("best");

  // Results
  const [results, setResults] = React.useState<any[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Compare
  const [comparedIds, setComparedIds] = React.useState<string[]>([]);
  const onToggleCompare = (id: string) =>
    setComparedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Saved chip (optional)
  const [savedCount, setSavedCount] = React.useState(0);
  React.useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      setSavedCount(Array.isArray(arr) ? arr.length : 0);
    } catch {
      setSavedCount(0);
    }
  }, []);

  // Search
  async function runSearch() {
    setLoading(true);
    setError(null);
    setResults([]);
    setComparedIds([]);

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
        currency,
        sort,
      };

      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Search failed.");
      const list = Array.isArray(j?.results) ? j.results : [];
      // carry some context for hotel fallbacks & compare
      const merged = list.map((x: any, i: number) => ({
        ...x,
        id: x.id || `pkg-${i}`,
        destination: d,
        hotelCheckIn: payload.hotelCheckIn,
        hotelCheckOut: payload.hotelCheckOut,
        currency: payload.currency,
        roundTrip: payload.roundTrip,
      }));
      setResults(merged);
      setHasSearched(true);
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  // Derived labels for Explore/Savor tabs
  const city = cityOnly(destDisplay) || undefined;

  // Simple sort example (leave your own if you already sort on backend)
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
    // "best", "fastest", "flexible" can use your existing logic; keeping simple here
    return arr;
  }, [results, sort]);

  const compared = React.useMemo(
    () => sorted.filter((x) => comparedIds.includes(x.id)),
    [sorted, comparedIds]
  );

  return (
    <main style={{ display: "grid", gap: 16, padding: 12 }}>
      {/* Header */}
      <section>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Find your perfect trip</h1>
        <p style={{ margin: "6px 0 0", color: "#334155" }}>Top-3 results, Explore/Savor guides, and quick Compare 🆚</p>
      </section>

      {/* Search form (minimal) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Origin</label>
            <AirportField
              id="origin"
              code={originCode}
              initialDisplay={originDisplay}
              onTextChange={setOriginDisplay}
              onChangeCode={(c, disp) => {
                setOriginCode(c);
                setOriginDisplay(disp);
              }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Destination</label>
            <AirportField
              id="destination"
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

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "140px 1fr 1fr 120px 120px 120px" }}>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Trip</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setRoundTrip(false)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
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
                  borderRadius: 8,
                  padding: "8px 10px",
                  background: roundTrip ? "#e0f2fe" : "#fff",
                  fontWeight: 700,
                }}
              >
                Round-trip
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Depart</label>
            <input
              type="date"
              min={today}
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Return</label>
            <input
              type="date"
              disabled={!roundTrip}
              min={departDate || today}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Adults</label>
            <input
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Children</label>
            <input
              type="number"
              min={0}
              value={children}
              onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Infants</label>
            <input
              type="number"
              min={0}
              value={infants}
              onChange={(e) => setInfants(Math.max(0, Number(e.target.value) || 0))}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Cabin</label>
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value as Cabin)}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            >
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: "#0f172a" }}>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
            >
              {["USD","EUR","GBP","INR","CAD","AUD","JPY","SGD","AED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600, color: "#0f172a" }}>
              <input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
              Include hotel
            </label>
          </div>
          <div />
        </div>

        {includeHotel && (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label style={{ fontWeight: 600, color: "#0f172a" }}>Hotel check-in</label>
              <input
                type="date"
                min={departDate || today}
                value={hotelCheckIn}
                onChange={(e) => setHotelCheckIn(e.target.value)}
                style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#0f172a" }}>Hotel check-out</label>
              <input
                type="date"
                min={hotelCheckIn || departDate || today}
                value={hotelCheckOut}
                onChange={(e) => setHotelCheckOut(e.target.value)}
                style={{ height: 42, width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setSort("best")}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", background: sort === "best" ? "#eef2ff" : "#fff" }}
            >
              Best
            </button>
            <button
              type="button"
              onClick={() => setSort("cheapest")}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", background: sort === "cheapest" ? "#eef2ff" : "#fff" }}
            >
              Cheapest
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {typeof SavedChip !== "undefined" && <SavedChip count={savedCount} />}
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 42,
                minWidth: 140,
                border: "1px solid #93c5fd",
                borderRadius: 10,
                background: "linear-gradient(180deg,#f0fbff,#e6f7ff)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </form>

      {/* Tabs appear ONLY after search; each tab toggles to show/hide its panel */}
      {hasSearched && (
        <ExploreSavorTabs
          hasSearched={true}
          // pass either countryCode or countryName if you have them
          countryName={undefined}
          city={city}
        />
      )}

      {/* Compare panel — shows as soon as you add items (with emoji) */}
      {comparedIds.length > 0 && (
        <section
          aria-label="Compare selected results"
          style={{
            border: "2px solid #22c55e",
            borderRadius: 14,
            padding: 12,
            background: "#f0fdf4",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: "#064e3b" }}>🆚 Compare ({comparedIds.length})</div>
          {compared.map((pkg, i) => (
            <ResultCard
              key={`cmp-${pkg.id || i}`}
              pkg={pkg}
              index={i}
              comparedIds={comparedIds}
              onToggleCompare={onToggleCompare}
              showHotel={includeHotel}
              large={false}
            />
          ))}
        </section>
      )}

      {/* Results */}
      {error && <div role="alert" style={{ color: "#b91c1c", fontWeight: 700 }}>⚠ {error}</div>}
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
