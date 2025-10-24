"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import ComparePanel from "../components/ComparePanel";
import ExploreSavorTabs from "../components/ExploreSavorTabs";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type TabKey = "top3" | "all";
type SubTab = "explore" | "savor" | "misc"; // removed the 'compare' nav tab

const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString().slice(0, 10);
const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function extractIATA(display: string): string {
  const s = String(display || "").toUpperCase().trim();
  let m = /\(([A-Z]{3})\)/.exec(s); if (m) return m[1];
  m = /^([A-Z]{3})\b/.exec(s);      if (m) return m[1];
  return "";
}
function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function cityFromDisplay(txt: string) {
  if (!txt) return "";
  const parts = txt.split("—").map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return txt.split(",")[0].trim();
}
function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime(), B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

export default function Page() {
  // places & dates
  const [originCode, setOriginCode] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState("");
  const [destDisplay, setDestDisplay] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // pax & cabin
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  // currency (from header)
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    try { const cur = localStorage.getItem("triptrio:currency"); if (cur) setCurrency(cur); } catch {}
    const handler = (e: any) => setCurrency(e?.detail || localStorage.getItem("triptrio:currency") || "USD");
    window.addEventListener("triptrio:currency", handler);
    return () => window.removeEventListener("triptrio:currency", handler);
  }, []);

  // flight filters
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);

  // hotel
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");

  // sorting / tabs
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">("flightOnly");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("explore");
  const [showControls, setShowControls] = useState(false);

  // results & compare
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  useEffect(() => { if (!includeHotel) setSortBasis("flightOnly"); }, [includeHotel]);
  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);

  function swapOriginDest() {
    setOriginCode((oc) => { const dc = destCode; setDestCode(oc); return dc; });
    setOriginDisplay((od) => { const dd = destDisplay; setDestDisplay(od); return dd; });
  }

  async function runSearch() {
    setLoading(true); setError(null); setResults(null);
    try {
      const origin = originCode || extractIATA(originDisplay);
      const destination = destCode || extractIATA(destDisplay);
      if (!origin || !destination) throw new Error("Please select origin and destination.");
      if (!departDate) throw new Error("Please pick a departure date.");
      if (roundTrip && !returnDate) throw new Error("Please pick a return date.");

      const payload = {
        origin, destination, departDate, returnDate: roundTrip ? returnDate : undefined, roundTrip,
        passengers: adults + children + infants, passengersAdults: adults, passengersChildren: children, passengersInfants: infants,
        cabin, includeHotel,
        hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: includeHotel && minBudget ? Number(minBudget) : undefined,
        maxBudget: includeHotel && maxBudget ? Number(maxBudget) : undefined,
        currency, maxStops
      };

      const r = await fetch(`/api/search`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), cache: "no-store"
      });
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || "Search failed");
      const arr = Array.isArray(j.results) ? j.results : [];
      setResults(arr.map((res: any) => ({ ...res, ...payload })));
      setShowControls(true);
      setActiveTab("all");
      setActiveSubTab("explore");
      setComparedIds([]);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally { setLoading(false); }
  }

  // sort
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
    else if (sort === "flexible")
      items.sort(
        (a, b) =>
          (a.flight?.refundable ? 0 : 1) - (b.flight?.refundable ? 0 : 1) ||
          basisValue(a)! - basisValue(b)!
      );
    else items.sort((a, b) => basisValue(a)! - basisValue(b)! || outDur(a)! - outDur(b)!);

    return items;
  }, [results, sort, sortBasis]);

  const top3 = useMemo(() => (sortedResults ? sortedResults.slice(0, 3) : null), [sortedResults]);
  const shown = (activeTab === "all" ? sortedResults : top3) || [];

  function toggleCompare(id: string) {
    setComparedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  const s = { label: { fontWeight: 600, color: "#334155", display: "block", marginBottom: 6, fontSize: 14 } as React.CSSProperties };
  const inputStyle: React.CSSProperties = { height: 44, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 12, width: "100%", background: "#fff", fontSize: 15 };

  const destCity = cityFromDisplay(destDisplay);
  const hotelNights = includeHotel ? nightsBetween(hotelCheckIn, hotelCheckOut) : 0;

  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      {/* Search */}
      <form
        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gap: 14 }}
        onSubmit={(e) => { e.preventDefault(); runSearch(); }}
      >
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 54px 1fr", alignItems: "end" }}>
          <div>
            <label style={s.label}>Origin</label>
            <AirportField id="origin" label="" code={originCode} initialDisplay={originDisplay}
              onTextChange={setOriginDisplay}
              onChangeCode={(code, display) => { setOriginCode(code); setOriginDisplay(display); }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
            <button type="button" title="Swap origin & destination" onClick={swapOriginDest}
              style={{ height: 42, width: 42, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 18 }}>⇄</button>
          </div>
          <div>
            <label style={s.label}>Destination</label>
            <AirportField id="destination" label="" code={destCode} initialDisplay={destDisplay}
              onTextChange={setDestDisplay}
              onChangeCode={(code, display) => { setDestCode(code); setDestDisplay(display); }} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "160px 1fr 1fr 1fr 1fr 1fr", alignItems: "end" }}>
          <div style={{ minWidth: 160 }}>
            <label style={s.label}>Trip</label>
            <div style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setRoundTrip(false)} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${roundTrip ? "#e2e8f0" : "#60a5fa"}` }}>One-way</button>
              <button type="button" onClick={() => setRoundTrip(true)} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${roundTrip ? "#60a5fa" : "#e2e8f0"}` }}>Round-trip</button>
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

          <div>
            <label style={s.label}>Adults</label>
            <input type="number" min={1} max={9} value={adults} onChange={(e)=>setAdults(parseInt(e.target.value||"1"))} style={inputStyle} />
          </div>
          <div>
            <label style={s.label}>Children</label>
            <input type="number" min={0} max={8} value={children} onChange={(e)=>setChildren(parseInt(e.target.value||"0"))} style={inputStyle} />
          </div>
          <div>
            <label style={s.label}>Infants</label>
            <input type="number" min={0} max={8} value={infants} onChange={(e)=>setInfants(parseInt(e.target.value||"0"))} style={inputStyle} />
          </div>
        </div>

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

          {/* Hotel toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
            <input id="include-hotel" type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
            <label htmlFor="include-hotel" style={{ fontWeight: 700 }}>Include hotel</label>
          </div>

          <div style={{ textAlign: "right" }}>
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#0ea5e9", color: "#fff", fontWeight: 800, marginTop: 8, marginRight: 8 }}>
              {loading ? "Searching..." : "Search"}
            </button>
            <button type="button" onClick={() => location.reload()} title="Reset all fields and results" style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", fontWeight: 800, marginTop: 8 }}>
              Reset
            </button>
          </div>
        </div>

        {/* Hotel-only inputs */}
        {includeHotel && (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(6, 1fr)" }}>
            <div>
              <label style={s.label}>Check-in</label>
              <input type="date" style={inputStyle} value={hotelCheckIn} onChange={(e) => setHotelCheckIn(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Check-out</label>
              <input type="date" style={inputStyle} value={hotelCheckOut} onChange={(e) => setHotelCheckOut(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Min stars</label>
              <select style={inputStyle} value={minHotelStar} onChange={(e) => setMinHotelStar(Number(e.target.value))}>
                <option value={0}>Any</option><option value={2}>2+</option><option value={3}>3+</option><option value={4}>4+</option><option value={5}>5</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Min budget</label>
              <input type="number" inputMode="numeric" placeholder="min" style={inputStyle} value={minBudget} onChange={(e)=>setMinBudget(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Max budget</label>
              <input type="number" inputMode="numeric" placeholder="max" style={inputStyle} value={maxBudget} onChange={(e)=>setMaxBudget(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Sort by (basis)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                <button type="button" onClick={()=>setSortBasis("flightOnly")} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${sortBasis==="flightOnly"?"#60a5fa":"#e2e8f0"}` }}>Flight only</button>
                <button type="button" onClick={()=>setSortBasis("bundle")} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${sortBasis==="bundle"?"#60a5fa":"#e2e8f0"}` }}>Bundle total</button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Sub-tabs (only after search) */}
      {showControls && (
        <>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", color:"#475569", fontWeight:700 }}>
            <button className={`subtab ${activeSubTab==="explore"?"on":""}`} onClick={()=>setActiveSubTab("explore")}>Explore</button>
            <button className={`subtab ${activeSubTab==="savor"?"on":""}`}   onClick={()=>setActiveSubTab("savor")}>Savor</button>
            <button className={`subtab ${activeSubTab==="misc"?"on":""}`}    onClick={()=>setActiveSubTab("misc")}>Miscellaneous</button>
            <style jsx>{`
              .subtab{padding:8px 12px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;cursor:pointer}
              .subtab.on{background:linear-gradient(90deg,#06b6d4,#0ea5e9);color:#fff;border:none}
            `}</style>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 12 }}>
            {/* Show *only* the active panel */}
            <ExploreSavorTabs city={cityFromDisplay(destDisplay) || "Destination"} mode={activeSubTab} />
          </div>
        </>
      )}

      {/* Chips (sort + Top-3/All + Print) */}
      {showControls && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className={`chip ${sort === "best" ? "on" : ""}`} onClick={() => setSort("best")}>Best</button>
          <button className={`chip ${sort === "cheapest" ? "on" : ""}`} onClick={() => setSort("cheapest")}>Cheapest</button>
          <button className={`chip ${sort === "fastest" ? "on" : ""}`} onClick={() => setSort("fastest")}>Fastest</button>
          <button className={`chip ${sort === "flexible" ? "on" : ""}`} onClick={() => setSort("flexible")}>Flexible</button>
          <span style={{ marginLeft: 8 }} />
          <button className={`chip ${activeTab==="top3" ? "on":""}`} onClick={()=>setActiveTab("top3")}>Top-3</button>
          <button className={`chip ${activeTab==="all" ? "on":""}`}  onClick={()=>setActiveTab("all")}>All</button>
          <button className="chip" onClick={() => window.print()}>Print</button>
          <style jsx>{`
            .chip{padding:8px 12px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;font-weight:700;cursor:pointer}
            .chip.on{background:linear-gradient(90deg,#06b6d4,#0ea5e9);color:#fff;border:none}
          `}</style>
        </div>
      )}

      {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#7f1d1d", padding:10, borderRadius:10 }}>⚠ {error}</div>}

      {/* Results */}
      {(shown?.length ?? 0) > 0 && (
        <div style={{ display:"grid", gap: 10 }}>
          {shown.map((pkg, i) => (
            <ResultCard
              key={pkg.id || i}
              pkg={pkg}
              index={i}
              currency={currency}
              pax={adults + children + infants}
              showHotel={includeHotel}
              hotelNights={includeHotel ? nightsBetween(hotelCheckIn, hotelCheckOut) : 0}
              showAllHotels={activeTab === "all"}
              comparedIds={comparedIds}
              onToggleCompare={(id)=>toggleCompare(id)}
              onSavedChangeGlobal={()=>{}}
            />
          ))}
        </div>
      )}

      {/* Compare tray (only tray; no duplicate nav tab) */}
      {comparedIds.length >= 2 && (
        <ComparePanel
          items={(shown || []).filter((r: any) => comparedIds.includes(String(r.id || "")))}
          currency={currency}
          onClose={() => setComparedIds([])}
          onRemove={(id) => setComparedIds(prev => prev.filter(x => x !== id))}
        />
      )}
    </div>
  );
}
