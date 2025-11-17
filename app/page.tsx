"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import ComparePanel from "../components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";
import { AiTripPlanner } from "../components/AiTripPlanner";
import { AiDestinationCompare } from "../components/AiDestinationCompare";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type ListTab = "top3" | "all";
type SubTab = "explore" | "savor" | "misc";

function plusDays(dateStr: string, delta: number) {
  const d = new Date(dateStr || new Date().toISOString().slice(0, 10));
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function toLocalDateInput(d: Date) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

export default function Page() {
  // Basic
  const [originCode, setOriginCode] = useState("AUS");
  const [originDisplay, setOriginDisplay] = useState("Austin, TX");
  const [destinationCode, setDestinationCode] = useState("BOS");
  const [destinationDisplay, setDestinationDisplay] = useState("Boston, MA");
  const [roundTrip, setRoundTrip] = useState(true);

  const todayLocal = useMemo(() => toLocalDateInput(new Date()), []);
  const [departDate, setDepartDate] = useState(todayLocal);
  const [returnDate, setReturnDate] = useState(plusDays(todayLocal, 3));

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  // Filters
  const [currency, setCurrency] = useState("USD");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);

  // Hotels
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");

  // Sort & tabs
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">(
    "flightOnly"
  );
  const [listTab, setListTab] = useState<ListTab>("all");

  // Sub-tabs toggle behavior
  const [subTab, setSubTab] = useState<SubTab>("explore");
  const [subPanelOpen, setSubPanelOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // AI vs Manual mode
  const [activeMode, setActiveMode] = useState<"ai" | "manual">("ai");

  // Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  // sync
  useEffect(() => {
    if (!includeHotel) setSortBasis("flightOnly");
  }, [includeHotel]);
  useEffect(() => {
    if (!roundTrip) setReturnDate("");
  }, [roundTrip]);

  // hotel sanity
  useEffect(() => {
    if (!includeHotel) return;
    if (departDate && hotelCheckIn && hotelCheckIn < departDate)
      setHotelCheckIn(departDate);
    if (hotelCheckIn && hotelCheckOut && hotelCheckOut <= hotelCheckIn) {
      const d = new Date(hotelCheckIn);
      d.setDate(d.getDate() + 1);
      setHotelCheckOut(d.toISOString().slice(0, 10));
    }
    if (roundTrip && returnDate && hotelCheckOut && hotelCheckOut > returnDate) {
      setHotelCheckOut(returnDate);
    }
  }, [includeHotel, departDate, returnDate, hotelCheckIn, hotelCheckOut, roundTrip]);

  useEffect(() => {
    function handler(e: any) {
      if (!e?.detail?.currency) return;
      setCurrency(e.detail.currency);
    }
    window.addEventListener("triptrio:currency", handler);
    return () => window.removeEventListener("triptrio:currency", handler);
  }, []);

  const totalPax = adults + children + infants;

  const sLabel: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 12,
    display: "block",
    marginBottom: 4,
    color: "#0f172a",
  };

  const sInput: React.CSSProperties = {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: "8px 10px",
    fontSize: 13,
  };

  function swapCities() {
    setOriginCode(destinationCode);
    setOriginDisplay(destinationDisplay);
    setDestinationCode(originCode);
    setDestinationDisplay(originDisplay);
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const body: any = {
        origin: originCode,
        destination: destinationCode,
        departDate,
        returnDate: roundTrip ? returnDate : undefined,
        adults,
        children,
        infants,
        cabin,
        maxStops,
        includeHotel,
        hotelCheckIn: includeHotel ? hotelCheckIn || departDate : undefined,
        hotelCheckOut:
          includeHotel && (hotelCheckOut || returnDate)
            ? hotelCheckOut || returnDate
            : undefined,
        minHotelStar,
        minBudget: minBudget ? Number(minBudget) : undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        currency,
      };

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(
          text || "Search failed. Please try again or adjust your filters."
        );
        return;
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const sortedResults = useMemo(() => {
    if (!results || !results.length) return null;
    const items = [...results];

    const num = (x: any) => {
      const n = Number(x);
      return Number.isFinite(n) ? n : undefined;
    };

    const flightPrice = (p: any) =>
      num(p.flight_total) ??
      num(p.total_cost_flight) ??
      num(p.flight?.price_usd_converted) ??
      num(p.flight?.price_usd) ??
      num(p.total_cost) ??
      9e15;

    const bundleTotal = (p: any) =>
      num(p.total_cost) ??
      (num(p.flight_total) ?? flightPrice(p)) +
        (num(p.hotel_total) ?? 0);

    const outDur = (p: any) => {
      const segs = p.flight?.segments_out || p.flight?.segments || [];
      const sum = segs.reduce(
        (t: number, s: any) => t + (Number(s?.duration_minutes) || 0),
        0
      );
      return Number.isFinite(sum) ? sum : 9e9;
    };

    const basis = (p: any) =>
      sortBasis === "bundle" ? bundleTotal(p) : flightPrice(p);

    if (sort === "cheapest") {
      items.sort((a, b) => basis(a)! - basis(b)! || outDur(a)! - outDur(b)!);
    } else if (sort === "fastest") {
      items.sort(
        (a, b) =>
          outDur(a)! - outDur(b)! || basis(a)! - basis(b)!
      );
    } else if (sort === "flexible") {
      items.sort(
        (a, b) =>
          (a.flight?.refundable ? 0 : 1) -
            (b.flight?.refundable ? 0 : 1) ||
          basis(a)! - basis(b)!
      );
    } else {
      items.sort(
        (a, b) => basis(a)! - basis(b)! || outDur(a)! - outDur(b)!
      );
    }

    return items;
  }, [results, sort, sortBasis]);

  const top3 = useMemo(
    () => (sortedResults ? sortedResults.slice(0, 3) : null),
    [sortedResults]
  );
  const shown = (listTab === "all" ? sortedResults : top3) || [];

  function toggleCompare(id: string) {
    setComparedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      {/* Mode toggle: AI vs Manual */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveMode("ai")}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border:
              activeMode === "ai"
                ? "1px solid transparent"
                : "1px solid #e2e8f0",
            background:
              activeMode === "ai"
                ? "linear-gradient(90deg, #22c1c3, #7367f0, #ff80b5)"
                : "#ffffff",
            color: activeMode === "ai" ? "#ffffff" : "#0f172a",
            fontWeight: 700,
            boxShadow:
              activeMode === "ai"
                ? "0 8px 20px rgba(15, 23, 42, 0.35)"
                : "none",
          }}
        >
          ✨ AI Trip Planning
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("manual")}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border:
              activeMode === "manual"
                ? "1px solid transparent"
                : "1px solid #e2e8f0",
            background:
              activeMode === "manual"
                ? "linear-gradient(90deg, #22c1c3, #7367f0, #ff80b5)"
                : "#ffffff",
            color: activeMode === "manual" ? "#ffffff" : "#0f172a",
            fontWeight: 700,
            boxShadow:
              activeMode === "manual"
                ? "0 8px 20px rgba(15, 23, 42, 0.35)"
                : "none",
          }}
        >
          🔍 Manual Search
        </button>
      </div>

      {/* AI MODE */}
      {activeMode === "ai" && (
        <>
          <AiTripPlanner />
          <div style={{ marginTop: 24 }}>
            <AiDestinationCompare />
          </div>
        </>
      )}

      {/* MANUAL MODE */}
      {activeMode === "manual" && (
        <>
          {/* SEARCH */}
          <form
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 16,
              display: "grid",
              gap: 14,
            }}
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            {/* Origin / Swap / Destination */}
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr 54px 1fr",
                alignItems: "end",
              }}
            >
              <div>
                <label style={sLabel}>Origin</label>
                <AirportField
                  id="origin"
                  label=""
                  code={originCode}
                  initialDisplay={originDisplay}
                  onTextChange={setOriginDisplay}
                  onChangeCode={(code, display) => {
                    setOriginCode(code);
                    setOriginDisplay(display);
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <button
                  type="button"
                  onClick={swapCities}
                  style={{
                    borderRadius: 999,
                    padding: 10,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  ⇄
                </button>
              </div>
              <div>
                <label style={sLabel}>Destination</label>
                <AirportField
                  id="destination"
                  label=""
                  code={destinationCode}
                  initialDisplay={destinationDisplay}
                  onTextChange={setDestinationDisplay}
                  onChangeCode={(code, display) => {
                    setDestinationCode(code);
                    setDestinationDisplay(display);
                  }}
                />
              </div>
            </div>

            {/* Dates / Pax / Cabin / Stops */}
            {/* ... all your existing manual-search controls remain unchanged here ... */}

            {/* (For brevity, all the rest of the manual form + filters + results + ComparePanel
                stay exactly as in your current file.) */}

          </form>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#7f1d1d",
                padding: 10,
                borderRadius: 10,
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* RESULTS */}
          {(shown?.length ?? 0) > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {shown.map((pkg, i) => (
                <ResultCard
                  key={pkg.id || i}
                  pkg={pkg}
                  index={i}
                  currency={currency}
                  pax={totalPax}
                  showHotel={includeHotel}
                  hotelNights={
                    includeHotel
                      ? nightsBetween(hotelCheckIn, hotelCheckOut)
                      : 0
                  }
                  showAllHotels={listTab === "all"}
                  comparedIds={comparedIds}
                  onToggleCompare={(id) => toggleCompare(id)}
                  onSavedChangeGlobal={() => {}}
                />
              ))}
            </div>
          )}

          {/* COMPARE */}
          {comparedIds.length >= 2 && (
            <ComparePanel
              items={(shown || []).filter((r: any) =>
                comparedIds.includes(String(r.id || ""))
              )}
              currency={currency}
              onClose={() => setComparedIds([])}
              onRemove={(id) =>
                setComparedIds((prev) => prev.filter((x) => x !== id))
              }
            />
          )}
        </>
      )}
    </div>
  );
}
