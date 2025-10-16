"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "@/components/AirportField";
import ResultCard from "@/components/ResultCard";
import ComparePanel from "@/components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";

/* -------- helpers -------- */
const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function extractIATA(display: string) {
  const s = String(display || "").toUpperCase().trim();
  let m = /\(([A-Z]{3})\)/.exec(s);
  if (m) return m[1];
  m = /^([A-Z]{3})\b/.exec(s);
  if (m) return m[1];
  return "";
}
function extractCityOnly(input: string) {
  if (!input) return "";
  let s = input.replace(/\([A-Z]{3}\)/g, " ").replace(/—/g, "-").replace(/\s{2,}/g, " ").trim();
  const parts = s.split(/[,/|-]+/).map((p) => p.trim()).filter(Boolean);
  const filtered = parts.filter((p) => !/\bairport\b/i.test(p) && !/^[A-Z]{3}$/.test(p));
  const nice = filtered.find((p) => /[a-z]/i.test(p)) || filtered[0] || s;
  return nice.replace(/\b[A-Z]{2}\b$/, "").trim();
}
function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* -------- types -------- */
type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest";

/* -------- component -------- */
export default function Page() {
  // airports
  const [originCode, setOriginCode] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState("");
  const [destDisplay, setDestDisplay] = useState("");

  // trip basics
  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // pax
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  // currency (from TopBar)
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    try {
      const s = localStorage.getItem("triptrio:currency");
      if (s) setCurrency(s);
    } catch {}
    const handler = (e: any) => e?.detail && setCurrency(e.detail);
    window.addEventListener("triptrio:currency:changed", handler as any);
    return () => window.removeEventListener("triptrio:currency:changed", handler as any);
  }, []);

  // filters
  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">("flightOnly");

  // hotel
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);

  // tabs/compare
  const [tabsVisible, setTabsVisible] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [savorOpen, setSavorOpen] = useState(false);
  const [miscOpen, setMiscOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  useEffect(() => { if (!compareMode) setComparedIds([]); }, [compareMode]);

  // state
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hotelWarning, setHotelWarning] = useState<string | null>(null);

  useEffect(() => {
    setChildrenAges((prev) => {
      const next = prev.slice(0, children);
      while (next.length < children) next.push(8);
      return next;
    });
  }, [children]);
  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);
  useEffect(() => {
    if (!includeHotel) { setHotelCheckIn(""); setHotelCheckOut(""); }
  }, [includeHotel]);

  function swapOriginDest() {
    setOriginCode((oc) => { const dc = destCode; setDestCode(oc); return dc; });
    setOriginDisplay((od) => { const dd = destDisplay; setDestDisplay(od); return dd; });
  }

  async function runSearch() {
    setLoading(true);
    setError(null); setHotelWarning(null); setResults(null);
    try {
      const origin = originCode || extractIATA(originDisplay);
      const destination = destCode || extractIATA(destDisplay);
      if (!origin || !destination) throw new Error("Please select origin and destination.");
      if (!departDate) throw new Error("Please pick a departure date.");
      if (departDate < todayLocal) throw new Error("Departure date can’t be in the past.");
      if (adults < 1) throw new Error("At least 1 adult is required.");
      if (roundTrip) {
        if (!returnDate) throw new Error("Please pick a return date.");
        if (returnDate <= departDate) throw new Error("Return date must be after departure.");
      }
      if (includeHotel) {
        if (!hotelCheckIn || !hotelCheckOut) throw new Error("Please set hotel check-in and check-out.");
        if (hotelCheckOut <= hotelCheckIn) throw new Error("Hotel check-out must be after check-in.");
      }
      if (minBudget !== "" && minBudget < 0) throw new Error("Min budget cannot be negative.");
      if (maxBudget !== "" && maxBudget < 0) throw new Error("Max budget cannot be negative.");
      if (typeof minBudget === "number" && typeof maxBudget === "number" && minBudget > maxBudget)
        throw new Error("Min budget cannot be greater than max budget.");

      const payload = {
        origin, destination, departDate, returnDate: roundTrip ? returnDate : undefined,
        roundTrip, passengers: adults + children + infants,
        passengersAdults: adults, passengersChildren: children, passengersInfants: infants,
        passengersChildrenAges: children ? childrenAges : undefined,
        cabin, includeHotel, hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: minBudget === "" ? undefined : minBudget,
        maxBudget: maxBudget === "" ? undefined : maxBudget,
        currency, sort, maxStops, sortBasis,
      };

      const r = await fetch(`/api/search`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Search failed");

      setHotelWarning(j?.hotelWarning || null);
      const merged = (Array.isArray(j.results) ? j.results : []).map((res: any) => ({ ...res, ...payload }));
      setResults(merged);

      setTabsVisible(true);
      setExploreOpen(false); setSavorOpen(false); setMiscOpen(false);
      setCompareMode(false); setComparedIds([]);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally { setLoading(false); }
  }

  /* sort + derived */
  const sortedResults = useMemo(() => {
    if (!results) return null;
    const items = [...results];
    const flightPrice = (p: any) =>
      num(p.flight_total) ?? num(p.total_cost_flight) ??
      num(p.flight?.price_usd_converted) ?? num(p.flight?.price_usd) ??
      num(p.total_cost) ?? 9e15;
    const bundleTotal = (p: any) =>
      num(p.total_cost) ?? (num(p.flight_total) ?? flightPrice(p)) + (num(p.hotel_total) ?? 0);
    const outDur = (p: any) => {
      const segs = p.flight?.segments_out || p.flight?.segments || [];
      const sum = segs.reduce((t: number, s: any) => t + (Number(s?.duration_minutes) || 0), 0);
      return Number.isFinite(sum) ? sum : 9e9;
    };
    const basisValue = (p: any) => (sortBasis === "bundle" ? bundleTotal(p) : flightPrice(p));
    if (sort === "cheapest") items.sort((a, b) => basisValue(a)! - basisValue(b)!);
    else if (sort === "fastest") items.sort((a, b) => outDur(a)! - outDur(b)!);
    else items.sort((a, b) => (basisValue(a)! - basisValue(b)!) || (outDur(a)! - outDur(b)!));
    return items;
  }, [results, sort, sortBasis]);

  const shownResults = useMemo(
    () => (!sortedResults ? null : showAll ? sortedResults : sortedResults.slice(0, 3)),
    [sortedResults, showAll]
  );

  /* ---- Compare selection (stable IDs) ---- */
  const idsForSorted = useMemo(
    () => (sortedResults || []).map((p, i) => p.id || `pkg-${i}`),
    [sortedResults]
  );
  function toggleCompare(id: string) {
    setComparedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]).slice(0, 3));
  }
  const comparedPkgs = useMemo(() => {
    if (!sortedResults) return [];
    return sortedResults.filter((_, i) => comparedIds.includes(idsForSorted[i]));
  }, [sortedResults, comparedIds, idsForSorted]);

  const destCity = useMemo(() => extractCityOnly(destDisplay) || "Destination", [destDisplay]);

  /* -------- UI -------- */
  return (
    <div className="main-wrap" style={{ padding: 12, display: "grid", gap: 16 }}>
      <section>
        <h1 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 32, letterSpacing: "-0.02em" }}>
          Find your perfect trip
        </h1>
        <p style={{ margin: 0, color: "#334155", fontWeight: 600, fontSize: 15.5 }}>
          <span className="pill-inline">Top-3 picks</span>
          <span style={{ opacity: 0.6, margin: "0 6px" }}>•</span>
          Explore • Savor • Misc guides
          <span style={{ opacity: 0.6, margin: "0 6px" }}>•</span>
          Compare flights in style
        </p>
      </section>

      {/* Search */}
      <form
        className="card"
        onSubmit={(e) => { e.preventDefault(); runSearch(); }}
        style={{ display: "grid", gap: 14 }}
      >
        {/* origin/dest */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 54px 1fr", alignItems: "end" }}>
          <div>
            <label className="lbl">Origin</label>
            <AirportField
              id="origin"
              label=""
              code={originCode}
              initialDisplay={originDisplay}
              onTextChange={setOriginDisplay}
              onChangeCode={(c, d) => { setOriginCode(c); setOriginDisplay(d); }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
            <button type="button" title="Swap origin & destination" onClick={swapOriginDest} className="segbtn">⇄</button>
          </div>
          <div>
            <label className="lbl">Destination</label>
            <AirportField
              id="destination"
              label=""
              code={destCode}
              initialDisplay={destDisplay}
              onTextChange={setDestDisplay}
              onChangeCode={(c, d) => { setDestCode(c); setDestDisplay(d); }}
            />
          </div>
        </div>

        {/* dates + pax */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "170px 1fr 1fr 1fr 1fr 1fr" }}>
          <div style={{ minWidth: 170 }}>
            <label className="lbl">Trip</label>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className={`segbtn${!roundTrip ? " segbtn--on" : ""}`} onClick={() => setRoundTrip(false)}>One-way</button>
              <button type="button" className={`segbtn${roundTrip ? " segbtn--on" : ""}`}  onClick={() => setRoundTrip(true)}>Round-trip</button>
            </div>
          </div>
          <div>
            <label className="lbl">Depart</label>
            <input type="date" className="in" value={departDate} onChange={(e) => setDepartDate(e.target.value)}
                   min={todayLocal} max={roundTrip && returnDate ? returnDate : undefined}/>
          </div>
          <div>
            <label className="lbl">Return</label>
            <input type="date" className="in" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                   disabled={!roundTrip} min={departDate ? plusDays(departDate, 1) : plusDays(todayLocal, 1)} />
          </div>
          {/* Adults */}
          <div>
            <label className="lbl">Adults</label>
            <div className="stepper">
              <button type="button" onClick={() => setAdults((v) => Math.max(1, v - 1))}>−</button>
              <input className="no-spin in" type="number" readOnly value={adults} />
              <button type="button" onClick={() => setAdults((v) => v + 1)}>+</button>
            </div>
          </div>
          <div>
            <label className="lbl">Children</label>
            <div className="stepper">
              <button type="button" onClick={() => setChildren((v) => Math.max(0, v - 1))}>−</button>
              <input className="no-spin in" type="number" readOnly value={children} />
              <button type="button" onClick={() => setChildren((v) => v + 1)}>+</button>
            </div>
          </div>
          <div>
            <label className="lbl">Infants</label>
            <div className="stepper">
              <button type="button" onClick={() => setInfants((v) => Math.max(0, v - 1))}>−</button>
              <input className="no-spin in" type="number" readOnly value={infants} />
              <button type="button" onClick={() => setInfants((v) => v + 1)}>+</button>
            </div>
          </div>
        </div>

        {/* kids ages */}
        {children > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Array.from({ length: children }).map((_, i) => (
              <div key={i} style={{ display: "grid", gap: 6 }}>
                <label className="lbl">Child {i + 1} age</label>
                <select
                  className="in" style={{ width: 140 }}
                  value={childrenAges[i] ?? 8}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(17, Number(e.target.value) || 8));
                    setChildrenAges((prev) => { const next = prev.slice(); next[i] = v; return next; });
                  }}
                >
                  {Array.from({ length: 17 }, (_, n) => n + 1).map((age) => <option key={age} value={age}>{age}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* cabin + stops */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <label className="lbl">Cabin</label>
            <select className="in" value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
          <div>
            <label className="lbl">Stops</label>
            <select className="in" value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value) as 0 | 1 | 2)}>
              <option value={0}>Nonstop</option>
              <option value={1}>1 stop</option>
              <option value={2}>More than 1 stop</option>
            </select>
          </div>
          <div />
        </div>

        {/* hotel */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "auto 1fr 1fr 1fr" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
            Include hotel
          </label>
          <div>
            <label className="lbl">Hotel check-in</label>
            <input type="date" className="in" value={hotelCheckIn}
                   onChange={(e) => setHotelCheckIn(e.target.value)}
                   disabled={!includeHotel} min={departDate || todayLocal} />
          </div>
          <div>
            <label className="lbl">Hotel check-out</label>
            <input type="date" className="in" value={hotelCheckOut}
                   onChange={(e) => setHotelCheckOut(e.target.value)}
                   disabled={!includeHotel}
                   min={hotelCheckIn ? plusDays(hotelCheckIn, 1) : departDate ? plusDays(departDate, 1) : plusDays(todayLocal, 1)} />
          </div>
          <div>
            <label className="lbl">Min hotel stars</label>
            <select className="in" value={minHotelStar} onChange={(e) => setMinHotelStar(Number(e.target.value))}
                    disabled={!includeHotel}>
              <option value={0}>Any</option>
              <option value={3}>3★+</option>
              <option value={4}>4★+</option>
              <option value={5}>5★</option>
            </select>
          </div>
        </div>

        {/* budgets + basis */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <label className="lbl">Min budget</label>
            <input type="number" min={0} className="no-spin in" placeholder="min"
              value={minBudget === "" ? "" : String(minBudget)}
              onChange={(e) => { if (e.target.value === "") return setMinBudget(""); const v = Number(e.target.value); setMinBudget(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </div>
          <div>
            <label className="lbl">Max budget</label>
            <input type="number" min={0} className="no-spin in" placeholder="max"
              value={maxBudget === "" ? "" : String(maxBudget)}
              onChange={(e) => { if (e.target.value === "") return setMaxBudget(""); const v = Number(e.target.value); setMaxBudget(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </div>
          <div>
            <label className="lbl">Sort (basis)</label>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className={`segbtn${"flightOnly" === sortBasis ? " segbtn--on" : ""}`} onClick={() => setSortBasis("flightOnly")}>Flight only</button>
              <button type="button" className={`segbtn${"bundle" === sortBasis ? " segbtn--on" : ""}`} onClick={() => setSortBasis("bundle")}>Bundle total</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="submit" className="cta">{loading ? "Searching…" : "Search"}</button>
          <button type="button" className="ghost" onClick={() => window.location.reload()}>Reset</button>
        </div>
      </form>

      {/* Tabs (Explore / Savor / Misc / Compare) */}
      {tabsVisible && (
        <div className="toolbar">
          <div className="tabs" role="tablist" aria-label="Content tabs">
            <button className={`tab ${exploreOpen ? "tab--active" : ""}`}
              onClick={() => { setExploreOpen((v) => !v); setSavorOpen(false); setMiscOpen(false); setCompareMode(false); }}>
              🌍 Explore
            </button>
            <button className={`tab ${savorOpen ? "tab--active" : ""}`}
              onClick={() => { setSavorOpen((v) => !v); setExploreOpen(false); setMiscOpen(false); setCompareMode(false); }}>
              🍽️ Savor
            </button>
            <button className={`tab ${miscOpen ? "tab--active" : ""}`}
              onClick={() => { setMiscOpen((v) => !v); setExploreOpen(false); setSavorOpen(false); setCompareMode(false); }}>
              🧭 Miscellaneous
            </button>
            <button className={`tab tab--compare ${compareMode ? "tab--active" : ""}`}
              onClick={() => { setCompareMode((v) => !v); setExploreOpen(false); setSavorOpen(false); setMiscOpen(false); }}
              title="Select cards to compare">
              🆚 Compare
            </button>
          </div>

          {/* Results toolbar */}
          <div className="tabs" aria-label="Results toolbar">
            <button className="tab" onClick={() => setSort("best")}>Best</button>
            <button className="tab" onClick={() => setSort("cheapest")}>Cheapest</button>
            <button className="tab" onClick={() => setSort("fastest")}>Fastest</button>
            <button className="tab" onClick={() => alert("Flexible: try adjusting dates by ±1 day")}>Flexible</button>
            <button className={`tab ${!showAll ? "tab--active" : ""}`} onClick={() => setShowAll(false)}>Top-3</button>
            <button className={`tab ${showAll ? "tab--active" : ""}`} onClick={() => setShowAll(true)}>All</button>
            <button className="tab" onClick={() => window.print()}>Print</button>
            <a className="tab" href="/saved">Saved</a>
          </div>
        </div>
      )}

      {/* row-wise Explore/Savor/Misc */}
      {tabsVisible && exploreOpen && (
        <ExploreSavorTabs destinationCity={destCity} destinationCountry={""} showTabs mode="explore" />
      )}
      {tabsVisible && savorOpen && (
        <ExploreSavorTabs destinationCity={destCity} destinationCountry={""} showTabs mode="savor" />
      )}
      {tabsVisible && miscOpen && (
        <ExploreSavorTabs destinationCity={destCity} destinationCountry={""} showTabs mode="misc" />
      )}

      {/* messages */}
      {error && <div className="msg msg--error">{error}</div>}
      {hotelWarning && <div className="msg msg--warn">{hotelWarning}</div>}

      {/* results list */}
      {shownResults && shownResults.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {shownResults.map((pkg, i) => (
            <ResultCard
              key={idsForSorted[i]}
              pkg={pkg}
              index={i}
              currency={currency}
              pax={adults + children + infants}
              comparedIds={comparedIds}
              onToggleCompare={compareMode ? toggleCompare : undefined}
              showHotel={includeHotel}
            />
          ))}
        </div>
      )}

      {/* Compare overlay */}
      {compareMode && (
        <ComparePanel
          items={comparedPkgs}
          currency={currency}
          onClose={() => setCompareMode(false)}
          onRemove={(id) => setComparedIds((prev) => prev.filter((x) => x !== id))}
        />
      )}
    </div>
  );
}
