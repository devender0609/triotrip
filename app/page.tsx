"use client";

import React, { useMemo, useState } from "react";
import ResultCard from "@/components/ResultCard";
import ComparePanel from "@/components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";

type Pkg = any;

const swap = <T,>(a: T, b: T) => [b, a] as const;

export default function Page() {
  // form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [depart, setDepart] = useState("");
  const [ret, setRet] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [stops, setStops] = useState("More than 1 stop");
  const [includeHotel, setIncludeHotel] = useState(false);
  const [minStars, setMinStars] = useState("Any");
  const [hasSearched, setHasSearched] = useState(false);

  // results
  const [results, setResults] = useState<Pkg[]>([]);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  function toggleCompare(id: string) {
    setComparedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function onSearch() {
    // Hook up to your backend; for now mock a couple of cards
    const sample: Pkg[] = [
      {
        id: "A1",
        origin, destination, price: { amount: 318, currency: (document.documentElement.getAttribute("data-currency") || "USD") },
        flight: {
          segments: [
            { from: (origin || "AUS").slice(0,3).toUpperCase(), to: "CLT", depart_time: `${depart||"2025-11-01"}T06:00:00`, arrive_time: `${depart||"2025-11-01"}T07:45:00`, duration_minutes: 105 },
            { from: "CLT", to: (destination || "EWR").slice(0,3).toUpperCase(), depart_time: `${depart||"2025-11-01"}T08:50:00`, arrive_time: `${depart||"2025-11-01"}T10:35:00`, duration_minutes: 105 },
          ],
          stops: 1, total_duration_minutes: 210
        },
        returnFlight: {
          segments: [
            { from: (destination || "EWR").slice(0,3).toUpperCase(), to: "CLT", depart_time: `${ret||"2025-11-08"}T18:15:00`, arrive_time: `${ret||"2025-11-08"}T19:55:00`, duration_minutes: 100 },
            { from: "CLT", to: (origin || "AUS").slice(0,3).toUpperCase(), depart_time: `${ret||"2025-11-08"}T21:00:00`, arrive_time: `${ret||"2025-11-08"}T22:45:00`, duration_minutes: 105 },
          ],
          stops: 1, total_duration_minutes: 205
        }
      },
      {
        id: "A2",
        origin, destination, price: { amount: 379, currency: (document.documentElement.getAttribute("data-currency") || "USD") },
        flight: {
          segments: [
            { from: (origin || "AUS").slice(0,3).toUpperCase(), to: (destination || "EWR").slice(0,3).toUpperCase(), depart_time: `${depart||"2025-11-01"}T08:00:00`, arrive_time: `${depart||"2025-11-01"}T12:05:00`, duration_minutes: 245 },
          ],
          stops: 0, total_duration_minutes: 245
        },
        returnFlight: {
          segments: [
            { from: (destination || "EWR").slice(0,3).toUpperCase(), to: (origin || "AUS").slice(0,3).toUpperCase(), depart_time: `${ret||"2025-11-08"}T18:30:00`, arrive_time: `${ret||"2025-11-08"}T21:15:00`, duration_minutes: 165 },
          ],
          stops: 0, total_duration_minutes: 165
        }
      }
    ];
    setResults(sample);
    setHasSearched(true);
    setCompareMode(false);
    setComparedIds([]);
  }

  const comparedItems = useMemo(() => results.filter(r => comparedIds.includes(r.id)), [results, comparedIds]);

  return (
    <div style={{ marginTop: 18 }}>
      {/* Hero title */}
      <h2 style={{ fontSize: 36, margin: "10px 0 12px" }}>Find your perfect trip</h2>

      {/* Top quick-links bar (figure 2 look) */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap", color: "#334155", fontWeight: 600 }}>
        <span>Top-3 picks</span> • <span>Explore</span> • <span>Savor</span> • <span>Misc guides</span> • <span>Compare flights in style</span>
      </div>

      {/* Search card */}
      <section className="search-card">
        {/* row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 10 }}>
          <div>
            <div className="label">Origin</div>
            <input className="btn" placeholder="City, airport or code" value={origin} onChange={e=>setOrigin(e.target.value)} />
          </div>
          <button title="Swap" className="btn" onClick={() => { const [a,b] = swap(origin,destination); setOrigin(a); setDestination(b); }}>↔</button>
          <div>
            <div className="label">Destination</div>
            <input className="btn" placeholder="City, airport or code" value={destination} onChange={e=>setDestination(e.target.value)} />
          </div>
        </div>

        {/* row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <div className="label">Trip</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn badge">One-way</button>
              <button className="btn badge">Round-trip</button>
            </div>
          </div>
          <div>
            <div className="label">Depart</div>
            <input type="date" className="btn" value={depart} onChange={e=>setDepart(e.target.value)} />
          </div>
          <div>
            <div className="label">Return</div>
            <input type="date" className="btn" value={ret} onChange={e=>setRet(e.target.value)} />
          </div>
        </div>

        {/* row 3 – passengers, stops, min stars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <div className="label">Adults</div>
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 36px", gap: 6 }}>
              <button className="btn" onClick={()=>setAdults(a=>Math.max(1,a-1))}>−</button>
              <input className="btn" type="number" value={adults} onChange={e=>setAdults(Number(e.target.value)||1)} />
              <button className="btn" onClick={()=>setAdults(a=>a+1)}>+</button>
            </div>
          </div>
          <div>
            <div className="label">Children</div>
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 36px", gap: 6 }}>
              <button className="btn" onClick={()=>setChildren(a=>Math.max(0,a-1))}>−</button>
              <input className="btn" type="number" value={children} onChange={e=>setChildren(Number(e.target.value)||0)} />
              <button className="btn" onClick={()=>setChildren(a=>a+1)}>+</button>
            </div>
          </div>
          <div>
            <div className="label">Infants</div>
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 36px", gap: 6 }}>
              <button className="btn" onClick={()=>setInfants(a=>Math.max(0,a-1))}>−</button>
              <input className="btn" type="number" value={infants} onChange={e=>setInfants(Number(e.target.value)||0)} />
              <button className="btn" onClick={()=>setInfants(a=>a+1)}>+</button>
            </div>
          </div>
        </div>

        {/* row 4 – stops / hotel / stars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <div className="label">Stops</div>
            <select className="btn" value={stops} onChange={e=>setStops(e.target.value)}>
              <option>Nonstop</option>
              <option>1 stop</option>
              <option>More than 1 stop</option>
            </select>
          </div>

          <div>
            <div className="label">Include hotel</div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={includeHotel} onChange={e=>setIncludeHotel(e.target.checked)} />
              <span>Include hotel</span>
            </label>
          </div>

          <div>
            <div className="label">Min stars</div>
            <select className="btn" value={minStars} onChange={e=>setMinStars(e.target.value)}>
              <option>Any</option>
              <option>2+</option>
              <option>3+</option>
              <option>4+</option>
              <option>5</option>
            </select>
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
          <button className="btn blue" onClick={onSearch}>Search</button>
          <button className="btn" onClick={() => { setOrigin(""); setDestination(""); setDepart(""); setRet(""); setAdults(1); setChildren(0); setInfants(0); setStops("More than 1 stop"); setIncludeHotel(false); setMinStars("Any"); setResults([]); setComparedIds([]); setHasSearched(false); setCompareMode(false);} }>Reset</button>
        </div>
      </section>

      {/* compare toggle and filter chips row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
        <div className="tabs">
          <button className={`tab ${compareMode ? "active":""}`} onClick={()=>setCompareMode(v=>!v)}>🆚 Compare</button>
          <a className="tab" href="#best">Best</a>
          <a className="tab" href="#cheapest">Cheapest</a>
          <a className="tab" href="#fastest">Fastest</a>
          <a className="tab" href="#flexible">Flexible</a>
          <a className="tab" href="#top3">Top-3</a>
          <a className="tab" href="#all">All</a>
          <a className="tab" href="#print" onClick={(e)=>{e.preventDefault(); window.print();}}>Print</a>
          <a className="tab" href="/saved">Saved</a>
        </div>
      </div>

      {/* results / compare */}
      <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
        {!results.length && hasSearched && (
          <div className="result-card">No results yet — try a different search.</div>
        )}

        {!!results.length && !compareMode && results.map((pkg, i) => (
          <ResultCard key={pkg.id || i} pkg={pkg} index={i} comparedIds={comparedIds} onToggleCompare={toggleCompare} />
        ))}

        {!!results.length && compareMode && (
          <ComparePanel items={comparedItems} />
        )}
      </div>

      {/* Explore/Savor/Misc row-wise panels appear only after search and toggle open/close */}
      <ExploreSavorTabs
        showTabs={hasSearched}
        destinationCity={destination || "Dallas"}
        destinationCountry={""}
        countryCode={""}
      />
    </div>
  );
}
