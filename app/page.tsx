// app/page.tsx
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

  /* NEW: tab panel visibility toggles */
  const [showExplorePanel, setShowExplorePanel] = useState(false);
  const [showSavorPanel, setShowSavorPanel] = useState(false);

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
      setResults(merged); setComparedIds([]);

      /* after a search: show tabs area, but keep panels hidden until user clicks */
      setActiveTab("explore");
      setShowExplorePanel(false);
      setShowSavorPanel(false);
      setCompareMode(false);
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
  const segBase: React.CSSProperties = { height: 44, padding: "0 14px", borderRadius: 10, border: "1px solid "#e2e8f0", background: "#fff", fontWeight: 600, fontSize: 15, lineHeight: 1, whiteSpace: "nowrap", cursor: "pointer" } as any;
  const segStyle = (active: boolean): React.CSSProperties => (active ? { ...segBase, background: "linear-gradient(180deg,#ffffff,#eef6ff)", color: "#0f172a", border: "1px solid #bfdbfe" } : segBase);

  const destCity = useMemo(() => (extractCityOnly(destDisplay) || "Destination"), [destDisplay]);
  const isInternational = useMemo(() => {
    const o = extractCountryFromDisplay(originDisplay) || ""; const d = extractCountryFromDisplay(destDisplay) || "";
    if (!o || !d) return false; return o.trim().toLowerCase() !== d.trim().toLowerCase();
  }, [originDisplay, destDisplay]);

  // Explore/Savor/Know sources: TOP 5 reliable worldwide
  const url = {
    gmapsQuery: (city: string, query: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${query} in ${city}`)}`,
    web: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    yelp: (q: string, city: string) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=${encodeURIComponent(city)}`,
    michelin: (city: string) => `https://guide.michelin.com/en/search?q=&city=${encodeURIComponent(city)}`,
    opentable: (city: string) => `https://www.opentable.com/s?term=${encodeURIComponent(city)}`,
    tripadvisor: (q: string, city: string) => `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q + " " + city)}`,
    lonelyplanet: (city: string) => `https://www.lonelyplanet.com/search?q=${encodeURIComponent(city)}`,
    timeout: (city: string) => `https://www.timeout.com/search?query=${encodeURIComponent(city)}`,
    culturetrip: (city: string) => `https://theculturetrip.com/search?query=${encodeURIComponent(city)}`,
    googleTravelGuide: (city: string) => `https://www.google.com/travel/things-to-do?dest=${encodeURIComponent(city)}`,
    xe: (city: string) => `https://www.xe.com/currencyconverter/convert/?Amount=1&To=USD&search=${encodeURIComponent(city)}`,
    usStateDept: () => `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`,
  };

  function ContentPlaces({ mode }: { mode: MainTab }) {
    const blocks = mode === "explore"
      ? [
          { title: "Top sights", q: "top attractions", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "top attractions")],
            ["Tripadvisor", url.tripadvisor("top attractions", city)],
            ["Lonely Planet", url.lonelyplanet(city)],
            ["Time Out", url.timeout(city)],
            ["Culture Trip", url.culturetrip(city)],
          ]},
          { title: "Parks & views", q: "parks scenic views", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "parks scenic views")],
            ["Tripadvisor", url.tripadvisor("parks scenic views", city)],
            ["Lonely Planet", url.lonelyplanet(city)],
            ["Time Out", url.timeout(city)],
            ["Culture Trip", url.culturetrip(city)],
          ]},
          { title: "Museums", q: "museums", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "museums")],
            ["Tripadvisor", url.tripadvisor("museums", city)],
            ["Lonely Planet", url.lonelyplanet(city)],
            ["Time Out", url.timeout(city)],
            ["Culture Trip", url.culturetrip(city)],
          ]},
          { title: "Family", q: "family activities", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "family activities")],
            ["Tripadvisor", url.tripadvisor("family activities", city)],
            ["Lonely Planet", url.lonelyplanet(city)],
            ["Time Out", url.timeout(city)],
            ["Culture Trip", url.culturetrip(city)],
          ]},
          { title: "Nightlife", q: "nightlife", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "nightlife")],
            ["Tripadvisor", url.tripadvisor("nightlife", city)],
            ["Lonely Planet", url.lonelyplanet(city)],
            ["Time Out", url.timeout(city)],
            ["Culture Trip", url.culturetrip(city)],
          ]},
        ]
      : [
          { title: "Best restaurants", q: "best restaurants", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "best restaurants")],
            ["Yelp", url.yelp("restaurants", city)],
            ["OpenTable", url.opentable(city)],
            ["Michelin", url.michelin(city)],
            ["Zomato", `https://www.zomato.com/search?city=${encodeURIComponent(city)}`],
          ]},
          { title: "Local eats", q: "local food", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "local food")],
            ["Yelp", url.yelp("local food", city)],
            ["OpenTable", url.opentable(city)],
            ["Michelin", url.michelin(city)],
            ["Zomato", `https://www.zomato.com/search?city=${encodeURIComponent(city)}`],
          ]},
          { title: "Cafés & coffee", q: "cafes coffee", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "cafes coffee")],
            ["Yelp", url.yelp("coffee", city)],
            ["OpenTable", url.opentable(city)],
            ["Michelin", url.michelin(city)],
            ["Zomato", `https://www.zomato.com/search?city=${encodeURIComponent(city)}`],
          ]},
          { title: "Street food", q: "street food", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "street food")],
            ["Yelp", url.yelp("street food", city)],
            ["OpenTable", url.opentable(city)],
            ["Michelin", url.michelin(city)],
            ["Zomato", `https://www.zomato.com/search?city=${encodeURIComponent(city)}`],
          ]},
          { title: "Desserts", q: "desserts", links: (city: string) => [
            ["Google Maps", url.gmapsQuery(city, "desserts")],
            ["Yelp", url.yelp("desserts", city)],
            ["OpenTable", url.opentable(city)],
            ["Michelin", url.michelin(city)],
            ["Zomato", `https://www.zomato.com/search?city=${encodeURIComponent(city)}`],
          ]},
        ];

    const know = (mode === "explore" && isInternational) ? (
      <div className="place-card" key="know">
        <div className="place-title">Know before you go</div>
        <div style={{ color: "#475569", fontWeight: 500, fontSize: 13 }}>Culture, currency, safety & tips</div>
        <div className="place-links">
          <a className="place-link" href={url.lonelyplanet(destCity)} target="_blank" rel="noreferrer">Lonely Planet</a>
          <a className="place-link" href={url.usStateDept()} target="_blank" rel="noreferrer">US State Dept</a>
          <a className="place-link" href={url.xe(destCity)} target="_blank" rel="noreferrer">XE currency</a>
          <a className="place-link" href={url.googleTravelGuide(destCity)} target="_blank" rel="noreferrer">Google Travel</a>
          <a className="place-link" href={url.culturetrip(destCity)} target="_blank" rel="noreferrer">Culture Trip</a>
        </div>
      </div>
    ) : null;

    return (
      <section className="places-panel" aria-label={mode === "explore" ? "Explore destination" : "Savor destination"}>
        <div className="subtle-h">{mode === "explore" ? `🌍 Explore - ${destCity}` : `🍽️ Savor - ${destCity}`}</div>
        <div className="places-grid">
          {know}
          {blocks.map(({ title, q, links }) => (
            <div key={title} className="place-card">
              <div className="place-title">{title}</div>
              <div style={{ color: "#475569", fontWeight: 500, fontSize: 13 }}>{q}</div>
              <div className="place-links">
                {links(destCity).map(([label, href]) => (
                  <a key={label as string} className="place-link" href={href as string} target="_blank" rel="noreferrer">{label as string}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* header links cleanup (no underlines) */
  const headerNoUnderline = (
    <style jsx global>{`
      header a { text-decoration: none !important; border-bottom: 0 !important; }
      header img.tt-logo, header .tt-logo { border: 0 !important; box-shadow: none !important; }
    `}</style>
  );

  /* tab handlers that toggle visibility */
  const clickExplore = () => {
    setActiveTab("explore");
    setCompareMode(false);
    setShowExplorePanel(v => !v);
    if (showSavorPanel) setShowSavorPanel(false);
  };
  const clickSavor = () => {
    setActiveTab("savor");
    setCompareMode(false);
    setShowSavorPanel(v => !v);
    if (showExplorePanel) setShowExplorePanel(false);
  };
  const clickCompare = () => {
    setActiveTab("compare");
    setCompareMode(v => !v);
    setShowExplorePanel(false);
    setShowSavorPanel(false);
  };

  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      {headerNoUnderline}

      <section>
        <h1 style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 32, letterSpacing: "-0.02em" }}>Find your perfect trip</h1>
        <p style={{ margin: 0, display: "flex", gap: 10, alignItems: "center", color: "#334155", fontWeight: 500, flexWrap: "wrap", fontSize: 15 }}>
          <span style={{ padding: "6px 12px", borderRadius: 999, background: "linear-gradient(180deg,#ffffff,#eef6ff)", border: "1px solid #cfe0ff", color: "#0b1220", fontWeight: 600 }}>Top-3 picks</span>
          <span style={{ opacity: 0.6 }}>•</span><span>Explore & Savor your city guide</span>
          <span style={{ opacity: 0.6 }}>•</span><span>Compare flights in style</span>
        </p>
      </section>

      <form style={s.panel} onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
        {/* Search form */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
            <div>
              <label style={s.label}>From</label>
              <AirportField id="from" label="Origin" initialDisplay={originDisplay} onTextChange={setOriginDisplay} onChangeCode={(c:string, d:string)=>{ setOriginCode(c); setOriginDisplay(d); }} />
            </div>
            <div>
              <label style={s.label}>To</label>
              <AirportField id="to" label="Destination" initialDisplay={destDisplay} onTextChange={setDestDisplay} onChangeCode={(c:string, d:string)=>{ setDestCode(c); setDestDisplay(d); }} />
            </div>
            <div style={{ display: "grid", alignItems: "end" }}>
              <button type="button" onClick={swapOriginDest} className="toolbar-chip">Swap</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={segStyle(roundTrip)} onClick={()=>setRoundTrip(true)}>Round trip</button>
            <button type="button" style={segStyle(!roundTrip)} onClick={()=>setRoundTrip(false)}>One way</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: roundTrip ? "repeat(2,1fr)" : "1fr", gap: 10 }}>
            <div>
              <label style={s.label}>Depart</label>
              <input type="date" style={inputStyle} min={todayLocal} value={departDate} onChange={e=>setDepartDate(e.target.value)} />
            </div>
            {roundTrip && (
              <div>
                <label style={s.label}>Return</label>
                <input type="date" style={inputStyle} min={departDate || todayLocal} value={returnDate} onChange={e=>setReturnDate(e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <div>
              <label style={s.label}>Adults</label>
              <div className="stepper">
                <button type="button" onClick={()=>setAdults(Math.max(1, adults-1))}>-</button>
                <input readOnly value={adults} />
                <button type="button" onClick={()=>setAdults(adults+1)}>+</button>
              </div>
            </div>
            <div>
              <label style={s.label}>Children</label>
              <div className="stepper">
                <button type="button" onClick={()=>setChildren(Math.max(0, children-1))}>-</button>
                <input readOnly value={children} />
                <button type="button" onClick={()=>setChildren(children+1)}>+</button>
              </div>
            </div>
            <div>
              <label style={s.label}>Infants</label>
              <div className="stepper">
                <button type="button" onClick={()=>setInfants(Math.max(0, infants-1))}>-</button>
                <input readOnly value={infants} />
                <button type="button" onClick={()=>setInfants(infants+1)}>+</button>
              </div>
            </div>
            <div>
              <label style={s.label}>Cabin</label>
              <select style={inputStyle} value={cabin} onChange={e=>setCabin(e.target.value as Cabin)}>
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </div>
          </div>

          {children > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${children}, minmax(120px, 1fr))`, gap: 10 }}>
              {Array.from({ length: children }).map((_, i) => (
                <div key={i}>
                  <label style={s.label}>Child {i+1} age</label>
                  <select style={inputStyle} value={childrenAges[i] ?? 8} onChange={(e)=>{
                    const v = Number(e.target.value) || 8;
                    setChildrenAges(prev => { const next = [...prev]; next[i] = v; return next; });
                  }}>
                    {Array.from({ length: 17 }).map((_, k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <div>
              <label style={s.label}>Currency</label>
              <select style={inputStyle} value={currency} onChange={e=>setCurrency(e.target.value)}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>AED</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Max stops</label>
              <select style={inputStyle} value={maxStops} onChange={e=>setMaxStops(Number(e.target.value) as any)}>
                <option value={0}>Nonstop</option><option value={1}>Up to 1</option><option value={2}>Any</option>
              </select>
            </div>
            <div style={{ display: "grid", alignItems: "end" }}>
              <label style={s.label}>Options</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label><input type="checkbox" checked={refundable} onChange={e=>setRefundable(e.target.checked)} /> Refundable</label>
                <label><input type="checkbox" checked={greener} onChange={e=>setGreener(e.target.checked)} /> Greener</label>
              </div>
            </div>
            <div>
              <label style={s.label}>Sort by</label>
              <select style={inputStyle} value={sort} onChange={e=>setSort(e.target.value as SortKey)}>
                <option value="best">Best</option><option value="cheapest">Cheapest</option><option value="fastest">Fastest</option><option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <div>
              <label style={s.label}>Min budget</label>
              <input type="number" style={inputStyle} value={minBudget} onChange={e=>setMinBudget(e.target.value===""? "": Number(e.target.value))} />
            </div>
            <div>
              <label style={s.label}>Max budget</label>
              <input type="number" style={inputStyle} value={maxBudget} onChange={e=>setMaxBudget(e.target.value===""? "": Number(e.target.value))} />
            </div>
            <div>
              <label style={s.label}>Sort basis</label>
              <select style={inputStyle} value={sortBasis} onChange={e=>setSortBasis(e.target.value as any)}>
                <option value="flightOnly">Flight price</option>
                <option value="bundle">Bundle total</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input id="includeHotel" type="checkbox" checked={includeHotel} onChange={e=>setIncludeHotel(e.target.checked)} />
              <label htmlFor="includeHotel">Include hotel</label>
            </div>
            <div>
              <label style={s.label}>Check-in</label>
              <input type="date" disabled={!includeHotel} style={inputStyle} min={todayLocal} value={hotelCheckIn} onChange={e=>setHotelCheckIn(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Check-out</label>
              <input type="date" disabled={!includeHotel} style={inputStyle} min={hotelCheckIn || todayLocal} value={hotelCheckOut} onChange={e=>setHotelCheckOut(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Min hotel stars</label>
              <select disabled={!includeHotel} style={inputStyle} value={minHotelStar} onChange={e=>setMinHotelStar(Number(e.target.value))}>
                <option value={0}>Any</option><option value={2}>2+</option><option value={3}>3+</option><option value={4}>4+</option><option value={5}>5</option>
              </select>
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
        </div>
      </form>

      {/* TABS: now show ONLY after search results exist */}
      {results && results.length > 0 && (
        <div className="toolbar">
          <div className="tabs" role="tablist" aria-label="Content tabs">
            <button className={`tab ${activeTab === "explore" ? "tab--active" : ""}`} role="tab" aria-selected={activeTab === "explore"} onClick={clickExplore}>{`🌍 Explore - ${destCity}`}</button>
            <button className={`tab ${activeTab === "savor" ? "tab--active" : ""}`} role="tab" aria-selected={activeTab === "savor"} onClick={clickSavor}>{`🍽️ Savor - ${destCity}`}</button>
            <button className={`tab tab--compare ${compareMode ? "tab--active" : ""}`} role="tab" aria-selected={compareMode} onClick={clickCompare}>⚖️ Compare</button>
          </div>

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
      )}

      {/* Panels toggle independently on click; disappear if clicked again */}
      {results && results.length > 0 && activeTab === "explore" && showExplorePanel && <ContentPlaces mode="explore" />}
      {results && results.length > 0 && activeTab === "savor" && showSavorPanel && <ContentPlaces mode="savor" />}

      {compareMode && results && comparedIds.length >= 2 && (
        <section className="compare-panel" aria-label="Compare selected results">
          <div className="compare-title">⚖️ Side-by-side Compare</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={cth}>Airline</th>
                  <th style={cth}>Route</th>
                  <th style={cth}>Depart</th>
                  <th style={cth}>Return</th>
                  <th style={cth}>Price</th>
                  <th style={cth}>Stops</th>
                  <th style={cth}>Refundable</th>
                </tr>
              </thead>
              <tbody>
                {comparedPkgs.map((p:any, i:number) => (
                  <tr key={i}>
                    <td style={ctd}>{p.flight?.carrier_name || p.flight?.carrier || "Airline"}</td>
                    <td style={ctd}>{(p.origin || p.flight?.segments_out?.[0]?.from || "")} → {(p.destination || p.flight?.segments_out?.slice(-1)[0]?.to || "")}</td>
                    <td style={ctd}>{(p.flight?.segments_out?.[0]?.depart_time || "").slice(0,10)}</td>
                    <td style={ctd}>{(p.flight?.segments_in?.[0]?.depart_time || "").slice(0,10)}</td>
                    <td style={ctd}>{Math.round(Number(p.total_cost ?? p.flight_total ?? p.flight?.price_usd_converted ?? p.flight?.price_usd ?? 0)).toLocaleString()} {p.currency || "USD"}</td>
                    <td style={ctd}>{(p.flight?.segments_out?.length ?? 1) - 1}</td>
                    <td style={ctd}>{p.flight?.refundable ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
