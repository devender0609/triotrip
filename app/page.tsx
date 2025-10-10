"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";

type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function parseIntSafe(s: any, d = 0) {
  const n = Number(s);
  return Number.isFinite(n) ? n : d;
}

export default function Page() {
  // ---------- state ----------
  const [originCode, setOriginCode] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState("");
  const [destDisplay, setDestDisplay] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [maxStops, setMaxStops] = useState<number>(2);
  const [currency, setCurrency] = useState("USD");
  const [refundable, setRefundable] = useState(false);
  const [greener, setGreener] = useState(false);

  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);

  const [compareMode, setCompareMode] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">("flightOnly");
  const [showAll, setShowAll] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hotelWarning, setHotelWarning] = useState<string | null>(null);

  const [savedCount, setSavedCount] = useState(0);
  const [searchKey, setSearchKey] = useState(0);

  // ---------- effects ----------
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      setSavedCount(Array.isArray(saved) ? saved.length : 0);
    } catch {}
  }, []);

  // keep children ages arr sized
  useEffect(() => {
    setChildrenAges((prev) => {
      const next = prev.slice(0, children);
      while (next.length < children) next.push(8);
      return next;
    });
  }, [children]);

  // if one-way, clear return date
  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);

  // >>> Hotels: do NOT auto-populate dates; clear when toggled OFF <<<
  useEffect(() => {
    if (!includeHotel) {
      setHotelCheckIn("");
      setHotelCheckOut("");
    }
  }, [includeHotel]);

  function swapOriginDest() {
    setOriginCode((oc) => { const dc = destCode; setDestCode(oc); return dc; });
    setOriginDisplay((od) => { const dd = destDisplay; setDestDisplay(od); return dd; });
  }

  // ---------- validations ----------
  const todayLocal = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  function validate() {
    if (!(originCode || originDisplay)) throw new Error("Please choose origin.");
    if (!(destCode || destDisplay)) throw new Error("Please choose destination.");
    if ((originCode || originDisplay) && (destCode || destDisplay)) {
      const o = originCode || extractIATA(originDisplay);
      const d = destCode || extractIATA(destDisplay);
      if (o === d) throw new Error("Origin and destination cannot be the same.");
    }
    if (!departDate) throw new Error("Please choose a departure date.");
    if (roundTrip && !returnDate) throw new Error("Please choose a return date or switch to One Way.");
    if (Number(minBudget) < 0) throw new Error("Min budget cannot be negative.");
    if (maxBudget !== "" && Number(maxBudget) < 0) throw new Error("Max budget cannot be negative.");
    if (Number(minBudget) !== 0 && Number(maxBudget) !== 0 && Number(minBudget) > Number(maxBudget)) {
      throw new Error("Min budget cannot exceed max budget.");
    }
    if (adults + children + infants <= 0) throw new Error("Please select at least 1 passenger.");
  }

  function extractIATA(display: string): string {
    const s = String(display || "").toUpperCase().trim();
    let m = /\(([A-Z]{3})\)/.exec(s);
    if (m) return m[1];
    m = /^([A-Z]{3})\b/.exec(s);
    if (m) return m[1];
    return "";
  }

  // ---------- submit ----------
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHotelWarning(null);
    try {
      validate();
    } catch (err: any) {
      setError(err?.message || "Please check your inputs.");
      return;
    }

    setLoading(true);
    setResults(null);

    const payload = {
      origin: originCode || extractIATA(originDisplay),
      destination: destCode || extractIATA(destDisplay),
      roundTrip,
      departDate,
      returnDate: roundTrip ? returnDate : "",
      passengers: adults + children + infants,
      passengersAdults: adults,
      passengersChildren: children,
      passengersInfants: infants,
      childrenAges,
      cabin,
      refundable,
      greener,
      currency,
      minBudget: minBudget !== "" ? Number(minBudget) : undefined,
      maxBudget: maxBudget !== "" ? Number(maxBudget) : undefined,
      maxStops,
      includeHotel,
      hotelCheckIn: includeHotel ? hotelCheckIn : "",
      hotelCheckOut: includeHotel ? hotelCheckOut : "",
      minHotelStar,
      sort,
      sortBasis,
    };

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const json = await res.json();
      if (!Array.isArray(json?.results)) throw new Error("Unexpected response.");
      // preserve the user selections on each result for link deep-fills
      const withCtx = json.results.map((r: any) => ({ ...r, ...payload }));
      setResults(withCtx);
      setSearchKey((k) => k + 1);
      if (includeHotel && (!hotelCheckIn || !hotelCheckOut)) {
        setHotelWarning("Hotel is selected but check-in/out dates are not set. Booking sites will ask for dates.");
      }
    } catch (err: any) {
      setError(err?.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- helpers ----------
  const chip: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 900,
    fontSize: 14,
  };
  const chipActive: React.CSSProperties = {
    borderColor: "#0ea5e9",
    boxShadow: "0 0 0 2px rgba(14,165,233,.15) inset",
  };
  const primaryBtn: React.CSSProperties = {
    height: 46,
    padding: "0 18px",
    border: "none",
    fontWeight: 900,
    color: "#fff",
    background: "linear-gradient(90deg,#06b6d4,#0ea5e9)",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(2,6,23,.25)",
    lineHeight: 1,
    whiteSpace: "nowrap",
    cursor: "pointer",
  };
  const secondaryBtn: React.CSSProperties = {
    height: 46,
    padding: "0 16px",
    fontWeight: 800,
    background: "#fff",
    border: "2px solid #7dd3fc",
    color: "#0369a1",
    borderRadius: 12,
    cursor: "pointer",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const segBase: React.CSSProperties = {
    height: 40,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };
  const segStyle = (active: boolean): React.CSSProperties =>
    active
      ? { ...segBase, background: "linear-gradient(90deg,#06b6d4,#0ea5e9)", color: "#fff", border: "none" }
      : segBase;

  // ---------- UI ----------
  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      {/* HERO */}
      <section>
        <h1 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 32, letterSpacing: "-0.02em" }}>
          Find your Top-3 travel picks
        </h1>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Smarter results, fewer tabs. Book with your preferred sites pre-filled.
        </p>
      </section>

      {/* FORM */}
      <form onSubmit={onSubmit} style={s.panel}>
        {/* Row 1: From/To + dates */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          <div>
            <label style={s.label}>From</label>
            <AirportField
              id="from"
              label=""
              code={originCode}
              initialDisplay={originDisplay}
              onTextChange={setOriginDisplay}
              onChangeCode={(code, display) => { setOriginCode(code); setOriginDisplay(display); }}
            />
          </div>
          <div>
            <label style={s.label}>To</label>
            <AirportField
              id="to"
              label=""
              code={destCode}
              initialDisplay={destDisplay}
              onTextChange={setDestDisplay}
              onChangeCode={(code, display) => { setDestCode(code); setDestDisplay(display); }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" title="Swap" onClick={swapOriginDest} style={s.swapBtn}>⇆</button>
            <div style={{ minWidth: 170 }}>
              <label style={s.label}>Depart</label>
              <input
                type="date"
                style={s.input}
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                min={todayLocal}
                max={roundTrip && returnDate ? returnDate : undefined}
              />
            </div>
            <div style={{ minWidth: 170 }}>
              <label style={s.label}>
                Return
                <span style={{ opacity: 0.6, marginLeft: 6 }}>(or switch to one-way)</span>
              </label>
              <input
                type="date"
                style={{ ...s.input, opacity: roundTrip ? 1 : 0.5 }}
                value={roundTrip ? returnDate : ""}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departDate || todayLocal}
                disabled={!roundTrip}
              />
            </div>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" style={segStyle(roundTrip)} onClick={() => setRoundTrip(true)}>Round trip</button>
              <button type="button" style={segStyle(!roundTrip)} onClick={() => setRoundTrip(false)}>One way</button>
            </div>
          </div>
        </div>

        {/* Row 2: Pax + cabin + stops + flags */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          <div>
            <label style={s.label}>Passengers</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <NumberInput label="Adults" value={adults} onChange={(n) => setAdults(clamp(n, 1, 9))} />
              <NumberInput label="Children" value={children} onChange={(n) => setChildren(clamp(n, 0, 8))} />
              <NumberInput label="Infants" value={infants} onChange={(n) => setInfants(clamp(n, 0, 4))} />
            </div>

            {children > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {childrenAges.map((age, i) => (
                  <NumberInput key={i} label={`Child ${i + 1} age`} value={age} onChange={(n) => {
                    setChildrenAges((prev) => {
                      const next = prev.slice();
                      next[i] = clamp(n, 0, 17);
                      return next;
                    });
                  }} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={s.label}>Class</label>
            <select value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)} style={s.select}>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>

            <div style={{ marginTop: 8 }}>
              <label style={s.label}>Max stops</label>
              <select value={maxStops} onChange={(e) => setMaxStops(parseIntSafe(e.target.value, 2))} style={s.select}>
                <option value={0}>Nonstop only</option>
                <option value={1}>Up to 1 stop</option>
                <option value={2}>Up to 2 stops</option>
              </select>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={refundable} onChange={(e) => setRefundable(e.target.checked)} />
                Refundable
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={greener} onChange={(e) => setGreener(e.target.checked)} />
                Greener first
              </label>
            </div>
          </div>

          <div>
            <label style={s.label}>Budget & currency</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder="Min"
                style={s.input}
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                min={0}
              />
              <input
                type="number"
                placeholder="Max"
                style={s.input}
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                min={0}
              />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={s.select}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>AUD</option><option>INR</option><option>JPY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 3: Hotels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={includeHotel}
                onChange={(e) => setIncludeHotel(e.target.checked)}
              />
              Include hotel
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ minWidth: 170 }}>
              <label style={s.label}>Check-in</label>
              <input
                type="date"
                style={s.input}
                value={hotelCheckIn}
                onChange={(e) => setHotelCheckIn(e.target.value)}
                placeholder="mm/dd/yyyy"
                disabled={!includeHotel}
              />
            </div>
            <div style={{ minWidth: 170 }}>
              <label style={s.label}>Check-out</label>
              <input
                type="date"
                style={s.input}
                value={hotelCheckOut}
                onChange={(e) => setHotelCheckOut(e.target.value)}
                placeholder="mm/dd/yyyy"
                disabled={!includeHotel}
              />
            </div>
          </div>

          <div>
            <label style={s.label}>Min hotel stars</label>
            <select
              value={minHotelStar}
              onChange={(e) => setMinHotelStar(parseIntSafe(e.target.value, 0))}
              style={s.select}
              disabled={!includeHotel}
            >
              <option value={0}>Any</option>
              <option value={3}>3★+</option>
              <option value={4}>4★+</option>
              <option value={5}>5★</option>
            </select>
          </div>
        </div>

        {/* Row 4: Sort basis */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800 }}>Price basis:</span>
          <div style={{ display: "inline-flex", gap: 6 }}>
            <button type="button" style={segStyle(sortBasis === "flightOnly")} onClick={() => setSortBasis("flightOnly")}>Flight only</button>
            <button type="button" style={segStyle(sortBasis === "bundle")} onClick={() => setSortBasis("bundle")}>Bundle total</button>
          </div>
        </div>

        {/* Submit row */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" style={primaryBtn}>{loading ? "Searching…" : "Search"}</button>
          <button type="button" style={{ ...secondaryBtn, marginLeft: 10 }} onClick={() => window.location.reload()}>
            Reset
          </button>
        </div>
      </form>

      {/* TOOLBAR */}
      <div style={s.toolbar}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} role="tablist" aria-label="Sort">
          {(["best", "cheapest", "fastest", "flexible"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={sort === k}
              style={{ ...chip, ...(sort === k ? chipActive : {}) }}
              onClick={() => setSort(k)}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn ghost" type="button" onClick={() => setCompareMode((v) => !v)}>
            {compareMode ? "Exit Compare" : "Compare"}
          </button>
          <button className="btn ghost" type="button" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show Top-3" : "Show All"}
          </button>
          <span style={{ opacity: 0.6 }}>
            Saved: <strong>{savedCount}</strong>
          </span>
        </div>
      </div>

      {hotelWarning && (
        <div className="compare-hint" style={{ maxWidth: 760 }}>
          {hotelWarning}
        </div>
      )}

      {/* RESULTS */}
      <section style={{ display: "grid", gap: 12 }}>
        {error && (
          <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12 }}>
            {String(error)}
          </div>
        )}

        {!loading && !error && (!results || results.length === 0) && (
          <div style={{ opacity: 0.7 }}>No results yet — try a search.</div>
        )}

        {loading && <div>Loading…</div>}

        {Array.isArray(results) && results.length > 0 && (
          <>
            {results
              .slice(0, showAll ? results.length : 3)
              .map((pkg, i) => (
                <ResultCard
                  key={pkg.id || i}
                  pkg={pkg}
                  index={i}
                  currency={currency}
                  pax={adults + children + infants}
                  comparedIds={compareMode ? comparedIds : undefined}
                  onToggleCompare={compareMode ? toggleCompare : undefined}
                  onSavedChangeGlobal={(count) => setSavedCount(count)}
                  showHotel={includeHotel ? true : undefined}
                />
              ))}
          </>
        )}
      </section>
    </div>
  );

  // ---------- compare helpers ----------
  function toggleCompare(id: string) {
    setComparedIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }
}

// ---------- styles ----------
const s = {
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 6px 18px rgba(2,6,23,.06)",
    padding: 14,
    display: "grid",
    gap: 12,
  } as React.CSSProperties,
  label: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.7,
    marginBottom: 4,
  } as React.CSSProperties,
  input: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontWeight: 800,
  } as React.CSSProperties,
  select: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontWeight: 800,
  } as React.CSSProperties,
  swapBtn: {
    height: 40,
    width: 40,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  } as React.CSSProperties,
};
