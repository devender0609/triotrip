"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import ComparePanel from "../components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";
import AiTripPlanner from "../components/AiTripPlanner";
import { AiDestinationCompare } from "../components/AiDestinationCompare";

// --- Types for various controls ---

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";

/**
 * Determines whether "Top-3" or "All" results are shown in the main list.
 */
type ListTab = "top3" | "all";

/**
 * Sub tabs for Explore / Savor / Misc (destination guides).
 */
type SubTab = "explore" | "savor" | "misc";

// Precompute local date string with timezone offset to avoid Next build issues
const todayLocal = new Date(
  Date.now() - new Date().getTimezoneOffset() * 60000
)
  .toISOString()
  .slice(0, 10);

/** Extract a 3-letter IATA code from display text such as "Austin (AUS) — Austin–Bergstrom Intl" */
function extractIATA(display: string): string {
  const s = String(display || "").toUpperCase().trim();
  // Look for "(XXX)"
  let m = /\(([A-Z]{3})\)/.exec(s);
  if (m) return m[1];
  // Look for "XXX " at start
  m = /^([A-Z]{3})\b/.exec(s);
  if (m) return m[1];
  return "";
}

/** Add days to an ISO date string safely */
function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Rough city extraction from a display string like "Austin (AUS) — Austin–Bergstrom Intl" or "Boston, MA" */
function cityFromDisplay(txt: string) {
  if (!txt) return "";
  const parts = txt
    .split("—")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return txt.split(",")[0].trim();
}

/** integer nights between dates */
function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

const num = (v: any) =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/**
 * Pick a hero image that loosely matches the destination city vibe.
 */
function getHeroImage(city: string) {
  const c = city.toLowerCase();

  if (c.includes("las vegas")) {
    return {
      url: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1600&q=80",
      alt: "Las Vegas Strip and casinos at night",
    };
  }

  if (c.includes("miami")) {
    return {
      url: "https://images.unsplash.com/photo-1517898717281-8e4385f1c4a2?auto=format&fit=crop&w=1600&q=80",
      alt: "Miami beach and oceanfront skyline",
    };
  }

  if (c.includes("agra")) {
    return {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80",
      alt: "Taj Mahal in Agra",
    };
  }

  if (c.includes("boston")) {
    return {
      url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80",
      alt: "Boston skyline and harbor",
    };
  }

  if (c.includes("new york") || c.includes("nyc")) {
    return {
      url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
      alt: "New York City skyline",
    };
  }

  if (c.includes("paris")) {
    return {
      url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
      alt: "Eiffel Tower and Paris skyline",
    };
  }

  if (c.includes("london")) {
    return {
      url: "https://images.unsplash.com/photo-1473951574080-01fe45ec8643?auto=format&fit=crop&w=1600&q=80",
      alt: "London skyline with Big Ben",
    };
  }

  if (c.includes("hawaii") || c.includes("honolulu") || c.includes("maui")) {
    return {
      url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=80",
      alt: "Tropical beach in Hawaii with palm trees",
    };
  }

  // Generic scenic fallback
  return {
    url: "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80",
    alt: "Scenic travel destination",
  };
}

export default function Page() {
  const [mode, setMode] = useState<"ai" | "manual" | "none">("none");

  // Places & dates (manual)
  const [originCode, setOriginCode] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destCode, setDestCode] = useState("");
  const [destDisplay, setDestDisplay] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Pax
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const totalPax = adults + children + infants;

  // Cabin
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  // Currency (synced with header)
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    try {
      const cur = localStorage.getItem("triptrio:currency");
      if (cur) setCurrency(cur);
    } catch {
      // ignore
    }
    const handler = (e: any) =>
      setCurrency(
        e?.detail || localStorage.getItem("triptrio:currency") || "USD"
      );
    window.addEventListener("triptrio:currency", handler);
    return () => window.removeEventListener("triptrio:currency", handler);
  }, []);

  // Filters / hotels
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");

  // Sorting / view
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">(
    "flightOnly"
  );
  const [listTab, setListTab] = useState<ListTab>("all");

  // Explore / Savor / Misc
  const [subTab, setSubTab] = useState<SubTab>("explore");
  const [subPanelOpen, setSubPanelOpen] = useState(false);

  // Results & state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false);

  // AI Top-3 summary
  const [aiTop3, setAiTop3] = useState<any | null>(null);
  const [aiTop3Loading, setAiTop3Loading] = useState(false);

  useEffect(() => {
    if (!includeHotel) {
      setSortBasis("flightOnly");
    }
  }, [includeHotel]);

  useEffect(() => {
    if (!roundTrip) {
      setReturnDate("");
    }
  }, [roundTrip]);

  useEffect(() => {
    if (!includeHotel) return;

    if (departDate && hotelCheckIn && hotelCheckIn < departDate) {
      setHotelCheckIn(departDate);
    }

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
    setChildAges((prev) => {
      const copy = prev.slice(0, children);
      while (copy.length < children) copy.push(8);
      return copy;
    });
  }, [children]);

  // Helper to clear / reset results (used for resets + mode switching)
  function clearResults() {
    setResults(null);
    setError(null);
    setShowControls(false);
    setComparedIds([]);
    setAiTop3(null);
    setAiTop3Loading(false);
    setSubPanelOpen(false);
    setListTab("all");
  }

  // Clear results whenever mode changes
  useEffect(() => {
    clearResults();
  }, [mode]);

  function swapOriginDest() {
    setOriginCode((oc) => {
      const dc = destCode;
      setDestCode(oc);
      return dc;
    });
    setOriginDisplay((od) => {
      const dd = destDisplay;
      setDestDisplay(od);
      return dd;
    });
  }

  /**
   * Called when AiTripPlanner finishes constructing search parameters
   * and wants to run the real /api/search under the hood.
   */
  async function handleAiSearchComplete(payload: {
    searchParams: any;
    searchResult: any;
    planning: any;
  }) {
    try {
      clearResults();
      const sp = payload?.searchParams || {};

      const origin = sp.origin;
      const destination = sp.destination;
      const departDate = sp.departDate;
      const roundTrip = sp.roundTrip !== false;
      const returnDate = roundTrip ? sp.returnDate : undefined;

      const passengersAdults = sp.passengersAdults ?? 1;
      const passengersChildren = sp.passengersChildren ?? 0;
      const passengersInfants = sp.passengersInfants ?? 0;
      const passengersChildrenAges = Array.isArray(sp.passengersChildrenAges)
        ? sp.passengersChildrenAges
        : [];

      const includeHotel = !!sp.includeHotel;

      const body = {
        origin,
        destination,
        departDate,
        returnDate,
        roundTrip,
        passengersAdults,
        passengersChildren,
        passengersChildrenAges,
        passengersInfants,
        cabin: sp.cabin || "ECONOMY",
        includeHotel,
        hotelCheckIn: includeHotel ? sp.hotelCheckIn || departDate : undefined,
        hotelCheckOut: includeHotel ? sp.hotelCheckOut || returnDate : undefined,
        minHotelStar: typeof sp.minHotelStar === "number" ? sp.minHotelStar : 0,
        minBudget: typeof sp.minBudget === "number" ? sp.minBudget : undefined,
        maxBudget: typeof sp.maxBudget === "number" ? sp.maxBudget : undefined,
        currency: sp.currency || currency,
        maxStops:
          sp.maxStops === 0 || sp.maxStops === 1 || sp.maxStops === 2
            ? sp.maxStops
            : 2,
      };

      const resp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const j = await resp.json();
      if (!resp.ok) {
        throw new Error(j?.error || "Search failed");
      }

      const arr = Array.isArray(j.results) ? j.results : [];
      const withIds = arr.map((res: any, i: number) => ({
        id: res.id ?? `ai-${i}`,
        ...body,
        ...res,
      }));

      setResults(withIds);
      setShowControls(true);
      setListTab("all");
      setSubTab("explore");
      setSubPanelOpen(false);
      setComparedIds([]);
      setError(null);

      // Synchronize manual form with AI search
      if (origin) setOriginCode(origin);
      if (destination) setDestCode(destination);
      setRoundTrip(roundTrip);
      if (departDate) setDepartDate(departDate);
      if (returnDate) setReturnDate(returnDate || "");
      setAdults(passengersAdults);
      setChildren(passengersChildren);
      setInfants(passengersInfants);
      setChildAges(passengersChildrenAges);
      setCabin(body.cabin as any);
      setIncludeHotel(includeHotel);
      if (includeHotel) {
        if (body.hotelCheckIn) setHotelCheckIn(body.hotelCheckIn);
        if (body.hotelCheckOut) setHotelCheckOut(body.hotelCheckOut);
        setMinHotelStar(body.minHotelStar || 0);
        setMinBudget(
          typeof body.minBudget === "number" ? String(body.minBudget) : ""
        );
        setMaxBudget(
          typeof body.maxBudget === "number" ? String(body.maxBudget) : ""
        );
      } else {
        setHotelCheckIn("");
        setHotelCheckOut("");
        setMinHotelStar(0);
        setMinBudget("");
        setMaxBudget("");
      }
      if (body.currency) setCurrency(body.currency);
      setMaxStops(body.maxStops as 0 | 1 | 2);
    } catch (err: any) {
      console.error("handleAiSearchComplete error", err);
      setError(err?.message || "AI search failed");
    }
  }

  /** Manual search */
  async function runSearch() {
    setLoading(true);
    clearResults();
    try {
      const origin = originCode || extractIATA(originDisplay);
      const destination = destCode || extractIATA(destDisplay);
      if (!origin || !destination) {
        throw new Error("Please select origin and destination.");
      }
      if (!departDate) throw new Error("Please pick a departure date.");
      if (roundTrip && !returnDate) {
        throw new Error("Please pick a return date.");
      }

      const payload = {
        id: undefined as any,
        origin,
        destination,
        departDate,
        returnDate: roundTrip ? returnDate : undefined,
        roundTrip,
        passengersAdults: adults,
        passengersChildren: children,
        passengersChildrenAges: childAges,
        passengersInfants: infants,
        cabin,
        includeHotel,
        hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget:
          includeHotel && minBudget ? Number(minBudget) : undefined,
        maxBudget:
          includeHotel && maxBudget ? Number(maxBudget) : undefined,
        currency,
        maxStops,
      };

      const r = await fetch(`/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Search failed");

      const arr = Array.isArray(j.results) ? j.results : [];
      const withIds = arr.map((res: any, i: number) => ({
        id: res.id ?? `r-${i}`,
        ...payload,
        ...res,
      }));
      setResults(withIds);

      setShowControls(true);
      setListTab("all");
      setSubTab("explore");
      setSubPanelOpen(false);
      setComparedIds([]);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // AI Top-3 summary call
  useEffect(() => {
    if (!results || results.length === 0) {
      setAiTop3(null);
      return;
    }
    async function go() {
      try {
        setAiTop3Loading(true);
        const res = await fetch("/api/ai/top3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results }),
        });
        const data = await res.json();
        if (data.ok) setAiTop3(data.top3 || null);
        else console.warn("AI top3 error:", data.error);
      } catch (e) {
        console.error("AI top3 fetch failed:", e);
      } finally {
        setAiTop3Loading(false);
      }
    }
    go();
  }, [results]);

  const sortedResults = useMemo(() => {
    if (!results) return null;
    const items = [...results];

    const flightPrice = (p: any) =>
      num(p.flight_total) ??
      num(p.total_cost_flight) ??
      num(p.flight?.price_usd_converted) ??
      num(p.flight?.price_usd) ??
      num(p.total_cost) ??
      9e15;

    const bundleTotal = (p: any) =>
      num(p.total_cost) ??
      (num(p.flight_total) ?? flightPrice(p)) + (num(p.hotel_total) ?? 0);

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
      items.sort((a, b) => basis(a)! - basis(b)!);
    } else if (sort === "fastest") {
      items.sort((a, b) => outDur(a)! - outDur(b)!);
    } else if (sort === "flexible") {
      items.sort(
        (a, b) =>
          (a.flight?.refundable ? 0 : 1) - (b.flight?.refundable ? 0 : 1) ||
          basis(a)! - basis(b)!,
      );
    } else {
      // "best"
      items.sort(
        (a, b) => basis(a)! - basis(b)! || outDur(a)! - outDur(b)!,
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

  // Slightly larger label + input styles for better legibility
  const sLabel: React.CSSProperties = {
    fontWeight: 600,
    color: "#334155",
    display: "block",
    marginBottom: 6,
    fontSize: 18,
  };
  const sInput: React.CSSProperties = {
    height: 46,
    padding: "0 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    width: "100%",
    background: "#fff",
    fontSize: 17,
  };

  function clickSubTab(tab: SubTab) {
    if (tab === subTab) {
      // clicking the same tab toggles open/closed
      setSubPanelOpen((v) => !v);
    } else {
      setSubTab(tab);
      setSubPanelOpen(true);
    }
  }

  /**
   * Infer the "city" to pass to Explore/Savor/Misc
   */
  function getExploreCity(): string {
    const fromDisplay = cityFromDisplay(destDisplay);
    if (fromDisplay && fromDisplay.toLowerCase() !== "destination") {
      return fromDisplay;
    }

    if (results && results.length > 0) {
      const p = results[0] || {};
      let rawCity: string | undefined =
        p.destinationCity ||
        p.city ||
        p.destinationName ||
        p.destination_full_name ||
        p.destination ||
        p.destinationCode ||
        "";

      if (rawCity) {
        let c = String(rawCity);
        if (c.includes("—")) {
          const parts = c.split("—").map((s) => s.trim());
          c = parts[parts.length - 1];
        }
        if (c.includes(",")) {
          c = c.split(",")[0].trim();
        }
        if (c.length > 0) return c;
      }
    }

    return "your destination";
  }

  const ResultsArea: React.FC = () => {
    if (!showControls && !results && !error) return null;

    const exploreCity = getExploreCity();

    return (
      <>
        {/* Explore / Savor / Misc */}
        {showControls && (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                color: "#475569",
                fontWeight: 700,
              }}
            >
              <button
                className={`subtab ${
                  subTab === "explore" && subPanelOpen ? "on" : ""
                }`}
                onClick={() => clickSubTab("explore")}
              >
                Explore
              </button>
              <button
                className={`subtab ${
                  subTab === "savor" && subPanelOpen ? "on" : ""
                }`}
                onClick={() => clickSubTab("savor")}
              >
                Savor
              </button>
              <button
                className={`subtab ${
                  subTab === "misc" && subPanelOpen ? "on" : ""
                }`}
                onClick={() => clickSubTab("misc")}
              >
                Miscellaneous
              </button>
              <style jsx>{`
                .subtab {
                  padding: 8px 14px;
                  border-radius: 999px;
                  background: #fff;
                  border: 1px solid #e2e8f0;
                  cursor: pointer;
                  font-size: 16px;
                }
                .subtab.on {
                  background: #0ea5e9;
                  color: #fff;
                  border: none;
                }
              `}</style>
            </div>

            {subPanelOpen && (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#fff",
                  padding: 12,
                  marginTop: 8,
                }}
              >
                <ExploreSavorTabs city={exploreCity} active={subTab} />
              </div>
            )}
          </>
        )}

        {/* Sort & view chips */}
        {showControls && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            <button
              className={`chip ${sort === "best" ? "on" : ""}`}
              onClick={() => setSort("best")}
            >
              Best
            </button>
            <button
              className={`chip ${sort === "cheapest" ? "on" : ""}`}
              onClick={() => setSort("cheapest")}
            >
              Cheapest
            </button>
            <button
              className={`chip ${sort === "fastest" ? "on" : ""}`}
              onClick={() => setSort("fastest")}
            >
              Fastest
            </button>
            <button
              className={`chip ${sort === "flexible" ? "on" : ""}`}
              onClick={() => setSort("flexible")}
            >
              Flexible
            </button>
            <span style={{ marginLeft: 8 }} />
            <button
              className={`chip ${listTab === "top3" ? "on" : ""}`}
              onClick={() => setListTab("top3")}
            >
              Top-3
            </button>
            <button
              className={`chip ${listTab === "all" ? "on" : ""}`}
              onClick={() => setListTab("all")}
            >
              All
            </button>
            <button className="chip" onClick={() => window.print()}>
              Print
            </button>
            <style jsx>{`
              .chip {
                padding: 8px 14px;
                border-radius: 999px;
                border: 1px solid #e2e8f0;
                background: #ffffff;
                font-size: 16px;
                cursor: pointer;
              }
              .chip.on {
                background: #0f172a;
                color: #ffffff;
                border-color: #0f172a;
              }
            `}</style>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#7f1d1d",
              padding: 10,
              borderRadius: 10,
              marginTop: 8,
              fontSize: 15,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* AI Top-3 summary explanation */}
        {aiTop3 && results && results.length > 0 && (
          <div
            style={{
              background: "#0f172a",
              color: "white",
              borderRadius: 16,
              padding: 14,
              display: "grid",
              gap: 6,
              marginTop: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20 }}>
              ✨ AI’s top picks
              {aiTop3Loading && (
                <span
                  style={{
                    fontSize: 14,
                    marginLeft: 8,
                    opacity: 0.8,
                    fontWeight: 400,
                  }}
                >
                  (refreshing…)
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: 15,
                opacity: 0.9,
                marginTop: 2,
              }}
            >
              These are shortcuts picked from your live{" "}
              <strong>flight + hotel bundles</strong>:{" "}
              <strong>best overall</strong>, <strong>best budget</strong>, and{" "}
              <strong>best comfort</strong>. Scroll down to see the full card
              details for these picks and every other option.
            </div>

            <ul
              style={{
                margin: 4,
                marginLeft: 20,
                paddingLeft: 0,
                fontSize: 15,
              }}
            >
              {["best_overall", "best_budget", "best_comfort"].map((key) => {
                const info = (aiTop3 as any)[key];
                if (!info?.id) return null;
                const pkg = results.find(
                  (r) => String(r.id) === String(info.id)
                );
                if (!pkg) return null;

                const title =
                  key === "best_overall"
                    ? "Best overall"
                    : key === "best_budget"
                    ? "Best for budget"
                    : "Best for comfort";

                const destText =
                  pkg.destination ||
                  pkg.destinationName ||
                  getExploreCity();

                return (
                  <li key={key}>
                    <strong>{title}:</strong>{" "}
                    <span>
                      {destText} – {info.reason || "chosen by AI"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Result cards */}
        {(shown?.length ?? 0) > 0 && (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {shown.map((pkg, i) => (
              <ResultCard
                key={pkg.id || i}
                pkg={pkg}
                index={i}
                currency={currency}
                pax={totalPax}
                showHotel={includeHotel}
                hotelNights={
                  includeHotel ? nightsBetween(hotelCheckIn, hotelCheckOut) : 0
                }
                showAllHotels={listTab === "all"}
                comparedIds={comparedIds}
                onToggleCompare={(id) => toggleCompare(id)}
                onSavedChangeGlobal={() => {}}
              />
            ))}
          </div>
        )}

        {/* Compare panel */}
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
    );
  };

  return (
    <div style={{ padding: 12, display: "grid", gap: 16 }}>
      {/* TOP TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 4,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setMode((m) => (m === "ai" ? "none" : "ai"))}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 999,
            border: "1px solid #e2e8f0",
            background:
              mode === "ai"
                ? "linear-gradient(135deg,#38bdf8,#6366f1,#ec4899)"
                : "#ffffff",
            color: mode === "ai" ? "#ffffff" : "#0f172a",
            fontWeight: 700,
            fontSize: 19,
            cursor: "pointer",
          }}
        >
          ✨ AI Trip Planning
        </button>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "manual" ? "none" : "manual"))}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 999,
            border: "1px solid #e2e8f0",
            background: mode === "manual" ? "#0f172a" : "#ffffff",
            color: mode === "manual" ? "#ffffff" : "#0f172a",
            fontWeight: 700,
            fontSize: 19,
            cursor: "pointer",
          }}
        >
          🔎 Manual Search
        </button>
      </div>

      {/* CENTERED INTRO WHEN NO MODE SELECTED */}
      {mode === "none" && (
        <div
          style={{
            padding: 32,
            borderRadius: 24,
            border: "1px solid rgba(129,140,248,0.35)",
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(129,140,248,0.14), rgba(236,72,153,0.10))",
            color: "#0f172a",
            fontSize: 18,
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 30 }}>🧳 Ready to plan a trip?</div>
          <div>
            Choose <strong>AI Trip Planning</strong> for a smart itinerary and
            top picks, or <strong>Manual Search</strong> to fine-tune every
            detail yourself.
          </div>
          <div
            style={{
              fontSize: 15,
              opacity: 0.8,
              marginTop: 4,
            }}
          >
            You can switch tabs anytime — results stay separate for AI and
            Manual modes.
          </div>
        </div>
      )}

      {/* AI MODE */}
      {mode === "ai" && (
        <>
          <div className="ai-trip-wrapper">
            <AiTripPlanner onSearchComplete={handleAiSearchComplete} />

            {/* Reset button for AI results */}
            <div
              style={{
                marginTop: 10,
                textAlign: "right",
              }}
            >
              <button
                type="button"
                onClick={clearResults}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Reset AI trip results
              </button>
            </div>
          </div>

          {/* Hero image directly under AI Trip Planner */}
          {results && results.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {(() => {
                const p = results[0] || {};
                const rawCity =
                  p.destinationCity ||
                  p.destinationName ||
                  p.city ||
                  p.destination ||
                  destDisplay ||
                  "your destination";

                const city =
                  typeof rawCity === "string"
                    ? rawCity.split(",")[0]
                    : "your destination";
                const hero = getHeroImage(city);

                return (
                  <img
                    src={hero.url}
                    alt={hero.alt}
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      objectFit: "cover",
                      borderRadius: 18,
                      display: "block",
                    }}
                  />
                );
              })()}
            </div>
          )}

          <ResultsArea />
          {/* Compare Destinations with AI (no currency prop) */}
          <AiDestinationCompare />
        </>
      )}

      {/* MANUAL MODE */}
      {mode === "manual" && (
        <>
          <form
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 16,
              display: "grid",
              gap: 16,
            }}
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            {/* origin / destination */}
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
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
                aria-hidden
              >
                <button
                  type="button"
                  onClick={swapOriginDest}
                  title="Swap origin & destination"
                  style={{
                    height: 42,
                    width: 42,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 20,
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
                  code={destCode}
                  initialDisplay={destDisplay}
                  onTextChange={setDestDisplay}
                  onChangeCode={(code, display) => {
                    setDestCode(code);
                    setDestDisplay(display);
                  }}
                />
              </div>
            </div>

            {/* trip / dates / pax */}
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
                alignItems: "end",
              }}
            >
              <div style={{ minWidth: 160 }}>
                <label style={sLabel}>Trip</label>
                <div
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRoundTrip(false)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${
                        roundTrip ? "#e2e8f0" : "#60a5fa"
                      }`,
                      fontSize: 15,
                    }}
                  >
                    One-way
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoundTrip(true)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${
                        roundTrip ? "#60a5fa" : "#e2e8f0"
                      }`,
                      fontSize: 15,
                    }}
                  >
                    Round-trip
                  </button>
                </div>
              </div>

              <div>
                <label style={sLabel}>Depart</label>
                <input
                  type="date"
                  style={sInput}
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  min={todayLocal}
                  max={roundTrip && returnDate ? returnDate : undefined}
                />
              </div>

              <div>
                <label style={sLabel}>Return</label>
                <input
                  type="date"
                  style={sInput}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  disabled={!roundTrip}
                  min={
                    departDate
                      ? plusDays(departDate, 1)
                      : plusDays(todayLocal, 1)
                  }
                />
              </div>

              <div>
                <label style={sLabel}>Adults</label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={adults}
                  onChange={(e) =>
                    setAdults(parseInt(e.target.value || "1"))
                  }
                  style={sInput}
                />
              </div>
              <div>
                <label style={sLabel}>Children</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={children}
                  onChange={(e) =>
                    setChildren(
                      Math.max(
                        0,
                        Math.min(8, parseInt(e.target.value || "0"))
                      )
                    )
                  }
                  style={sInput}
                />
              </div>
              <div>
                <label style={sLabel}>Infants</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={infants}
                  onChange={(e) =>
                    setInfants(parseInt(e.target.value || "0"))
                  }
                  style={sInput}
                />
              </div>
            </div>

            {/* child ages */}
            {children > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ fontWeight: 700, color: "#334155" }}>
                  Children’s ages
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {Array.from({ length: children }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 0,
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <label
                        style={{
                          padding: "8px 10px",
                          fontWeight: 700,
                          fontSize: 14,
                          display: "inline-block",
                        }}
                      >
                        Child {i + 1}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={17}
                        value={childAges[i] ?? 8}
                        onChange={(e) => {
                          const v = Math.max(
                            0,
                            Math.min(17, parseInt(e.target.value || "0"))
                          );
                          setChildAges((prev) => {
                            const copy = prev.slice();
                            copy[i] = v;
                            return copy;
                          });
                        }}
                        style={{
                          width: 64,
                          height: 40,
                          border: "1px solid #e2e8f0",
                          borderRadius: 12,
                          margin: 6,
                          padding: "0 8px",
                          fontSize: 15,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* cabin / stops / hotel */}
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
              }}
            >
              <div>
                <label style={sLabel}>Cabin</label>
                <select
                  style={sInput}
                  value={cabin}
                  onChange={(e) => setCabin(e.target.value as Cabin)}
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">
                    Premium Economy
                  </option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                </select>
              </div>

              <div>
                <label style={sLabel}>Stops</label>
                <select
                  style={sInput}
                  value={maxStops}
                  onChange={(e) =>
                    setMaxStops(Number(e.target.value) as 0 | 1 | 2)
                  }
                >
                  <option value={0}>Nonstop</option>
                  <option value={1}>1 stop</option>
                  <option value={2}>More than 1 stop</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 22,
                }}
              >
                <input
                  id="include-hotel"
                  type="checkbox"
                  checked={includeHotel}
                  onChange={(e) => setIncludeHotel(e.target.checked)}
                />
                <label
                  htmlFor="include-hotel"
                  style={{ fontWeight: 700, fontSize: 16 }}
                >
                  Include hotel
                </label>
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "1px solid #CBD5E1",
                    background: "#0ea5e9",
                    color: "#fff",
                    fontWeight: 800,
                    marginTop: 8,
                    marginRight: 8,
                    fontSize: 16,
                  }}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOriginCode("");
                    setOriginDisplay("");
                    setDestCode("");
                    setDestDisplay("");
                    setRoundTrip(true);
                    setDepartDate("");
                    setReturnDate("");
                    setAdults(1);
                    setChildren(0);
                    setInfants(0);
                    setChildAges([]);
                    setCabin("ECONOMY");
                    setMaxStops(2);
                    setIncludeHotel(false);
                    setHotelCheckIn("");
                    setHotelCheckOut("");
                    setMinHotelStar(0);
                    setMinBudget("");
                    setMaxBudget("");
                    clearResults();
                  }}
                  title="Reset all fields and results"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "1px solid #CBD5E1",
                    background: "#fff",
                    fontWeight: 800,
                    marginTop: 8,
                    fontSize: 16,
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {includeHotel && (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(6, 1fr)",
                }}
              >
                <div>
                  <label style={sLabel}>Check-in</label>
                  <input
                    type="date"
                    style={sInput}
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    min={departDate || undefined}
                  />
                </div>
                <div>
                  <label style={sLabel}>Check-out</label>
                  <input
                    type="date"
                    style={sInput}
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                    min={hotelCheckIn || departDate || undefined}
                    max={roundTrip ? returnDate || undefined : undefined}
                  />
                </div>
                <div>
                  <label style={sLabel}>Min stars</label>
                  <select
                    style={sInput}
                    value={minHotelStar}
                    onChange={(e) =>
                      setMinHotelStar(Number(e.target.value))
                    }
                  >
                    <option value={0}>Any</option>
                    <option value={2}>2+</option>
                    <option value={3}>3+</option>
                    <option value={4}>4+</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div>
                  <label style={sLabel}>Min budget</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="min"
                    style={sInput}
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                  />
                </div>
                <div>
                  <label style={sLabel}>Max budget</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="max"
                    style={sInput}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                  />
                </div>
                <div>
                  <label style={sLabel}>Sort by (basis)</label>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 6,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSortBasis("flightOnly")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${
                          sortBasis === "flightOnly"
                            ? "#60a5fa"
                            : "#e2e8f0"
                        }`,
                        fontSize: 15,
                      }}
                    >
                      Flight only
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBasis("bundle")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${
                          sortBasis === "bundle"
                            ? "#60a5fa"
                            : "#e2e8f0"
                        }`,
                        fontSize: 15,
                      }}
                    >
                      Bundle total
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>

          <ResultsArea />
        </>
      )}

      {/* Global typography overrides for clearer / larger text */}
      <style jsx global>{`
        html,
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-size: 18px;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        .ai-trip-wrapper {
          font-size: 18px;
        }

        .ai-trip-wrapper h2 {
          font-size: 30px;
          font-weight: 800;
        }

        .ai-trip-wrapper p {
          font-size: 18px;
          line-height: 1.6;
        }

        .ai-trip-wrapper textarea {
          font-size: 17px;
        }

        .ai-trip-wrapper button {
          font-size: 18px;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
