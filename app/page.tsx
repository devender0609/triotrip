"use client";

import React, { useEffect, useMemo, useState } from "react";
import ResultCard from "@/components/ResultCard";
import ComparePanel from "@/components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";

type Package = any;

export default function Page() {
  // Form state (kept minimal – plug into your APIs)
  const [origin, setOrigin] = useState("BOS");
  const [destination, setDestination] = useState("LAS");
  const [depart, setDepart] = useState("2025-11-05");
  const [ret, setRet] = useState("2025-11-12");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [currency, setCurrency] = useState("USD");

  const [results, setResults] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCompare, setShowCompare] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  // listen to currency dropdown in layout
  useEffect(() => {
    const cur = localStorage.getItem("triptrio:currency");
    if (cur) setCurrency(cur);
    const onChange = (e: any) => setCurrency(e?.detail || "USD");
    window.addEventListener("triptrio:currency:changed", onChange as any);
    return () => window.removeEventListener("triptrio:currency:changed", onChange as any);
  }, []);

  const destinationCity = destination;       // adapt if you map IATA→city name
  const destinationCountry = "United States"; // adapt from your geo resolver
  const countryCode = "US";

  const doSearch = async () => {
    setLoading(true);
    try {
      // TODO: call your real API here. For now, use a tiny mock that matches structure used by ResultCard/Compare.
      const mock: Package[] = [
        {
          id: "a1",
          origin, destination, departDate: depart, returnDate: ret,
          adults, children, infants,
          flight: {
            carrier_name: "United",
            price_usd: 328,
            segments_out: [
              { from: origin, to: "ORD", depart_time: depart + "T08:10:00", arrive_time: depart + "T10:05:00", duration_minutes: 115 },
              { from: "ORD", to: destination, depart_time: depart + "T11:20:00", arrive_time: depart + "T13:35:00", duration_minutes: 135 },
            ],
            segments_in: ret ? [
              { from: destination, to: "DEN", depart_time: ret + "T10:15:00", arrive_time: ret + "T12:00:00", duration_minutes: 105 },
              { from: "DEN", to: origin, depart_time: ret + "T13:10:00", arrive_time: ret + "T17:25:00", duration_minutes: 255 },
            ] : [],
          },
          hotels: [
            { name: "Skyline Inn", city: destination, address: "123 Main St" },
            { name: "Vista Hotel", city: destination, address: "45 Elm Ave" },
            { name: "Oasis Suites", city: destination, address: "9 Lake Rd" },
          ],
        },
        {
          id: "b2",
          origin, destination, departDate: depart, returnDate: ret,
          adults, children, infants,
          flight: {
            carrier_name: "Delta",
            price_usd: 359,
            segments_out: [
              { from: origin, to: destination, depart_time: depart + "T09:45:00", arrive_time: depart + "T13:00:00", duration_minutes: 195 },
            ],
            segments_in: ret ? [
              { from: destination, to: origin, depart_time: ret + "T16:15:00", arrive_time: ret + "T23:15:00", duration_minutes: 240 },
            ] : [],
          },
          hotels: [
            { name: "Grand Place", city: destination, address: "88 Palm Blvd" },
            { name: "Canyon Lodge", city: destination, address: "7 Desert Way" },
          ],
        },
        {
          id: "c3",
          origin, destination, departDate: depart, returnDate: ret,
          adults, children, infants,
          flight: {
            carrier_name: "American",
            price_usd: 312,
            segments_out: [
              { from: origin, to: "CLT", depart_time: depart + "T06:20:00", arrive_time: depart + "T08:55:00", duration_minutes: 155 },
              { from: "CLT", to: destination, depart_time: depart + "T09:45:00", arrive_time: depart + "T12:20:00", duration_minutes: 155 },
            ],
            segments_in: [],
          },
          hotels: [
            { name: "Neon Plaza", city: destination, address: "200 Strip Rd" },
          ],
        },
      ];

      // Remove any hotel night warning message entirely: not used.

      setResults(mock);
      setComparedIds([]); // reset compare on new search
    } finally {
      setLoading(false);
    }
  };

  const onToggleCompare = (id: string) => {
    setComparedIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // cap 3
      return [...prev, id];
    });
  };

  const comparedItems = useMemo(
    () => results.filter((r) => comparedIds.includes(r.id)),
    [results, comparedIds]
  );

  return (
    <div style={{ padding: "14px 0", display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>Plan your trip</h1>

      {/* Controls */}
      <div className="controls" role="form" aria-label="Search">
        <div className="field">
          <label>From</label>
          <input value={origin} onChange={(e)=>setOrigin(e.target.value.toUpperCase())} placeholder="BOS" />
        </div>
        <div className="field">
          <label>To</label>
          <input value={destination} onChange={(e)=>setDestination(e.target.value.toUpperCase())} placeholder="LAS" />
        </div>
        <div className="field">
          <label>Depart</label>
          <input type="date" value={depart} onChange={(e)=>setDepart(e.target.value)} />
        </div>
        <div className="field">
          <label>Return</label>
          <input type="date" value={ret} onChange={(e)=>setRet(e.target.value)} />
        </div>
        <div className="field">
          <label>Adults</label>
          <input type="number" value={adults} onChange={(e)=>setAdults(Math.max(1, Number(e.target.value)||1))}/>
        </div>
        <div className="field">
          <label>Children</label>
          <input type="number" value={children} onChange={(e)=>setChildren(Math.max(0, Number(e.target.value)||0))}/>
        </div>
      </div>
      <div className="controls" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
        <div className="field">
          <label>Infants</label>
          <input type="number" value={infants} onChange={(e)=>setInfants(Math.max(0, Number(e.target.value)||0))}/>
        </div>
        <div className="field">
          <label className="subtle"> </label>
          <button className="btn brand" onClick={doSearch} disabled={loading}>{loading ? "Searching…" : "Search"}</button>
        </div>
        <div className="field">
          <label className="subtle"> </label>
          <button className="btn" onClick={()=>setShowCompare(true)}>🆚 Compare</button>
        </div>
      </div>

      {/* Results */}
      {!!results.length && (
        <div style={{ display: "grid", gap: 12 }}>
          {results.map((pkg, i) => (
            <ResultCard
              key={pkg.id || i}
              pkg={pkg}
              index={i}
              currency={currency}
              comparedIds={comparedIds}
              onToggleCompare={onToggleCompare}
              large
              showHotel
            />
          ))}
        </div>
      )}

      {/* Explore / Savor / Misc – appear only after search; toggle within component */}
      {!!results.length && (
        <ExploreSavorTabs
          destinationCity={destinationCity}
          destinationCountry={destinationCountry}
          countryCode={countryCode}
          showTabs={true}
        />
      )}

      {showCompare && (
        <ComparePanel
          items={comparedItems}
          currency={currency}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => setComparedIds(prev => prev.filter(x=>x!==id))}
        />
      )}
    </div>
  );
}
