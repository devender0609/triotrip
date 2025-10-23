"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import SavedChip from "../components/SavedChip";
import ComparePanel from "../components/ComparePanel";
import { savorSet, miscSet, exploreSet, robustCountryFrom } from "@/lib/savorExplore";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";

interface SearchPayload {
  origin: string; destination: string; departDate: string; returnDate?: string; roundTrip: boolean;
  passengersAdults: number; passengersChildren: number; passengersInfants: number; passengersChildrenAges?: number[];
  cabin: Cabin; includeHotel?: boolean; hotelCheckIn?: string; hotelCheckOut?: string; nights?: number; minHotelStar?: number;
  minBudget?: number; maxBudget?: number; currency: string; sort: SortKey; maxStops?: 0 | 1 | 2;
  sortBasis?: "flightOnly" | "bundle";
}

const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

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
  return nice.replace(/\b[A-Z]{2}\b$/, "");
}

const plusDays = (d: string, n: number = 1) => {
  const x = new Date(d + "T00:00:00"); x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

const s = {
  label: { fontWeight: 500, color: "#334155", display: "block", marginBottom: 6, fontSize: 15 } as React.CSSProperties,
};

const inputStyle: React.CSSProperties = {
  height: 40, border: "1px solid #cbd5e1", borderRadius: 10, padding: "0 12px",
  outline: "none", width: "100%", maxWidth: 300
};

const segStyle = (active: boolean): React.CSSProperties => ({
  height: 38, padding: "0 12px", borderRadius: 9999, border: "1px solid #cbd5e1",
  background: active ? "#e6f4ff" : "#fff", color: "#0b1220", fontWeight: 600, cursor: "pointer"
});

export default function Page() {
  // form state
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
  const [currency, setCurrency] = useState("USD");

  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);

  /* ---- Hotel (optional) ---- */
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);

  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">("flightOnly");

  // Tabs visible after Search; each tab toggles show/hide
  const [tabsVisible, setTabsVisible] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [savorOpen, setSavorOpen] = useState(false);
  const [miscOpen, setMiscOpen] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotelWarning, setHotelWarning] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    function handler() { try { const s = localStorage.getItem("triptrio:saved"); if (!s) return setSavedCount(0); const arr = JSON.parse(s); setSavedCount(Array.isArray(arr) ? arr.length : 0); } catch { setSavedCount(0); } }
    window.addEventListener("triptrio:saved:changed", handler);
    window.addEventListener("storage", handler);
    handler();
    return () => { window.removeEventListener("triptrio:saved:changed", handler); window.removeEventListener("storage", handler); };
  }, []);

  const [searchKey, setSearchKey] = useState(0);

  useEffect(() => {
    setChildrenAges(prev => {
      const next = prev.slice(0, children);
      while (next.length < children) next.push(8);
      return next;
    });
  }, [children]);

  useEffect(() => { if (!roundTrip) setReturnDate(""); }, [roundTrip]);
  useEffect(() => { if (!includeHotel) { setHotelCheckIn(""); setHotelCheckOut(""); } }, [includeHotel]);
  // when hotel is off, force basis back to Flight only
  useEffect(() => { if (!includeHotel) setSortBasis("flightOnly"); }, [includeHotel]);

  function swapOriginDest() {
    setOriginCode(oc => { const dc = destCode; setDestCode(oc); return dc; });
    setOriginDisplay(od => { const dd = destDisplay; setDestDisplay(od); return dd; });
  }

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
        if (!returnDate) throw new Error("Please set a return date.");
        if (returnDate <= departDate) throw new Error("Return date must be after departure.");
      }
      if (includeHotel) {
        if (!hotelCheckIn || !hotelCheckOut) throw new Error("Please set hotel check-in and check-out.");
        if (hotelCheckIn < todayLocal) throw new Error("Hotel check-in can’t be in the past.");
        if (hotelCheckOut <= hotelCheckIn) throw new Error("Hotel check-out must be after check-in.");
      }
      if (minBudget !== "" && minBudget < 0) throw new Error("Min budget cannot be negative.");
      if (maxBudget !== "" && maxBudget < 0) throw new Error("Max budget cannot be negative.");
      if (minBudget !== "" && maxBudget !== "" && minBudget > maxBudget) throw new Error("Min budget cannot exceed max budget.");

      const payload: SearchPayload = {
        origin, destination, departDate, returnDate: roundTrip ? returnDate : undefined, roundTrip,
        passengersAdults: adults, passengersChildren: children, passengersInfants: infants,
        passengersChildrenAges: children > 0 ? childrenAges : undefined,
        cabin, includeHotel, hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        nights: includeHotel && hotelCheckIn && hotelCheckOut ? Math.max(1, Math.round((+new Date(hotelCheckOut) - +new Date(hotelCheckIn)) / 86400000)) : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: minBudget === "" ? undefined : minBudget, maxBudget: maxBudget === "" ? undefined : maxBudget,
        currency, sort, maxStops, sortBasis,
      };

      const r = await fetch(`/api/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || "Search failed");
      const arr = Array.isArray(j?.results) ? j.results : [];
      setResults(arr);
      setTabsVisible(true);
      setExploreOpen(false); setSavorOpen(false); setMiscOpen(false);
      if (includeHotel && (!hotelCheckIn || !hotelCheckOut)) setHotelWarning("Hotel was included but dates are missing.");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function toggleCompare(id: string) {
    setComparedIds(prev => {
      const i = prev.indexOf(id);
      if (i >= 0) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  }

  function SectionCard({ title, children }: React.PropsWithChildren<{ title: string }>) {
    return (
      <div className="place-card">
        <div className="place-title">{title}</div>
        {children}
      </div>
    );
  }

  function ContentExplore() {
    const city = destDisplay ? extractCityOnly(destDisplay) : "";
    const cc = robustCountryFrom(destDisplay);
    const ccCode = typeof cc === "string" ? cc : (cc?.code ?? "");
    const places = exploreSet(ccCode);
    return (
      <div className="place-grid">
        {places.map((p) => (
          <SectionCard key={p.title} title={p.title}>
            <ul>
              {p.items.map((it) => (
                <li key={it.label}><a href={it.url(city)} target="_blank" rel="noreferrer">{it.label}</a></li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    );
  }

  function ContentSavor() {
    const city = destDisplay ? extractCityOnly(destDisplay) : "";
    const cc = robustCountryFrom(destDisplay);
    const ccCode = typeof cc === "string" ? cc : (cc?.code ?? "");
    const places = savorSet(ccCode);
    return (
      <div className="place-grid">
        {places.map((p) => (
          <SectionCard key={p.title} title={p.title}>
            <ul>
              {p.items.map((it) => (
                <li key={it.label}><a href={it.url(city)} target="_blank" rel="noreferrer">{it.label}</a></li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    );
  }

  function ContentMisc() {
    const city = destDisplay ? extractCityOnly(destDisplay) : "";
    const cc = robustCountryFrom(destDisplay);
    const ccCode = typeof cc === "string" ? cc : (cc?.code ?? "");
    const places = miscSet(ccCode);
    return (
      <div className="place-grid">
        {places.map((p) => (
          <SectionCard key={p.title} title={p.title}>
            <ul>
              {p.items.map((it) => (
                <li key={it.label}><a href={it.url(city)} target="_blank" rel="noreferrer">{it.label}</a></li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "0 auto", maxWidth: 1240 }}>
        <h1 className="title">Find your perfect trip</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <SavedChip count={savedCount} />
        </div>
      </div>

      {/* Search form */}
      <form
        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gap: 14, maxWidth: 1240, margin: "0 auto", fontSize: 16 }}
        onSubmit={(e) => { e.preventDefault(); runSearch(); }}
      >
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 54px 1fr", alignItems: "end" }}>
          <div>
            <label style={s.label}>Origin</label>
            <AirportField id="origin" label="" code={originCode} initialDisplay={originDisplay}
              onTextChange={setOriginDisplay} onChangeCode={(code, display) => { setOriginCode(code); setOriginDisplay(display); }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
            <button
              type="button"
              title="Swap origin & destination"
              onClick={() => swapOriginDest()}
              style={{ height: 40, width: 40, borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
            >
              ↔
            </button>
          </div>
          <div>
            <label style={s.label}>Destination</label>
            <AirportField id="destination" label="" code={destCode} initialDisplay={destDisplay}
              onTextChange={setDestDisplay} onChangeCode={(code, display) => { setDestCode(code); setDestDisplay(display); }} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(6, 1fr)", alignItems: "end" }}>
          <div>
            <label style={s.label}>Trip</label>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" style={segStyle(!roundTrip)} onClick={() => setRoundTrip(false)}>One-way</button>
              <button type="button" style={segStyle(roundTrip)} onClick={() => setRoundTrip(true)}>Round-trip</button>
            </div>
          </div>

          <div>
            <label style={s.label}>Depart</label>
            <input type="date" style={inputStyle} value={departDate} onChange={(e) => setDepartDate(e.target.value)}
              min={todayLocal} max={roundTrip && returnDate ? returnDate : undefined} />
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

        {children > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Array.from({ length: children }).map((_, i) => (
              <div key={i} style={{ display: "grid", gap: 6 }}>
                <label style={s.label}>Child {i + 1} age</label>
                <select style={{ ...inputStyle, width: "100%", maxWidth: 140 }} value={childrenAges[i] ?? 8}
                  onChange={(e) => { const v = Math.max(1, Math.min(17, Number(e.target.value))); setChildrenAges(prev => { const next = prev.slice(); next[i] = v; return next; }); }}>
                  {Array.from({ length: 17 }, (_, n) => n + 1).map((age) => (<option key={age} value={age}>{age}</option>))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(6, 1fr)", alignItems: "end" }}>
          <div>
            <label style={s.label}>Cabin</label>
            <select style={inputStyle} value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}>
              {(["ECONOMY","PREMIUM_ECONOMY","BUSINESS","FIRST"] as Cabin[]).map((c) => (<option key={c} value={c}>{c.replace("_"," ")}</option>))}
            </select>
          </div>
          <div>
            <label style={s.label}>Max stops</label>
            <select style={inputStyle} value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value) as 0 | 1 | 2)}>
              <option value={2}>Any</option>
              <option value={1}>≤ 1 stop</option>
              <option value={0}>Non-stop only</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Sort by</label>
            <select style={inputStyle} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="best">Best</option>
              <option value="cheapest">Cheapest</option>
              <option value="fastest">Fastest</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Min budget</label>
            <input type="number" className="no-spin" style={inputStyle} value={minBudget} onChange={(e) => setMinBudget(e.target.value === "" ? "" : Number(e.target.value))} placeholder="USD" />
          </div>
          <div>
            <label style={s.label}>Max budget</label>
            <input type="number" className="no-spin" style={inputStyle} value={maxBudget} onChange={(e) => setMaxBudget(e.target.value === "" ? "" : Number(e.target.value))} placeholder="USD" />
          </div>
          <div>
            <label style={s.label}>Currency</label>
            <select style={{ ...inputStyle, width: "100%", maxWidth: 160 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {["USD","EUR","GBP","INR","CAD","AUD","JPY","SGD","AED"].map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div />
        </div>

        {/* --- Hotel option --- */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "auto" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#0b1220" }}>
            <input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
            Include hotel
          </label>
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
                  <option value={3}>3★+</option>
                  <option value={4}>4★+</option>
                  <option value={5}>5★</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)", alignItems: "end" }}>
          <div>
            <label style={s.label}>Compare</label>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" style={segStyle(compareMode)} onClick={() => setCompareMode((v) => !v)}>{compareMode ? "On" : "Off"}</button>
            </div>
          </div>
          {includeHotel && (
            <div>
              <label style={s.label}>Sort by (basis)</label>
              <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" style={segStyle("flightOnly" === sortBasis)} onClick={() => setSortBasis("flightOnly")}>Flight only</button>
                <button type="button" style={segStyle("bundle" === sortBasis)} onClick={() => setSortBasis("bundle")}>Bundle total</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" style={{ height: 46, padding: "0 16px", fontWeight: 600, background: "#0ea5e9", color: "white", borderRadius: 12, fontSize: 15, cursor: "pointer", border: "1px solid #c9e9fb" }}>
            {loading ? "Searching…" : "Search"}
          </button>
          <button type="button" style={{ height: 46, padding: "0 16px", fontWeight: 600, background: "#fff", border: "2px solid #e2e8f0", borderRadius: 12, marginLeft: 8, cursor: "pointer" }}
            onClick={() => { setResults(null); setTabsVisible(false); setExploreOpen(false); setSavorOpen(false); setMiscOpen(false); }}>
            Reset
          </button>
        </div>
      </form>

      {/* Results and tabs */}
      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 12, marginTop: 12 }}>{error}</div>
      )}
      {hotelWarning && (
        <div style={{ background: "#fffbeb", color: "#92400e", padding: 12, borderRadius: 12, marginTop: 12 }}>{hotelWarning}</div>
      )}

      {tabsVisible && (
        <div className="tab-bar">
          <button className={exploreOpen ? "active" : ""} onClick={() => { setExploreOpen(v => !v); setSavorOpen(false); setMiscOpen(false); }}>Explore</button>
          <button className={savorOpen ? "active" : ""} onClick={() => { setSavorOpen(v => !v); setExploreOpen(false); setMiscOpen(false); }}>Savor</button>
          <button className={miscOpen ? "active" : ""} onClick={() => { setMiscOpen(v => !v); setExploreOpen(false); setSavorOpen(false); }}>Misc</button>
        </div>
      )}

      {exploreOpen && <ContentExplore />}
      {savorOpen && <ContentSavor />}
      {miscOpen && <ContentMisc />}

      {results && results.length > 0 && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {compareMode && (
            <ComparePanel ids={comparedIds} currency={currency} onClear={() => setComparedIds([])} />
          )}
          {results.map((it: any) => (
            <ResultCard
              key={it.id}
              data={it}
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
