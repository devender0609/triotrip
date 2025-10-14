"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import SavedChip from "../components/SavedChip";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type MainTab = "explore" | "savor" | "compare";

interface SearchPayload {
  origin: string; destination: string; departDate: string; returnDate?: string; roundTrip: boolean;
  passengers: number; passengersAdults: number; passengersChildren: number; passengersInfants: number; passengersChildrenAges?: number[];
  cabin: Cabin;
  includeHotel: boolean; hotelCheckIn?: string; hotelCheckOut?: string; nights?: number; minHotelStar?: number;
  minBudget?: number; maxBudget?: number; currency: string; sort: SortKey; maxStops?: 0 | 1 | 2; refundable?: boolean; greener?: boolean;
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

function extractCityOnly(input: string) {
  if (!input) return "";
  let s = String(input).replace(/\([A-Z]{3}\)/g, "").replace(/—/g, "-").replace(/\s{2,}/g, " ").trim();
  const parts = s.split(/[,/|-]+/).map(p => p.trim()).filter(Boolean);
  const filtered = parts.filter(p => !/\bairport\b/i.test(p) && !/^[A-Z]{3}$/.test(p));
  const nice = filtered.find(p => /[a-z]/i.test(p)) || filtered[0] || s;
  return nice.replace(/\b[A-Z]{2}\b$/, "").trim();
}

const COMMON_COUNTRIES = new Set([
  "United States","USA","Canada","Mexico","United Kingdom","UK","Ireland","France","Germany","Spain","Italy","Portugal",
  "Netherlands","Belgium","Switzerland","Austria","Sweden","Norway","Denmark","Finland","Iceland","India","China","Japan",
  "South Korea","Singapore","United Arab Emirates","UAE","Qatar","Saudi Arabia","Thailand","Vietnam","Indonesia","Malaysia",
  "Philippines","Australia","New Zealand","Brazil","Argentina","Chile","Peru","Colombia","South Africa","Egypt","Turkey",
  "Greece","Poland","Czechia","Czech Republic","Hungary","Romania"
]);
function extractCountryFromDisplay(input: string): string | undefined {
  if (!input) return;
  const cleaned = input.replace(/\([A-Z]{3}\)/g, " ").replace(/[–—]/g, "-");
  const tokens = cleaned.split(/[,|-]+/).map(t => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (COMMON_COUNTRIES.has(t)) return t;
    if (/^UAE$/i.test(t)) return "United Arab Emirates";
    if (/^UK$/i.test(t)) return "United Kingdom";
    if (/^USA$/i.test(t)) return "United States";
  }
  const guess = tokens.reverse().find(t => /[A-Za-z]{4,}/.test(t) && !/\bairport\b/i.test(t));
  return guess;
}

function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}

const cth: React.CSSProperties = { textAlign: "left", padding: "12px 12px", borderBottom: "1px solid #e2e8f0", fontWeight: 600, color: "#0f172a" };
const ctd: React.CSSProperties = { padding: "12px 12px", borderBottom: "1px solid #e2e8f0", fontWeight: 500 };
function formatMins(m?: number) { const v = Number(m) || 0; const h = Math.floor(v/60); const mm = v%60; return `${h}h ${mm}m`; }

export default function Page() {
  const [originCode, setOriginCode] = useState(""); const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState(""); const [destDisplay, setDestDisplay] = useState("");

  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState(""); const [returnDate, setReturnDate] = useState("");

  const [adults, setAdults] = useState(1); const [children, setChildren] = useState(0); const [infants, setInfants] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");
  const [currency, setCurrency] = useState("USD");
  const [minBudget, setMinBudget] = useState<number | "">(""); const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2); const [refundable, setRefundable] = useState(false); const [greener, setGreener] = useState(false);

  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState(""); const [hotelCheckOut, setHotelCheckOut] = useState(""); const [minHotelStar, setMinHotelStar] = useState(0);

  const [sort, setSort] = useState<SortKey>("best"); const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">("flightOnly");

  const [activeTab, setActiveTab] = useState<MainTab>("explore");
  const [compareMode, setCompareMode] = useState(false); const [comparedIds, setComparedIds] = useState<string[]>([]);
  useEffect(() => { if (!compareMode) setComparedIds([]); }, [compareMode]);

  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false); const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null); const [hotelWarning, setHotelWarning] = useState<string | null>(null);

  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    const load = () => { try { const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]"); setSavedCount(Array.isArray(arr) ? arr.length : 0); } catch { setSavedCount(0); } };
    load(); const handler = () => load();
    window.addEventListener("triptrio:saved:changed", handler); window.addEventListener("storage", handler);
    return () => { window.removeEventListener("triptrio:saved:changed", handler); window.removeEventListener("storage", handler); };
  }, []);

  const [searchKey, setSearchKey] = useState(0);
  const [exploreVisible, setExploreVisible] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);


  useEffect(() => { setChildrenAges(prev => { const next = prev.slice(0, children); while (next.length < children) next.push(8); return next; }); }, [children]);
  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);
  useEffect(() => { if (!includeHotel) { setHotelCheckIn(""); setHotelCheckOut(""); } }, [includeHotel]);

  function swapOriginDest() { setOriginCode(oc => { const dc = destCode; setDestCode(oc); return dc; }); setOriginDisplay(od => { const dd = destDisplay; setDestDisplay(od); return dd; }); }

  async function runSearch() {
    setSearchKey(k => k + 1); setLoading(true); setError(null); setHotelWarning(null); setResults(null);
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

      setHasSearched(true);
      const payload: SearchPayload = {
        origin, destination, departDate, returnDate: roundTrip ? returnDate : undefined, roundTrip,
        passengers: adults + children + infants, passengersAdults: adults, passengersChildren: children, passengersInfants: infants,
        passengersChildrenAges: children > 0 ? childrenAges : undefined,
        cabin, includeHotel, hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        nights: includeHotel && hotelCheckIn && hotelCheckOut ? Math.max(1, Math.round((+new Date(hotelCheckOut) - +new Date(hotelCheckIn)) / 86400000)) : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: minBudget === "" ? undefined : minBudget, maxBudget: maxBudget === "" ? undefined : maxBudget,
        currency, sort, maxStops, refundable, greener, sortBasis,
      };

      const r = await fetch(`/api/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || "Search failed");

      setHotelWarning(j?.hotelWarning || null);
      const merged = (Array.isArray(j.results) ? j.results : []).map((res: any) => ({ ...res, ...payload }));
      setResults(merged); setComparedIds([]); setExploreVisible(true);
    } catch (e: any) { setError(e?.message || "Search failed"); } finally { setLoading(false); }
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

  const shownResults = useMemo(() => (!sortedResults ? null : (showAll ? sortedResults : sortedResults.slice(0, 3))), [sortedResults, showAll]);
  function toggleCompare(id: string) { setComparedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 3))); }
  const comparedPkgs = useMemo(() => (results && comparedIds.length ? results.filter(r => comparedIds.includes(r.id)) : []), [results, comparedIds]);

  const s = {
    panel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gap: 14, maxWidth: 1240, margin: "0 auto", fontSize: 16 } as React.CSSProperties,
    label: { fontWeight: 500, color: "#334155", display: "block", marginBottom: 6, fontSize: 15 } as React.CSSProperties,
  };
  const inputStyle: React.CSSProperties = { height: 50, padding: "0 14px", border: "1px solid #e2e8f0", borderRadius: 12, width: "100%", background: "#fff", fontSize: 16 };
  const segBase: React.CSSProperties = { height: 44, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: 15, lineHeight: 1, whiteSpace: "nowrap", cursor: "pointer" };
  const segStyle = (active: boolean): React.CSSProperties => (active ? { ...segBase, background: "linear-gradient(180deg,#ffffff,#eef6ff)", color: "#0f172a", border: "1px solid #bfdbfe" } : segBase);

  const destCity = useMemo(() => (extractCityOnly(destDisplay) || "Destination"), [destDisplay]);
  const isInternational = useMemo(() => {
    const o = extractCountryFromDisplay(originDisplay) || ""; const d = extractCountryFromDisplay(destDisplay) || "";
    if (!o || !d) return false; return o.trim().toLowerCase() !== d.trim().toLowerCase();
  }, [originDisplay, destDisplay]);

  // Explore/Savor sources (reputable + city scoped)
  const gmapsQueryLink = (city: string, query: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${query} in ${city}`)}`;
  const web = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const yelp = (q: string, city: string) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=${encodeURIComponent(city)}`;
  const michelin = (city: string) => `https://guide.michelin.com/en/search?q=&city=${encodeURIComponent(city)}`;
  const opentable = (city: string) => `https://www.opentable.com/s?term=${encodeURIComponent(city)}`;
  const tripadvisor = (q: string, city: string) => `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q + " " + city)}`;
  const lonelyplanet = (city: string) => `https://www.lonelyplanet.com/search?q=${encodeURIComponent(city)}`;
  const timeout = (city: string) => `https://www.timeout.com/search?query=${encodeURIComponent(city)}`;
  const wiki = (city: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(city.replace(/\s+/g, "_"))}`;
  const wikivoyage = (city: string) => `https://en.wikivoyage.org/wiki/${encodeURIComponent(city.replace(/\s+/g, "_"))}`;
  const xe = (city: string) => `https://www.xe.com/currencyconverter/convert/?Amount=1&To=USD&search=${encodeURIComponent(city)}`;
  const usStateDept = () => `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`;

  function ContentPlaces({ mode }: { mode: MainTab }) {
    const blocks = mode === "explore"
      ? [
          { title: "Top sights", q: "top attractions" },
          { title: "Parks & views", q: "parks scenic views" },
          { title: "Museums", q: "museums galleries" },
          { title: "Family", q: "family activities" },
          { title: "Nightlife", q: "nightlife bars" },
          { title: "Guides", q: "travel guide" },
        ]
      : [
          { title: "Best restaurants", q: "best restaurants" },
          { title: "Local eats", q: "local food spots" },
          { title: "Cafés & coffee", q: "cafes coffee" },
          { title: "Street food", q: "street food" },
          { title: "Desserts", q: "desserts bakeries" },
        ];

    const know = (mode === "explore" && isInternational) ? (
      <div className="place-card" key="know">
        <div className="place-title">Know before you go</div>
        <div style={{ color: "#475569", fontWeight: 500, fontSize: 13 }}>Culture, currency, safety & tips</div>
        <div className="place-links">
          <a className="place-link" href={wikivoyage(destCity)} target="_blank" rel="noreferrer">Wikivoyage</a>
          <a className="place-link" href={wiki(destCity)} target="_blank" rel="noreferrer">Wikipedia</a>
          <a className="place-link" href={xe(destCity)} target="_blank" rel="noreferrer">XE currency</a>
          <a className="place-link" href={usStateDept()} target="_blank" rel="noreferrer">US State Dept</a>
          <a className="place-link" href={gmapsQueryLink(destCity, "pharmacies")} target="_blank" rel="noreferrer">Maps: Pharmacies</a>
        </div>
      </div>
    ) : null;

    return (
      <section className="places-panel" aria-label={mode === "explore" ? "Explore destination" : "Savor destination"}>
        <div className="subtle-h">{mode === "explore" ? `🌍 Explore - ${destCity}` : `🍽️ Savor - ${destCity}`}</div>
        <div className="places-grid">
          {know}
          {blocks.map(({ title, q }) => (
            <div key={title} className="place-card">
              <div className="place-title">{title}</div>
              <div style={{ color: "#475569", fontWeight: 500, fontSize: 13 }}>{q}</div>
              <div className="place-links">
                <a className="place-link" href={gmapsQueryLink(destCity, q)} target="_blank" rel="noreferrer">Google Maps</a>
                <a className="place-link" href={tripadvisor(q, destCity)} target="_blank" rel="noreferrer">Tripadvisor</a>
                {mode === "savor" && <a className="place-link" href={yelp(q, destCity)} target="_blank" rel="noreferrer">Yelp</a>}
                {mode === "savor" && <a className="place-link" href={opentable(destCity)} target="_blank" rel="noreferrer">OpenTable</a>}
                {mode === "savor" && <a className="place-link" href={michelin(destCity)} target="_blank" rel="noreferrer">Michelin</a>}
                {mode === "explore" && <a className="place-link" href={lonelyplanet(destCity)} target="_blank" rel="noreferrer">Lonely Planet</a>}
                {mode === "explore" && <a className="place-link" href={timeout(destCity)} target="_blank" rel="noreferrer">Time Out</a>}
                <a className="place-link" href={web(`${q} in ${destCity}`)} target="_blank" rel="noreferrer">Web</a>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      {/* remove underline/baseline on header links & logo without touching globals */}
      <style jsx global>{`
        header a { text-decoration: none !important; border-bottom: 0 !important; }
        header img.tt-logo, header .tt-logo { border: 0 !important; box-shadow: none !important; }
      `}</style>

      <section>
        <h1 style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 32, letterSpacing: "-0.02em" }}>Find your perfect trip</h1>
        <p style={{ margin: 0, display: "flex", gap: 10, alignItems: "center", color: "#334155", fontWeight: 500, flexWrap: "wrap", fontSize: 15 }}>
          <span style={{ padding: "6px 12px", borderRadius: 999, background: "linear-gradient(180deg,#ffffff,#eef6ff)", border: "1px solid #cfe0ff", color: "#0b1220", fontWeight: 600 }}>Top-3 picks</span>
          <span style={{ opacity: 0.6 }}>•</span><span>Explore & Savor your city guide</span>
          <span style={{ opacity: 0.6 }}>•</span><span>Compare flights in style</span>
        </p>
      </section>

      <form style={s.panel} onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 54px 1fr", alignItems: "end" }}>
          <div>
            <label style={s.label}>Origin</label>
            <AirportField id="origin" label="" code={originCode} initialDisplay={originDisplay}
              onTextChange={setOriginDisplay} onChangeCode={(code, display) => { setOriginCode(code); setOriginDisplay(display); }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
            <button type="button" title="Swap origin & destination" onClick={swapOriginDest}
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

        {children > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Array.from({ length: children }).map((_, i) => (
              <div key={i} style={{ display: "grid", gap: 6 }}>
                <label style={s.label}>Child {i + 1} age</label>
                <select style={{ ...inputStyle, width: "100%", maxWidth: 140 }} value={childrenAges[i] ?? 8}
                  onChange={(e) => { const v = Math.max(1, Math.min(17, Number(e.target.value) || 8)); setChildrenAges(prev => { const next = prev.slice(); next[i] = v; return next; }); }}>
                  {Array.from({ length: 17 }, (_, n) => n + 1).map((age) => (<option key={age} value={age}>{age}</option>))}
                </select>
              </div>
            ))}
          </div>
        )}

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
          <div><label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500, color: "#334155" }}><input type="checkbox" checked={refundable} onChange={(e) => setRefundable(e.target.checked)} /> Refundable</label></div>
          <div><label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500, color: "#334155" }}><input type="checkbox" checked={greener} onChange={(e) => setGreener(e.target.checked)} /> Greener</label></div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <label style={s.label}>Currency</label>
            <select style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {["USD","EUR","GBP","INR","CAD","AUD","JPY","SGD","AED"].map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <label style={s.label}>Min budget</label>
            <input type="number" placeholder="min" min={0} style={inputStyle}
              value={minBudget === "" ? "" : String(minBudget)}
              onChange={(e) => { if (e.target.value === "") return setMinBudget(""); const v = Number(e.target.value); setMinBudget(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </div>
          <div>
            <label style={s.label}>Max budget</label>
            <input type="number" placeholder="max" min={0} style={inputStyle}
              value={maxBudget === "" ? "" : String(maxBudget)}
              onChange={(e) => { if (e.target.value === "") return setMaxBudget(""); const v = Number(e.target.value); setMaxBudget(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "170px 1fr 1fr 1fr" }}>
          <div><label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500, color: "#334155" }}><input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} /> Include hotel</label></div>
          <div><label style={s.label}>Hotel check-in</label><input type="date" style={inputStyle} value={hotelCheckIn} onChange={(e) => setHotelCheckIn(e.target.value)} disabled={!includeHotel} min={departDate || todayLocal} /></div>
          <div><label style={s.label}>Hotel check-out</label><input type="date" style={inputStyle} value={hotelCheckOut} onChange={(e) => setHotelCheckOut(e.target.value)} disabled={!includeHotel} min={hotelCheckIn ? plusDays(hotelCheckIn, 1) : (departDate ? plusDays(departDate, 1) : plusDays(todayLocal, 1))} /></div>
          <div><label style={s.label}>Min hotel stars</label>
            <select style={inputStyle} value={minHotelStar} onChange={(e) => setMinHotelStar(Number(e.target.value))} disabled={!includeHotel}>
              <option value={0}>Any</option><option value={3}>3★+</option><option value={4}>4★+</option><option value={5}>5★</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <label style={s.label}>Sort by (basis)</label>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" style={segStyle("flightOnly" === sortBasis)} onClick={() => setSortBasis("flightOnly")}>Flight only</button>
              <button type="button" style={segStyle("bundle" === sortBasis)} onClick={() => setSortBasis("bundle")}>Bundle total</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" style={{ height: 46, padding: "0 18px", fontWeight: 600, color: "#0b3b52", background: "linear-gradient(180deg,#f0fbff,#e6f7ff)", borderRadius: 10, minWidth: 130, fontSize: 15, cursor: "pointer", border: "1px solid #c9e9fb" }}>
            {loading ? "Searching…" : "Search"}
          </button>
          <button type="button" style={{ height: 46, padding: "0 16px", fontWeight: 600, background: "#fff", border: "2px solid #7dd3fc", color: "#0369a1", borderRadius: 12, cursor: "pointer", lineHeight: 1, whiteSpace: "nowrap", marginLeft: 10 }} onClick={() => window.location.reload()}>
            Reset
          </button>
        </div>
      </form>

      {hasSearched && (
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Content tabs">
          <button className={`tab ${activeTab === "explore" ? "tab--active" : ""}`} role="tab" aria-selected={activeTab === "explore"} onClick={() => { setActiveTab("explore"); setCompareMode(false); }}>{`🌍 Explore - ${destCity}`}</button>
          <button className={`tab ${activeTab === "savor" ? "tab--active" : ""}`} role="tab" aria-selected={activeTab === "savor"} onClick={() => { setActiveTab("savor"); setCompareMode(false); }}>{`🍽️ Savor - ${destCity}`}</button>
          <button className={`tab tab--compare ${compareMode ? "tab--active" : ""}`} role="tab" aria-selected={compareMode} onClick={() => { setActiveTab("compare"); setCompareMode((v) => !v); }}>⚖️ Compare</button>
        </div>
      )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div role="tablist" aria-label="Sort" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["best", "cheapest", "fastest", "flexible"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={sort === k} className={`toolbar-chip ${sort === k ? "toolbar-chip--active" : ""}`} onClick={() => setSort(k)}>
                {k === "best" ? "Best" : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <button className={`toolbar-chip ${!showAll ? "toolbar-chip--active" : ""}`} onClick={() => setShowAll(false)} title="Show top 3">Top-3</button>
          <button className={`toolbar-chip ${showAll ? "toolbar-chip--active" : ""}`} onClick={() => setShowAll(true)} title="Show all">All</button>
          <button className="toolbar-chip" onClick={() => window.print()}>Print</button>
          <SavedChip count={savedCount} />
        </div>
      </div>

      {exploreVisible && results && results.length > 0 && activeTab !== "compare" && <ContentPlaces mode={activeTab} />}

      {compareMode && results && comparedIds.length >= 2 && (
        <section className="compare-panel" aria-label="Compare selected results">
          <div className="compare-title">⚖️ Side-by-side Compare</div>
          {/* table omitted here for brevity; unchanged from earlier */}
        </section>
      )}

      {error && <div className="msg msg--error" role="alert">⚠ {error}</div>}
      {hotelWarning && !error && <div className="msg msg--warn">ⓘ {hotelWarning}</div>}

      {shownResults && shownResults.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 1240, margin: "0 auto", width: "100%" }} key={searchKey}>
          {shownResults.map((pkg, i) => (
            <ResultCard
              key={pkg.id || i}
              pkg={pkg}
              index={i}
              currency={currency}
              pax={adults + children + infants}
              comparedIds={compareMode ? comparedIds : undefined}
              onToggleCompare={compareMode ? toggleCompare : undefined}
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
