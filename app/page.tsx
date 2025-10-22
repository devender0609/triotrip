"use client";

import React, { useEffect, useMemo, useState } from "react";
import ResultCard from "@/components/ResultCard";
import ComparePanel from "@/components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";
import SurveyWidget from "@/components/SurveyWidget";

type Pkg = any;

const swap = <T,>(a: T, b: T) => [b, a] as const;

export default function Page() {
  // form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Hotel controls
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0); // 0 any, 3/4/5

  // Currency from header CurrencyPicker (no selector in the panel)
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tt_currency") || "USD";
    }
    return "USD";
  });
  useEffect(() => {
    const handler = (e: any) =>
      setCurrency(
        e?.detail?.code ||
          (typeof window !== "undefined" && localStorage.getItem("tt_currency")) ||
          "USD"
      );
    if (typeof window !== "undefined") {
      window.addEventListener("tt:currency", handler as any);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("tt:currency", handler as any);
      }
    };
  }, []);

  // UI controls
  const [activeTab, setActiveTab] = useState<"top3" | "all" | "compare">("top3");
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const showAll = activeTab === "all";

  // Demo: today helpers (for min dates)
  const todayLocal = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plusDays = (d: string, n: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  };

  function inc(setter: (n: number) => void) {
    setter((x) => x + 1);
  }
  function dec(setter: (n: number) => void) {
    setter((x) => Math.max(0, x - 1));
  }
  function swapOriginDest() {
    const [a, b] = swap(origin, destination);
    setOrigin(a);
    setDestination(b);
  }

  // Compare: UNLIMITED (no slice cap)
  function toggleCompare(id: string) {
    setComparedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setActiveTab("compare");
  }

  // Placeholder: plug in your actual search/fetch
  // Keep the variable name `packages` to minimize downstream changes.
  const packages: Pkg[] = useMemo(() => {
    // Expect your real data fill here (kept as is from your pipeline).
    // This file’s job is only to manage UI logic/visibility/state.
    return (globalThis as any).__TRIOTRIP__?.results ?? [];
  }, []);

  const filtered = useMemo(() => {
    // Apply hotel star filtering only when includeHotel is ON
    if (!includeHotel) return packages;
    return packages.map((p: any) => {
      const hotels = Array.isArray(p.hotels)
        ? p.hotels.filter((h: any) => {
            const v =
              h?.stars ?? h?.starRating ?? h?.star ?? h?.category ?? 0;
            const s =
              typeof v === "number"
                ? Math.round(v)
                : (typeof v === "string"
                    ? (() => {
                        const m = v.match(/\d(\.\d)?/);
                        return m ? Math.round(parseFloat(m[0])) : 0;
                      })()
                    : 0);
            return minHotelStar ? s >= minHotelStar : true;
          })
        : p.hotels;
      return { ...p, hotels };
    });
  }, [packages, includeHotel, minHotelStar]);

  const shown = useMemo(() => {
    if (activeTab === "compare") {
      const set = new Set(comparedIds);
      return filtered.filter((p: any) => set.has(p?.id));
    }
    if (activeTab === "top3") return filtered.slice(0, 3);
    return filtered; // "All" = unlimited
  }, [filtered, activeTab, comparedIds]);

  const s = styles;

  return (
    <main style={s.main}>
      {/* Search toolbar */}
      <section className="toolbar" style={s.toolbar}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr auto auto" }}>
          <div>
            <label style={s.label}>From</label>
            <input
              style={s.input}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="City or IATA (e.g., AUS)"
            />
          </div>
          <div>
            <label style={s.label}>To</label>
            <input
              style={s.input}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or IATA (e.g., LAX)"
            />
          </div>
          <div style={{ placeSelf: "end" }}>
            <button className="toolbar-chip" onClick={swapOriginDest}>⇄ Swap</button>
          </div>
          <div style={{ placeSelf: "end" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={(e) => setRoundTrip(e.target.checked)}
              />
              Round trip
            </label>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={s.label}>Depart</label>
            <input
              type="date"
              style={s.input}
              value={departDate}
              min={todayLocal}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>
          <div>
            <label style={s.label}>Return</label>
            <input
              type="date"
              style={s.input}
              value={returnDate}
              disabled={!roundTrip}
              min={departDate ? plusDays(departDate, 1) : todayLocal}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        {/* Pax */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)" }}>
          <Counter label="Adults" value={adults} onInc={() => inc(setAdults)} onDec={() => dec(setAdults)} />
          <Counter label="Children" value={children} onInc={() => inc(setChildren)} onDec={() => dec(setChildren)} />
          <Counter label="Infants" value={infants} onInc={() => inc(setInfants)} onDec={() => dec(setInfants)} />
        </div>

        {/* --- Hotel option --- */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "auto 1fr 1fr 1fr" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#0b1220" }}>
            <input
              type="checkbox"
              checked={includeHotel}
              onChange={(e) => setIncludeHotel(e.target.checked)}
            />
            Include hotel
          </label>

          {includeHotel && (
            <>
              <div>
                <label style={s.label}>Check-in</label>
                <input
                  type="date"
                  style={s.input}
                  value={hotelCheckIn}
                  min={departDate || todayLocal}
                  onChange={(e) => setHotelCheckIn(e.target.value)}
                />
              </div>
              <div>
                <label style={s.label}>Check-out</label>
                <input
                  type="date"
                  style={s.input}
                  value={hotelCheckOut}
                  min={hotelCheckIn ? plusDays(hotelCheckIn, 1) : (departDate ? plusDays(departDate, 1) : plusDays(todayLocal, 1))}
                  onChange={(e) => setHotelCheckOut(e.target.value)}
                />
              </div>
              <div>
                <label style={s.label}>Min stars</label>
                <select
                  style={s.input}
                  value={minHotelStar}
                  onChange={(e) => setMinHotelStar(Number(e.target.value))}
                >
                  <option value={0}>Any</option>
                  <option value={3}>3★+</option>
                  <option value={4}>4★+</option>
                  <option value={5}>5★</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Only show the "Basis" chips when Include hotel is ON */}
        {includeHotel && (
          <>
            <label style={s.label}>Basis</label>
            <div className="toolbar-chips">
              <button className="toolbar-chip toolbar-chip--on">Flight-only</button>
              <button className="toolbar-chip">Bundle total</button>
            </div>
          </>
        )}
      </section>

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Tab text="Top-3" active={activeTab === "top3"} onClick={() => setActiveTab("top3")} />
        <Tab text="All" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
        <Tab text={`Compare (${comparedIds.length})`} active={activeTab === "compare"} onClick={() => setActiveTab("compare")} />
      </div>

      {/* Results */}
      <section style={{ display: "grid", gap: 12 }}>
        {shown.map((pkg: Pkg, i: number) => (
          <ResultCard
            key={pkg?.id ?? i}
            pkg={{
              ...pkg,
              roundTrip,
              hotelCheckIn: includeHotel ? hotelCheckIn : undefined,
              hotelCheckOut: includeHotel ? hotelCheckOut : undefined,
              currency,
            }}
            index={i}
            compared={comparedIds.includes(pkg?.id)}
            onToggleCompare={toggleCompare}
            currency={currency}
          />
        ))}
      </section>

      {/* Compare panel */}
      {activeTab === "compare" && comparedIds.length > 0 && (
        <ComparePanel ids={comparedIds} currency={currency} />
      )}

      {/* Optional widgets */}
      <ExploreSavorTabs />
      <SurveyWidget />
    </main>
  );
}

/* ------------------------- Helpers & UI bits ------------------------- */

function Counter({
  label,
  value,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
        <button className="toolbar-chip" onClick={onDec}>−</button>
        <input className="no-spin" style={styles.input} type="number" value={value} readOnly />
        <button className="toolbar-chip" onClick={onInc}>+</button>
      </div>
    </div>
  );
}

function Tab({
  text,
  active,
  onClick,
}: {
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="toolbar-chip"
      onClick={onClick}
      style={{
        background: active ? "#0ea5e9" : "#fff",
        color: active ? "#fff" : "#0f172a",
        borderColor: active ? "#0ea5e9" : "#e2e8f0",
      }}
    >
      {text}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    display: "grid",
    gap: 16,
    padding: 16,
  },
  toolbar: {
    display: "grid",
    gap: 12,
    padding: 12,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 600,
    marginBottom: 6,
    display: "block",
  },
  input: {
    height: 40,
    padding: "0 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    outline: "none",
    width: "100%",
  },
};
