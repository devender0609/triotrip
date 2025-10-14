"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import SavedChip from "../components/SavedChip";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type SortBasis = "flightOnly" | "bundle";
type MainTab = "explore" | "savor" | "compare";

interface SearchPayload {
  origin: string; destination: string; departDate: string; returnDate?: string; roundTrip: boolean;
  passengers: number; passengersAdults: number; passengersChildren: number; passengersInfants: number; passengersChildrenAges?: number[];
  cabin: Cabin; includeHotel: boolean; hotelCheckIn?: string; hotelCheckOut?: string; nights?: number;
  minHotelStar?: number; minBudget?: number | ""; maxBudget?: number | ""; currency: string;
  sort: SortKey; maxStops?: number; refundable?: boolean; greener?: boolean; sortBasis: SortBasis;
}

function extractIATA(s: string) {
  const m = /\(([A-Z]{3})\)/.exec(s || ""); return m ? m[1] : (s || "").toUpperCase().slice(0, 3);
}
function extractCityOnly(s: string) {
  if (!s) return "";
  if (/\([A-Z]{3}\)/.test(s)) {
    // "Austin (AUS), United States" -> "Austin"
    const city = s.split("(")[0].trim();
    return city.replace(/,\s*.+$/, "");
  }
  return s.split(",")[0].trim();
}
function extractCountryFromDisplay(s: string) {
  const parts = (s || "").split(",").map(p => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Page() {
  const [originCode, setOriginCode] = useState(""); const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState(""); const [destDisplay, setDestDisplay] = useState("");

  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState(""); const [returnDate, setReturnDate] = useState("");
  const todayLocal = todayLocalISO();

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);

  const [cabin, setCabin] = useState<Cabin>("ECONOMY");
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState(""); const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState<number>(3);

  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [currency, setCurrency] = useState("USD");
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<SortBasis>("flightOnly");
  const [maxStops, setMaxStops] = useState<number | undefined>();
  const [refundable, setRefundable] = useState(false);
  const [greener, setGreener] = useState(false);

  const [activeTab, setActiveTab] = useState<MainTab>("explore");
  const [compareMode, setCompareMode] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  useEffect(() => { if (!compareMode) setComparedIds([]); }, [compareMode]);

  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false); const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null); const [hotelWarning, setHotelWarning] = useState<string | null>(null);

  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    const load = () => { try { const a = localStorage.getItem("savedCount"); if (a) setSavedCount(Number(a) || 0); } catch {} };
    load(); window.addEventListener("storage", load); return () => window.removeEventListener("storage", load);
  }, []);

  const [searchKey, setSearchKey] = useState(0);
  const [exploreVisible, setExploreVisible] = useState(false);
  const [tabsEnabled, setTabsEnabled] = useState(false);
  const [showTabContent, setShowTabContent] = useState(false);

  useEffect(() => {
    setChildrenAges(prev => {
      const next = prev.slice();
      while (next.length > children) next.pop();
      while (next.length < children) next.push(8);
      return next;
    });
  }, [children]);
  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);

  function swapOriginDest() {
    const oc = originCode; const od = originDisplay; const dc = destCode; const dd = destDisplay;
    setOriginCode(dc); setOriginDisplay(dd); setDestCode(oc); setDestDisplay(od);
  }

  function ensureISO(s?: string) { return (s || "").slice(0, 10); }

  async function runSearch() {
    setSearchKey(k => k + 1); setLoading(true); setError(null); setHotelWarning(null); setResults(null);
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
        if (hotelCheckIn < todayLocal) throw new Error("Hotel check-in can’t be in the past.");
        if (hotelCheckOut <= hotelCheckIn) throw new Error("Hotel check-out must be after check-in.");
      }
      if (minBudget !== "" && minBudget < 0) throw new Error("Min budget cannot be negative.");
      if (maxBudget !== "" && maxBudget < 0) throw new Error("Max budget cannot be negative.");
      if (typeof minBudget === "number" && typeof maxBudget === "number" && minBudget > maxBudget) {
        throw new Error("Min budget cannot be greater than max budget.");
      }

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

      // attach prefilled booking links
      setResults(merged.map((res: any) => ({ ...res, bookingLinks: buildBookingLinks(res) })));
      // enable tabs but do not auto-show tab content
      setComparedIds([]); setExploreVisible(false); setTabsEnabled(true); setShowTabContent(false);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // ---- Sorting / display helpers ----
  const sortedResults = useMemo(() => {
    if (!results) return null;
    const items = results.slice();
    const outDur = (r: any) => Number(r?.flight?.duration_minutes || r?.duration_minutes || 0);
    const basisValue = (r: any) => {
      if (sortBasis === "bundle") return Number(r?.display_total || r?.total_cost || r?.flight_total || 0);
      return Number(r?.flight?.price_usd || r?.price_usd || r?.total_cost || 0);
    };
    if (sort === "cheapest") items.sort((a, b) => basisValue(a)! - basisValue(b)!);
    else if (sort === "fastest") items.sort((a, b) => outDur(a)! - outDur(b)!);
    else if (sort === "flexible") items.sort((a, b) => (a.flight?.refundable ? 0 : 1) - (b.flight?.refundable ? 0 : 1) || (basisValue(a)! - basisValue(b)!));
    else items.sort((a, b) => (basisValue(a)! - basisValue(b)!) || (outDur(a)! - outDur(b)!));
    return items;
  }, [results, sort, sortBasis]);

  const shownResults = useMemo(() => (!sortedResults ? null : (showAll ? sortedResults : sortedResults.slice(0, 3))), [sortedResults, showAll]);

  function toggleCompare(id: string) { setComparedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 3))); }

  // ---- Styles ----
  const s = {
    panel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, maxWidth: 1240, margin: "0 auto", fontSize: 16 } as React.CSSProperties,
    label: { fontWeight: 500, color: "#334155", display: "block", marginBottom: 6, fontSize: 15 } as React.CSSProperties,
  };
  const inputStyle: React.CSSProperties = { height: 46, border: "1px solid #cbd5e1", borderRadius: 10, width: "100%", padding: "0 12px", fontSize: 16 };
  const segBase: React.CSSProperties = { height: 44, padding: "0 12px", borderRadius: 10, fontWeight: 700, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" };
  const segStyle = (active: boolean): React.CSSProperties => (active ? { ...segBase, background: "#e6f1ff", borderColor: "#93c5fd", color: "#0b3d91" } : segBase);

  const destCity = useMemo(() => (extractCityOnly(destDisplay) || "Destination"), [destDisplay]);
  const isInternational = useMemo(() => {
    const o = extractCountryFromDisplay(originDisplay) || ""; const d = extractCountryFromDisplay(destDisplay) || "";
    if (!o || !d) return false; return o.trim().toLowerCase() !== d.trim().toLowerCase();
  }, [originDisplay, destDisplay]);

  // Explore/Savor sources
  const gmapsQueryLink = (city: string, query: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${query} in ${city}`)}`;
  const web = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const yelp = (q: string, city: string) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=${encodeURIComponent(city)}`;
  const michelin = (city: string) => `https://guide.michelin.com/en/search?q=&city=${encodeURIComponent(city)}`;
  const opentable = (city: string) => `https://www.opentable.com/s?term=${encodeURIComponent(city)}`;
  const tripadvisor = (q: string, city: string) => `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${q} ${city}`)}`;

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
          { title: "Reservations", q: "restaurants reservations" },
        ];
    const city = extractCityOnly(destDisplay) || extractIATA(destDisplay) || "city";

    return (
      <section aria-label={`${mode} in ${city}`} style={{ marginTop: 16 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 12
        }}>
          {blocks.map((b) => (
            <article key={b.title} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "linear-gradient(180deg,#ffffff,#f0f7ff)" }}>
              <h4 style={{ margin: 0, fontSize: 16 }}>{b.title}</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <a href={gmapsQueryLink(city, b.q)} target="_blank" rel="noreferrer">Maps</a>
                <a href={yelp(b.q, city)} target="_blank" rel="noreferrer">Yelp</a>
                <a href={tripadvisor(b.q, city)} target="_blank" rel="noreferrer">TripAdvisor</a>
                {mode === "savor" ? (
                  <>
                    <a href={michelin(city)} target="_blank" rel="noreferrer">Michelin</a>
                    <a href={opentable(city)} target="_blank" rel="noreferrer">OpenTable</a>
                  </>
                ) : (
                  <a href={web(`${b.q} ${city}`)} target="_blank" rel="noreferrer">Web</a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  // Build prefilled booking links per result (used in cards + compare)
  function buildBookingLinks(pkg: any) {
    try {
      const from = (pkg.origin || pkg.from || pkg.flight?.segments_out?.[0]?.from || "").toUpperCase();
      const to = (pkg.destination || pkg.to || pkg.flight?.segments_out?.slice(-1)[0]?.to || "").toUpperCase();
      const out0 = (pkg.flight?.segments_out || [])[0] || {};
      const ret0 = (pkg.flight?.segments_in || [])[0] || {};
      const dateOut = (pkg.departDate || out0.depart_time || "").slice(0,10);
      const dateRet = (pkg.returnDate || ret0.depart_time || "").slice(0,10);
      const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
      const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
      const infants = Number(pkg.passengersInfants ?? pkg.infants ?? 0) || 0;

      const origin = (typeof window !== "undefined" && window.location && window.location.origin) || "";
      const triobase = origin || (process.env.NEXT_PUBLIC_TRIOTRIP_BASE || "https://triotrip.ai");
      const triptrio = `${triobase}/book?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&depart=${encodeURIComponent(dateOut)}${dateRet?`&return=${encodeURIComponent(dateRet)}`:""}&adults=${adults}&children=${children}&infants=${infants}`;

      const airline = pkg.flight?.carrier_name || "";
      const AIRLINE_SITE: Record<string,string> = {
        American:"https://www.aa.com","American Airlines":"https://www.aa.com",
        Delta:"https://www.delta.com","Delta Air Lines":"https://www.delta.com",
        United:"https://www.united.com","United Airlines":"https://www.united.com",
        Alaska:"https://www.alaskaair.com","Alaska Airlines":"https://www.alaskaair.com",
        Southwest:"https://www.southwest.com", JetBlue:"https://www.jetblue.com",
        Lufthansa:"https://www.lufthansa.com", Qatar:"https://www.qatarairways.com",
        Emirates:"https://www.emirates.com", "Air France":"https://wwws.airfrance.us",
        KLM:"https://www.klm.com", ANA:"https://www.ana.co.jp", JAL:"https://www.jal.co.jp",
        "British Airways":"https://www.britishairways.com",
      };
      const airlineSite = AIRLINE_SITE[airline] || `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`;

      const gflightsQ = `${from} to ${to}${dateOut?` on ${dateOut}`:""}${dateRet?` returning ${dateRet}`:""} for ${Math.max(1, adults+children+infants)} travelers`;
      const googleFlights = `https://www.google.com/travel/flights?q=${encodeURIComponent(gflightsQ)}`;

      const ssOut = (dateOut || "").replace(/-/g, "");
      const ssRet = (dateRet || "").replace(/-/g, "");
      const skyscanner =
        from && to && ssOut
          ? `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${ssOut}/${dateRet ? ssRet + "/" : ""}?adults=${adults}${children ? `&children=${children}` : ""}${infants ? `&infants=${infants}` : ""}`
          : "https://www.skyscanner.com/";

      return { triptrio, airlineSite, googleFlights, skyscanner };
    } catch { return {}; }
  }

  return (
    <div style={{ maxWidth: 1280, margin: "24px auto", padding: "0 16px" }}>
      <section style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.1 }}>Plan smarter. Fly happier.</h1>
        <p style={{ margin: "6px 0 0", color: "#475569" }}>
          <span>Explore &amp; Savor your city guide</span>
          <span style={{ opacity: 0.6 }}> • </span><span>Compare flights in style</span>
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
            <div style={{ display: "inline-flex", gap: 8 }}>
              <button type="button" aria-pressed={!roundTrip} onClick={() => setRoundTrip(false)} style={segStyle(!roundTrip)}>One-way</button>
              <button type="button" aria-pressed={roundTrip} onClick={() => setRoundTrip(true)} style={segStyle(roundTrip)}>Round-trip</button>
            </div>
          </div>
          <div>
            <label style={s.label}>Depart</label>
            <input type="date" min={todayLocal} style={inputStyle} value={departDate} onChange={(e) => setDepartDate(ensureISO(e.target.value))} />
          </div>
          <div>
            <label style={s.label}>Return</label>
            <input type="date" min={departDate || todayLocal} disabled={!roundTrip} style={{ ...inputStyle, opacity: roundTrip ? 1 : 0.5 }} value={returnDate} onChange={(e) => setReturnDate(ensureISO(e.target.value))} />
          </div>
          <div>
            <label style={s.label}>Cabin</label>
            <select style={inputStyle} value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Currency</label>
            <select style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>CAD</option><option>AUD</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Passengers</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)||1))} placeholder="Adults" style={inputStyle} />
              <input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)||0))} placeholder="Children" style={inputStyle} />
              <input type="number" min={0} value={infants} onChange={(e) => setInfants(Math.max(0, Number(e.target.value)||0))} placeholder="Infants" style={inputStyle} />
            </div>
          </div>
        </div>

        {children > 0 && (
          <div style={{ marginTop: 8 }}>
            <label style={s.label}>Children ages</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {childrenAges.map((age, i) => (
                <input key={i} type="number" min={0} max={17} value={age} onChange={(e) => {
                  const v = Math.max(0, Math.min(17, Number(e.target.value)||0));
                  setChildrenAges(prev => { const n = prev.slice(); n[i] = v; return n; });
                }} style={{ ...inputStyle, width: 90 }} />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "170px 1fr 1fr 1fr" }}>
          <div><label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} /> Include hotel</label></div>
          <div><label style={s.label}>Hotel check-in</label>
            <input type="date" min={todayLocal} disabled={!includeHotel} style={{ ...inputStyle, opacity: includeHotel ? 1 : 0.5 }} value={hotelCheckIn} onChange={(e) => setHotelCheckIn(ensureISO(e.target.value))} />
          </div>
          <div><label style={s.label}>Hotel check-out</label>
            <input type="date" min={hotelCheckIn || todayLocal} disabled={!includeHotel} style={{ ...inputStyle, opacity: includeHotel ? 1 : 0.5 }} value={hotelCheckOut} onChange={(e) => setHotelCheckOut(ensureISO(e.target.value))} />
          </div>
          <div><label style={s.label}>Min hotel ⭐</label>
            <select disabled={!includeHotel} style={{ ...inputStyle, opacity: includeHotel ? 1 : 0.5 }} value={minHotelStar} onChange={(e) => setMinHotelStar(Number(e.target.value)||3)}>
              <option value={3}>3⭐</option><option value={4}>4⭐</option><option value={5}>5⭐</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "170px 1fr 1fr 1fr 1fr 1fr", alignItems: "end", marginTop: 12 }}>
          <div style={{ minWidth: 170 }}>
            <label style={s.label}>Filters</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              <select value={maxStops ?? ""} onChange={(e) => setMaxStops(e.target.value === "" ? undefined : Number(e.target.value))} style={inputStyle}>
                <option value="">Stops (any)</option><option value={0}>Nonstop</option><option value={1}>≤ 1 stop</option><option value={2}>≤ 2 stops</option>
              </select>
              <select value={sortBasis} onChange={(e) => setSortBasis(e.target.value as SortBasis)} style={inputStyle}>
                <option value="flightOnly">Sort: Flight-only</option>
                <option value="bundle">Sort: Flight+Hotel</option>
              </select>
            </div>
          </div>
          <div><label style={s.label}>Min budget</label>
            <input type="number" placeholder="min" min={0} style={inputStyle}
              value={minBudget === "" ? "" : String(minBudget)}
              onChange={(e) => { if (e.target.value === "") return setMinBudget(""); const v = Number(e.target.value); setMinBudget(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </div>
          <div><label style={s.label}>Max budget</label>
            <input type="number" placeholder="max" min={0} style={inputStyle}
              value={maxBudget === "" ? "" : String(maxBudget)}
              onChange={(e) => { if (e.target.value === "") return setMaxBudget(""); const v = Number(e.target.value); setMaxBudget(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </div>
          <div><label style={s.label}>Refundable</label>
            <select style={inputStyle} value={refundable ? "yes" : "any"} onChange={(e) => setRefundable(e.target.value === "yes")}>
              <option value="any">Any</option><option value="yes">Refundable</option>
            </select>
          </div>
          <div><label style={s.label}>Greener</label>
            <select style={inputStyle} value={greener ? "yes" : "any"} onChange={(e) => setGreener(e.target.value === "yes")}>
              <option value="any">Any</option><option value="yes">Show greener</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "end", justifyContent: "flex-end" }}>
            <button type="submit" style={{ height: 46, padding: "0 16px", fontWeight: 800, borderRadius: 10, border: "1px solid #93c5fd", background: "#e6f1ff", color: "#0b3d91", cursor: "pointer" }}>
              Search
            </button>
            <button type="button" style={{ height: 46, padding: "0 16px", fontWeight: 800, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", marginLeft: 10 }} onClick={() => window.location.reload()}>
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="toolbar" style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        {tabsEnabled && (
          <div className="tabs" role="tablist" aria-label="Content tabs" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={`tab ${activeTab === "explore" ? "tab--active" : ""}`}
              role="tab"
              aria-selected={activeTab === "explore"}
              onClick={() => { setActiveTab("explore"); setCompareMode(false); setShowTabContent(prev => activeTab === "explore" ? !prev : true); }}
              title={`Explore - ${destCity}`}
              style={{ height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: activeTab === "explore" && showTabContent ? "#e6f1ff" : "#fff", cursor: "pointer" }}
            >{`🌍 Explore - ${destCity}`}</button>

            <button
              className={`tab ${activeTab === "savor" ? "tab--active" : ""}`}
              role="tab"
              aria-selected={activeTab === "savor"}
              onClick={() => { setActiveTab("savor"); setCompareMode(false); setShowTabContent(prev => activeTab === "savor" ? !prev : true); }}
              title={`Savor - ${destCity}`}
              style={{ height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: activeTab === "savor" && showTabContent ? "#e6f1ff" : "#fff", cursor: "pointer" }}
            >{`🍽️ Savor - ${destCity}`}</button>

            <button
              className={`tab tab--compare ${compareMode ? "tab--active" : ""}`}
              role="tab"
              aria-selected={activeTab === "compare"}
              onClick={() => { setActiveTab("compare"); setCompareMode(v => !v); }}
              title="Compare"
              style={{ height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: compareMode ? "#e6f1ff" : "#fff", cursor: "pointer" }}
            >⚖️ Compare</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div role="tablist" aria-label="Sort" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["best", "cheapest", "fastest", "flexible"] as const).map((k) => (
              <button key={k}
                role="tab"
                aria-selected={sort === k}
                className={`toolbar-chip ${sort === k ? "toolbar-chip--active" : ""}`}
                onClick={() => setSort(k)}
                title={k === "best" ? "Best" : k[0].toUpperCase() + k.slice(1)}
                style={{ height: 32, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: sort === k ? "#e6f1ff" : "#fff", cursor: "pointer" }}
              >
                {k === "best" ? "Best" : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <button className={`toolbar-chip ${!showAll ? "toolbar-chip--active" : ""}`} onClick={() => setShowAll(false)} title="Show top 3" style={{ height: 32, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: !showAll ? "#e6f1ff" : "#fff" }}>Top-3</button>
          <button className={`toolbar-chip ${showAll ? "toolbar-chip--active" : ""}`} onClick={() => setShowAll(true)} title="Show all" style={{ height: 32, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: showAll ? "#e6f1ff" : "#fff" }}>All</button>
          <button className="toolbar-chip" onClick={() => window.print()} style={{ height: 32, padding: "0 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff" }}>Print</button>
          <SavedChip count={savedCount} />
        </div>
      </div>

      {/* City content */}
      {tabsEnabled && showTabContent && results && results.length > 0 && activeTab !== "compare" && <ContentPlaces mode={activeTab as MainTab} />}

      {/* Errors / Loading */}
      {error && <div role="alert" style={{ marginTop: 12, padding: 12, border: "1px solid #fecaca", background: "#fff1f2", borderRadius: 12, color: "#991b1b" }}>{error}</div>}
      {hotelWarning && <div role="status" style={{ marginTop: 12, padding: 12, border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 12, color: "#92400e" }}>{hotelWarning}</div>}
      {loading && <div role="status" style={{ marginTop: 12, padding: 12, border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: 12 }}>Searching…</div>}

      {/* Results */}
      {shownResults && shownResults.length > 0 && (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {shownResults.map((pkg: any, i: number) => (
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
