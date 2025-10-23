"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import SavedChip from "../components/SavedChip";
import ComparePanel from "../components/ComparePanel";
import { savorSet, miscSet, exploreSet, robustCountryFrom, codeToName } from "@/lib/savorExplore";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";

interface SearchPayload {
  origin: string; destination: string; departDate: string; returnDate?: string; roundTrip: boolean;
  passengers: number; passengersAdults: number; passengersChildren: number; passengersInfants: number; passengersChildrenAges?: number[];
  cabin: Cabin;
  includeHotel: boolean; hotelCheckIn?: string; hotelCheckOut?: string; nights?: number; minHotelStar?: number;
  minBudget?: number; maxBudget?: number; currency: string; sort: SortKey; maxStops?: 0 | 1 | 2;
  sortBasis?: "flightOnly" | "bundle";
}

const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function extractIATA(display: string): string {
  const s = String(display || "").toUpperCase().trim();
  let m = /\(([A-Z]{3})\)/.exec(s); if (m) return m[1];
  m = /^([A-Z]{3})\b/.exec(s); if (m) return m[1];
  return "";
}
function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}

export default function Page() {
  const [originCode, setOriginCode] = useState(""); const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState(""); const [destDisplay, setDestDisplay] = useState("");

  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState(""); const [returnDate, setReturnDate] = useState("");

  const [adults, setAdults] = useState(1); const [children, setChildren] = useState(0); const [infants, setInfants] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  // Currency is controlled in Header via localStorage + event. Keep a local mirror.
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    try {
      const cur = localStorage.getItem("triptrio:currency");
      if (cur) setCurrency(cur);
    } catch {}
    const handler = (e: any) => setCurrency(e?.detail || (localStorage.getItem("triptrio:currency") || "USD"));
    window.addEventListener("triptrio:currency", handler);
    return () => window.removeEventListener("triptrio:currency", handler);
  }, []);

  const [minBudget, setMinBudget] = useState<number | "">(""); const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);

  /* ---- Hotel (optional) ---- */
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);

  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">("flightOnly");

  // Tabs visible after Search
  const [tabsVisible, setTabsVisible] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [savorOpen, setSavorOpen] = useState(false);
  const [miscOpen, setMiscOpen] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  useEffect(() => { if (!compareMode) setComparedIds([]); }, [compareMode]);

  const [loading, setLoading] = useState(false); const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null); const [hotelWarning, setHotelWarning] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const load = () => { try { const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]"); setSavedCount(Array.isArray(arr) ? arr.length : 0); } catch { setSavedCount(0); } };
    load(); const handler = () => load();
    window.addEventListener("triptrio:saved:changed", handler); window.addEventListener("storage", handler);
    return () => { window.removeEventListener("triptrio:saved:changed", handler); window.removeEventListener("storage", handler); };
  }, []);

  useEffect(() => { setChildrenAges(prev => { const next = prev.slice(0, children); while (next.length < children) next.push(8); return next; }); }, [children]);
  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);
  useEffect(() => { if (!includeHotel) { setHotelCheckIn(""); setHotelCheckOut(""); setSortBasis("flightOnly"); } }, [includeHotel]);

  function swapOriginDest() {
    setOriginCode(oc => { const dc = destCode; setDestCode(oc); return dc; });
    setOriginDisplay(od => { const dd = destDisplay; setDestDisplay(od); return dd; });
  }

  async function runSearch() {
    setLoading(true); setError(null); setHotelWarning(null); setResults(null);
    try {
      const origin = originCode || extractIATA(originDisplay);
      const destination = destCode || extractIATA(destDisplay);
      if (!origin || !destination) throw new Error("Please select origin and destination.");
      if (!departDate) throw new Error("Please pick a departure date.");
      if (departDate < todayLocal) throw new Error("Departure date can’t be in the past.");
      if (adults < 1) throw new Error("At least 1 adult is required.");
      if (roundTrip) { if (!returnDate) throw new Error("Please pick a return date."); if (returnDate <= departDate) throw new Error("Return date must be after departure."); }
      if (includeHotel) {
        if (!hotelCheckIn || !hotelCheckOut) throw new Error("Please set hotel check-in and check-out.");
        if (hotelCheckIn < todayLocal) throw new Error("Hotel check-in can’t be in the past.");
        if (hotelCheckOut <= hotelCheckIn) throw new Error("Hotel check-out must be after check-in.");
      }
      if (minBudget !== "" && minBudget < 0) throw new Error("Min budget cannot be negative.");
      if (maxBudget !== "" && maxBudget < 0) throw new Error("Max budget cannot be negative.");
      if (typeof minBudget === "number" && typeof maxBudget === "number" && minBudget > maxBudget) throw new Error("Min budget cannot be greater than max budget.");

      const payload: SearchPayload = {
        origin, destination, departDate, returnDate: roundTrip ? returnDate : undefined, roundTrip,
        passengers: adults + children + infants, passengersAdults: adults, passengersChildren: children, passengersInfants: infants,
        passengersChildrenAges: children > 0 ? childrenAges : undefined,
        cabin, includeHotel, hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        nights: includeHotel && hotelCheckIn && hotelCheckOut ? Math.max(1, Math.round((+new Date(hotelCheckOut) - +new Date(hotelCheckIn)) / 86400000)) : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: minBudget === "" ? undefined : minBudget, maxBudget: maxBudget === "" ? undefined : maxBudget,
        currency, sort, maxStops, sortBasis,
      };

      const r = await fetch(`/api/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || "Search failed");

      setHotelWarning(j?.hotelWarning || null);
      const merged = (Array.isArray(j.results) ? j.results : []).map((res: any) => ({ ...res, ...payload }));
      setResults(merged);
      setExploreOpen(false); setSavorOpen(false); setMiscOpen(false); setCompareMode(false);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const sortedResults = useMemo(() => {
    if (!results) return null; const items = [...results];
    const flightPrice = (p: any) => num(p.flight_total) ?? num(p.total_cost_flight) ?? num(p.flight?.price_usd_converted) ?? num(p.flight?.price_usd) ?? num(p.total_cost) ?? 9e15;
    const bundleTotal = (p: any) => num(p.total_cost) ?? (num(p.flight_total) ?? flightPrice(p)) + (num(p.hotel_total) ?? 0);
    const outDur = (p: any) => { const segs = p.flight?.segments_out || []; const sum = segs.reduce((t: number, s: any) => t + (Number(s?.duration_minutes) || 0), 0); return Number.isFinite(sum) ? sum : 9e9; };
    const basisValue = (p: any) => (sortBasis === "bundle" ? bundleTotal(p) : flightPrice(p));
    if (sort === "cheapest") items.sort((a, b) => basisValue(a)! - basisValue(b)!);
    else if (sort === "fastest") items.sort((a, b) => outDur(a)! - outDur(b)!);
    else if (sort === "flexible") items.sort((a, b) => (a.flight?.refundable ? 0 : 1) - (b.flight?.refundable ? 0 : 1) || (basisValue(a)! - basisValue(b)!));
    else items.sort((a, b) => (basisValue(a)! - basisValue(b)!) || (outDur(a)! - outDur(b)!));
    return items;
  }, [results, sort, sortBasis]);

  // Show *all* results in "All" (no 3-item cap)
  const shownResults = sortedResults;

  function toggleCompare(id: string) {
    setComparedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev] .concat(id)));
  }

  const s = {
    label: { fontWeight: 500, color: "#334155", display: "block", marginBottom: 6, fontSize: 15 } as React.CSSProperties,
  };
  const inputStyle: React.CSSProperties = { height: 50, padding: "0 14px", border: "1px solid #e2e8f0", borderRadius: 12, width: "100%", background: "#fff", fontSize: 16 };
  const segBase: React.CSSProperties = { height: 44, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: 15, lineHeight: 1, whiteSpace: "nowrap", cursor: "pointer" };
  const segStyle = (active: boolean): React.CSSProperties => (active ? { ...segBase, background: "linear-gradient(180deg,#ffffff,#eef6ff)", color: "#0f172a", border: "1px solid #bfdbfe" } : segBase);

  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      <style jsx global>{`
        header a { text-decoration: none !important; border-bottom: 0 !important; }
        header img.tt-logo, header .tt-logo { border: 0 !important; box-shadow: none !important; }
        .toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
        .toolbar-chip { padding: 8px 12px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; font-weight: 800; cursor: pointer; }
        .toolbar-chip--active { background: linear-gradient(90deg,#06b6d4,#0ea5e9); color: #fff; border: none; }
        .msg { margin-top: 10px; padding: 10px 12px; border-radius: 10px; font-weight: 700; }
        .msg--error { background: #fef2f2; border: 1px solid #fecaca; color: #7f1d1d; }
        .msg--warn { background: #fffbeb; border: 1px solid #fde68a; color: #713f12; }
        .main-wrap { display: grid; gap: 12px; }
      `}</style>

      <section id="search">
        <h1 style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 32, letterSpacing: "-0.02em" }}>Find your perfect trip</h1>
        <p style={{ margin: 0, display: "flex", gap: 10, alignItems: "center", color: "#334155", fontWeight: 500, flexWrap: "wrap", fontSize: 15 }}>
          <span style={{ padding: "6px 12px", borderRadius: 999, background: "linear-gradient(180deg,#ffffff,#eef6ff)", border: "1px solid #cfe0ff", color: "#0b1220", fontWeight: 600 }}>Top picks</span>
          <span style={{ opacity: 0.6 }}>•</span><span>Explore, Savor & Misc guides</span>
          <span style={{ opacity: 0.6 }}>•</span><span>Compare many options</span>
        </p>
      </section>

      {/* Search form */}
      <form style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gap: 14, maxWidth: 1240, margin: "0 auto", fontSize: 16 }}
            onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 54px 1fr", alignItems: "end" }}>
          <div>
            <label style={s.label}>Origin</label>
            <AirportField id="origin" label="" code={originCode} initialDisplay={originDisplay}
              onTextChange={setOriginDisplay} onChangeCode={(code, display) => { setOriginCode(code); setOriginDisplay(display); }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
            <button type="button" title="Swap origin & destination" onClick={() => swapOriginDest()}
              style={{ height: 46, width: 46, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 18 }}>⇄</button>
          </div>
          <div>
            <label style={s.label}>Destination</label>
            <AirportField id="destination" label="" code={destCode} initialDisplay={destDisplay}
              onTextChange={setDestDisplay} onChangeCode={(code, display) => { setDestCode(code); setDestDisplay(display); }} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "170px 1fr 1fr 1fr 1fr 1fr", alignItems: "end" }}>
          <div style={{ minWidth: 170 }}>
            <label style={s.label}>Trip</label>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" style={segStyle(!roundTrip)} onClick={() => setRoundTrip(false)}>One-way</button>
              <button type="button" style={segStyle(roundTrip)} onClick={() => setRoundTrip(true)}>Round-trip</button>
            </div>
          </div>

          <div>
            <label style={s.label}>Depart</label>
            <input type="date" style={inputStyle} value={departDate} onChange={(e) => setDepartDate(e.target.value)} min={todayLocal} max={roundTrip && returnDate ? returnDate : undefined} />
          </div>

          <div>
            <label style={s.label}>Return</label>
            <input type="date" style={inputStyle} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} disabled={!roundTrip}
              min={departDate ? plusDays(departDate, 1) : plusDays(todayLocal, 1)} />
          </div>

          {/* Steppers */}
          <div>
            <label style={s.label}>Adults</label>
            <div className="stepper">
              <button type="button" onClick={() => setAdults((v) => Math.max(1, v - 1))}>−</button>
              <input className="no-spin" type="number" readOnly value={adults} style={inputStyle} />
              <button type="button" onClick={() => setAdults((v) => v + 1)}>+</button>
            </div>
          </div>
          <div>
            <label style={s.label}>Children</label>
            <div className="stepper">
              <button type="button" onClick={() => setChildren((v) => Math.max(0, v - 1))}>−</button>
              <input className="no-spin" type="number" readOnly value={children} style={inputStyle} />
              <button type="button" onClick={() => setChildren((v) => v + 1)}>+</button>
            </div>
          </div>
          <div>
            <label style={s.label}>Infants</label>
            <div className="stepper">
              <button type="button" onClick={() => setInfants((v) => Math.max(0, v - 1))}>−</button>
              <input className="no-spin" type="number" readOnly value={infants} style={inputStyle} />
              <button type="button" onClick={() => setInfants((v) => v + 1)}>+</button>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <div>
            <label style={s.label}>Cabin</label>
            <select style={inputStyle} value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}>
              <option value="ECONOMY">Economy</option><option value="PREMIUM_ECONOMY">Premium Economy</option><option value="BUSINESS">Business</option><option value="FIRST">First</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Stops</label>
            <select style={inputStyle} value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value) as 0 | 1 | 2)}>
              <option value={0}>Nonstop</option><option value={1}>1 stop</option><option value={2}>More than 1 stop</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Budget min</label>
            <input style={inputStyle} type="number" value={minBudget as any} onChange={(e)=>setMinBudget(e.target.value===""? "": Number(e.target.value))} min={0} placeholder="Optional" />
          </div>
          <div>
            <label style={s.label}>Budget max</label>
            <input style={inputStyle} type="number" value={maxBudget as any} onChange={(e)=>setMaxBudget(e.target.value===""? "": Number(e.target.value))} min={0} placeholder="Optional" />
          </div>
        </div>

        {/* --- Hotel option --- */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#0b1220" }}>
          <input id="include-hotel" type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
          <label htmlFor="include-hotel">Include hotel</label>
        </div>

        {includeHotel && (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <label style={s.label}>Check-in</label>
              <input type="date" style={inputStyle} value={hotelCheckIn} onChange={(e) => setHotelCheckIn(e.target.value)}
                min={departDate || todayLocal} />
            </div>
            <div>
              <label style={s.label}>Check-out</label>
              <input type="date" style={inputStyle} value={hotelCheckOut} onChange={(e) => setHotelCheckOut(e.target.value)}
                min={hotelCheckIn ? plusDays(hotelCheckIn, 1) : (departDate ? plusDays(departDate, 1) : plusDays(todayLocal, 1))} />
            </div>
            <div>
              <label style={s.label}>Min stars</label>
              <select style={inputStyle} value={minHotelStar} onChange={(e) => setMinHotelStar(Number(e.target.value))}>
                <option value={0}>Any</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
                <option value={5}>5</option>
              </select>
            </div>

            {/* Sort basis only shows when hotel is included */}
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: "#334155" }}>Sort by price of:</span>
              <button type="button" className={`toolbar-chip ${sortBasis === "flightOnly" ? "toolbar-chip--active" : ""}`} onClick={()=>setSortBasis("flightOnly")}>Flight only</button>
              <button type="button" className={`toolbar-chip ${sortBasis === "bundle" ? "toolbar-chip--active" : ""}`} onClick={()=>setSortBasis("bundle")}>Flight + Hotel (bundle total)</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div role="tablist" aria-label="Sort" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["best", "cheapest", "fastest", "flexible"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={sort === k} className={`toolbar-chip ${sort === k ? "toolbar-chip--active" : ""}`} onClick={() => setSort(k)}>
                {k === "best" ? "Best" : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <button className="toolbar-chip" onClick={() => window.print()}>Print</button>
          <SavedChip count={savedCount} />
          <div style={{ marginLeft: "auto" }}>
            <button type="submit" className="toolbar-chip toolbar-chip--active">Search</button>
          </div>
        </div>
      </form>

      {/* Results toolbar */}
      {results && results.length > 0 && (
        <div className="toolbar" style={{ marginTop: 8 }}>
          <div role="tablist" aria-label="Quick panels" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={`tab ${exploreOpen ? "tab--active" : ""}`} role="tab" aria-selected={exploreOpen}
              onClick={() => { setExploreOpen(v => !v); setSavorOpen(false); setMiscOpen(false); setCompareMode(false); }}>
              🌍 Explore
            </button>
            <button className={`tab ${savorOpen ? "tab--active" : ""}`} role="tab" aria-selected={savorOpen}
              onClick={() => { setSavorOpen(v => !v); setExploreOpen(false); setMiscOpen(false); setCompareMode(false); }}>
              🍽️ Savor
            </button>
            <button className={`tab ${miscOpen ? "tab--active" : ""}`} role="tab" aria-selected={miscOpen}
              onClick={() => { setMiscOpen(v => !v); setExploreOpen(false); setSavorOpen(false); setCompareMode(false); }}>
              🧭 Miscellaneous
            </button>
            <button className={`tab tab--compare ${compareMode ? "tab--active" : ""}`} role="tab" aria-selected={compareMode}
              onClick={() => { setCompareMode(v => !v); setExploreOpen(false); setSavorOpen(false); setMiscOpen(false); }}>
              ⚖️ Compare
            </button>
          </div>
          <SavedChip count={savedCount} />
        </div>
      )}

      {/* Explore / Savor / Misc panels (toggle on/off) */}
      {results && results.length > 0 && exploreOpen && <div style={{marginTop:8}}>(Explore panel)</div>}
      {results && results.length > 0 && savorOpen && <div style={{marginTop:8}}>(Savor panel)</div>}
      {results && results.length > 0 && miscOpen && <div style={{marginTop:8}}>(Misc panel)</div>}

      {/* Compare modal */}
      {compareMode && results && comparedIds.length >= 2 && (
        <ComparePanel
          items={results.filter(r => comparedIds.includes(r.id || `pkg-${(results as any[]).indexOf(r)}`))}
          currency={currency}
          onClose={() => setCompareMode(false)}
          onRemove={(id) => setComparedIds(prev => prev.filter(x => x !== id))}
        />
      )}

      {error && <div className="msg msg--error" role="alert">⚠ {error}</div>}
      {hotelWarning && !error && <div className="msg msg--warn">ⓘ {hotelWarning}</div>}

      {shownResults && shownResults.length > 0 && (
        <div className="main-wrap">
          {shownResults.map((pkg, i) => (
            <ResultCard
              key={pkg.id || i}
              pkg={{
                ...pkg,
                passengersAdults: adults,
                passengersChildren: children,
                passengersInfants: infants,
              }}
              index={i}
              currency={currency}
              pax={adults + children + infants}
              comparedIds={compareMode ? comparedIds : undefined}
              onToggleCompare={compareMode ? (id)=>{
                // prevent card click toggling Compare unintentionally
                const ev = (window.event as MouseEvent | any);
                if (ev && typeof ev.stopPropagation==="function") ev.stopPropagation();
                toggleCompare(id);
              } : undefined}
              onSavedChangeGlobal={(count) => setSavedCount(count)}
              large
              showHotel={includeHotel}
            />
          ))}
        </div>
      )}
    </div>
  );
}