"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AirportField from "../components/AirportField";
import ResultCard from "../components/ResultCard";
import ComparePanel from "../components/ComparePanel";
import ExploreSavorTabs from "@/components/ExploreSavorTabs";
import AiTripPlanner from "../components/AiTripPlanner";
import AiDestinationCompare from "../components/AiDestinationCompare";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type ListTab = "top3" | "all";
type SubTab = "explore" | "savor" | "misc";

const todayLocal = new Date(
  Date.now() - new Date().getTimezoneOffset() * 60000
)
  .toISOString()
  .slice(0, 10);

function extractIATA(display: string): string {
  const s = String(display || "").toUpperCase().trim();
  let m = /\(([A-Z]{3})\)/.exec(s);
  if (m) return m[1];
  m = /^([A-Z]{3})\b/.exec(s);
  if (m) return m[1];
  return "";
}

function plusDays(iso: string, days: number) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function cityFromDisplay(txt: string) {
  if (!txt) return "";
  const parts = txt
    .split("—")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return txt.split(",")[0].trim();
}

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

const num = (v: any) =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

// ----- Hero image + city helpers -----

type HeroImage = { url: string; alt: string };

function getHeroImages(city: string): HeroImage[] {
  const c = city.toLowerCase();

  if (c.includes("las vegas") || c.includes("lv")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1516570161787-2fd917215a3d?auto=format&fit=crop&w=1600&q=80",
        alt: "Las Vegas Strip hotels and casinos at night",
      },
      {
        url: "https://images.unsplash.com/photo-1517959105821-eaf2591984c2?auto=format&fit=crop&w=1600&q=80",
        alt: "Las Vegas skyline with neon lights",
      },
    ];
  }

  if (c.includes("miami")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1517898717281-8e4385f1c4a2?auto=format&fit=crop&w=1600&q=80",
        alt: "Miami South Beach with palm trees and ocean",
      },
      {
        url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80",
        alt: "Art Deco buildings and palm trees in Miami",
      },
    ];
  }

  if (c.includes("new york") || c.includes("nyc")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=1600&q=80",
        alt: "New York City skyline at dusk",
      },
      {
        url: "https://images.unsplash.com/photo-1518300670681-9bb0e0cfb4a1?auto=format&fit=crop&w=1600&q=80",
        alt: "Times Square lights at night in New York City",
      },
    ];
  }

  if (c.includes("boston")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80",
        alt: "Boston skyline and harbor",
      },
      {
        url: "https://images.unsplash.com/photo-1581351123004-757df051db8c?auto=format&fit=crop&w=1600&q=80",
        alt: "Boston cityscape at sunset",
      },
    ];
  }

  if (c.includes("paris")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
        alt: "Eiffel Tower over Paris skyline",
      },
      {
        url: "https://images.unsplash.com/photo-1522098635838-0062c7a07a14?auto=format&fit=crop&w=1600&q=80",
        alt: "Seine river with Eiffel Tower in Paris",
      },
    ];
  }

  if (c.includes("agra")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80",
        alt: "Taj Mahal in Agra at sunrise",
      },
      {
        url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600&q=80",
        alt: "Path to the Taj Mahal in Agra",
      },
    ];
  }

  if (c.includes("hawaii") || c.includes("honolulu") || c.includes("maui")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=80",
        alt: "Tropical beach in Hawaii with palm trees",
      },
      {
        url: "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?auto=format&fit=crop&w=1600&q=80",
        alt: "Ocean and cliffs in Hawaii",
      },
    ];
  }

  if (c.includes("london")) {
    return [
      {
        url: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=1600&q=80",
        alt: "Big Ben and Houses of Parliament in London",
      },
      {
        url: "https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?auto=format&fit=crop&w=1600&q=80",
        alt: "Tower Bridge in London at sunset",
      },
    ];
  }

  // Neutral city skyline fallback (no cars)
  return [
    {
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
      alt: "Generic modern city skyline at night",
    },
  ];
}

function cityGuideUrl(city: string): string {
  const c = city.toLowerCase();

  if (c.includes("las vegas"))
    return "https://www.tripadvisor.com/Tourism-g45963-Las_Vegas_Nevada-Vacations.html";
  if (c.includes("miami"))
    return "https://www.tripadvisor.com/Tourism-g34438-Miami_Florida-Vacations.html";
  if (c.includes("boston"))
    return "https://www.tripadvisor.com/Tourism-g60745-Boston_Massachusetts-Vacations.html";
  if (c.includes("new york"))
    return "https://www.tripadvisor.com/Tourism-g60763-New_York_City_New_York-Vacations.html";
  if (c.includes("agra"))
    return "https://www.tripadvisor.com/Tourism-g297683-Agra_Agra_District_Uttar_Pradesh-Vacations.html";
  if (c.includes("paris"))
    return "https://www.tripadvisor.com/Tourism-g187147-Paris_Ile_de_France-Vacations.html";
  if (c.includes("honolulu") || c.includes("hawaii"))
    return "https://www.tripadvisor.com/Tourism-g60982-Honolulu_Oahu_Hawaii-Vacations.html";
  if (c.includes("london"))
    return "https://www.tripadvisor.com/Tourism-g186338-London_England-Vacations.html";

  return `https://www.google.com/search?q=${encodeURIComponent(
    city + " travel guide"
  )}`;
}

function cityToCountry(city: string): { country: string; flag: string } {
  const c = city.toLowerCase();

  if (c.includes("las vegas") || c.includes("miami") || c.includes("boston"))
    return { country: "United States", flag: "🇺🇸" };
  if (c.includes("new york")) return { country: "United States", flag: "🇺🇸" };
  if (c.includes("agra") || c.includes("delhi"))
    return { country: "India", flag: "🇮🇳" };
  if (c.includes("paris")) return { country: "France", flag: "🇫🇷" };
  if (c.includes("london")) return { country: "United Kingdom", flag: "🇬🇧" };
  if (c.includes("honolulu") || c.includes("hawaii"))
    return { country: "United States", flag: "🇺🇸" };

  return { country: "Destination", flag: "🌍" };
}

export default function Page() {
  const [mode, setMode] = useState<"ai" | "manual" | "none">("none");
  const [aiResetKey, setAiResetKey] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  // NEW: for AI hero city
  const [aiDestinationCity, setAiDestinationCity] = useState<string>("");

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
  const [childAges, setChildAges] = useState<number[]>([]);
  const totalPax = adults + children + infants;

  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    try {
      const cur = localStorage.getItem("triptrio:currency");
      if (cur) setCurrency(cur);
    } catch {}
    const handler = (e: any) =>
      setCurrency(
        e?.detail || localStorage.getItem("triptrio:currency") || "USD"
      );
    window.addEventListener("triptrio:currency", handler);
    return () => window.removeEventListener("triptrio:currency", handler);
  }, []);

  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(2);
  // API expects includeFlight/includeHotel flags. Flights are always included.
  const includeFlight = true;
  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [minHotelStar, setMinHotelStar] = useState(0);
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");

  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<"flightOnly" | "bundle">(
    "flightOnly"
  );
  const [listTab, setListTab] = useState<ListTab>("all");

  const [subTab, setSubTab] = useState<SubTab>("explore");
  const [subPanelOpen, setSubPanelOpen] = useState(false);

  // Manual/AI search runtime state (kept in one place; do not duplicate these)
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false);

  // Preserve results per-mode so switching tabs doesn't wipe the UI.
  const savedAiRef = useRef<{ results: any[] | null; error: string | null; showControls: boolean }>({
    results: null,
    error: null,
    showControls: false,
  });
  const savedManualRef = useRef<{ results: any[] | null; error: string | null; showControls: boolean }>({
    results: null,
    error: null,
    showControls: false,
  });

  useEffect(() => {
    const ref = mode === "ai" ? savedAiRef : savedManualRef;
    setResults(ref.current.results);
    setError(ref.current.error);
    setShowControls(ref.current.showControls);
    // comparedIds is only relevant for AI compare UI; keep current value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const ref = mode === "ai" ? savedAiRef : savedManualRef;
    ref.current = { results, error, showControls };
  }, [mode, results, error, showControls]);

  const [aiTop3, setAiTop3] = useState<any | null>(null);
  const [aiTop3Loading, setAiTop3Loading] = useState(false);

  useEffect(() => {
    if (!includeHotel) setSortBasis("flightOnly");
  }, [includeHotel]);

  useEffect(() => {
    if (!roundTrip) setReturnDate("");
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

  useEffect(() => {
    setHeroImageIndex(0);
  }, [results, destDisplay, aiDestinationCity]);

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

  // Keep results visible when switching between AI and Manual.

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

  // normalize IATA codes to city names
  function normalizeCityFromCode(codeOrName: string | undefined): string {
    if (!codeOrName) return "";
    let s = String(codeOrName).trim();
    if (!s) return "";

    const upper = s.toUpperCase();
    if (/^[A-Z]{3}$/.test(upper)) {
      switch (upper) {
        case "BOS":
          return "Boston";
        case "MIA":
          return "Miami";
        case "LAS":
          return "Las Vegas";
        case "JFK":
        case "LGA":
        case "EWR":
        case "NYC":
          return "New York";
        case "HNL":
          return "Honolulu";
        case "AGR":
          return "Agra";
        case "DEL":
          return "New Delhi";
        default:
          return upper;
      }
    }

    // Strip airport suffixes like ", MA" or "(BOS)"
    s = s.replace(/\(.*?\)/, "").trim();
    if (s.includes(",")) s = s.split(",")[0].trim();
    return s;
  }

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

      // NEW: capture destination city for hero image
      const rawCity =
        sp.destinationDisplay ||
        sp.destinationCity ||
        sp.destinationFullName ||
        sp.destinationName ||
        sp.destination ||
        destination;
      const normalizedCity = normalizeCityFromCode(rawCity);
      setAiDestinationCity(normalizedCity);

      const resp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || "Search failed");

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

  async function runSearch() {
    setLoading(true);
    clearResults();
    try {
      const origin = originCode || extractIATA(originDisplay);
      const destination = destCode || extractIATA(destDisplay);
      if (!origin || !destination)
        throw new Error("Please select origin and destination.");
      if (!departDate) throw new Error("Please pick a departure date.");
      if (roundTrip && !returnDate)
        throw new Error("Please pick a return date.");

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
        includeFlight,
        includeHotel,
        hotelCheckIn: includeHotel ? hotelCheckIn || undefined : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut || undefined : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
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

  const sLabel: React.CSSProperties = {
    fontWeight: 600,
    color: "#334155",
    display: "block",
    marginBottom: 6,
    fontSize: 18,
  };
  const sInput: React.CSSProperties = {
    height: 48,
    padding: "0 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    width: "100%",
    background: "#fff",
    fontSize: 18,
  };

  function clickSubTab(tab: SubTab) {
    if (tab === subTab) setSubPanelOpen((v) => !v);
    else {
      setSubTab(tab);
      setSubPanelOpen(true);
    }
  }

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
        if (c.includes(",")) c = c.split(",")[0].trim();
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
                  font-size: 18px;
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
                font-size: 17px;
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
              fontSize: 18,
            }}
          >
            ⚠ {error}
          </div>
        )}

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
            <div style={{ fontWeight: 700, fontSize: 24 }}>
              ✨ AI’s top picks
              {aiTop3Loading && (
                <span
                  style={{
                    fontSize: 15,
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
                fontSize: 18,
                opacity: 0.9,
                marginTop: 2,
              }}
            >
              Shortcuts from your live{" "}
              <strong>flight + hotel bundles</strong>:{" "}
              <strong>best overall</strong>, <strong>best budget</strong>,{" "}
              <strong>best comfort</strong>. Scroll down to see their full
              cards and all other options.
            </div>

            <ul
              style={{
                margin: 4,
                marginLeft: 20,
                paddingLeft: 0,
                fontSize: 17,
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
            fontSize: 22,
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
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          🔎 Manual Search
        </button>
      </div>

      {mode === "none" && (
        <div
          style={{
            padding: 32,
            borderRadius: 24,
            border: "1px solid rgba(129,140,248,0.35)",
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(129,140,248,0.14), rgba(236,72,153,0.10))",
            color: "#0f172a",
            fontSize: 20,
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 34 }}>🧳 Ready to plan a trip?</div>
          <div>
            Choose <strong>AI Trip Planning</strong> for a smart itinerary and
            top picks, or <strong>Manual Search</strong> to fine-tune every
            detail yourself.
          </div>
          <div
            style={{
              fontSize: 17,
              opacity: 0.8,
              marginTop: 4,
            }}
          >
            You can switch tabs anytime — results stay separate for AI and
            Manual modes.
          </div>
        </div>
      )}

      {mode === "ai" && (
        <>
          <div className="ai-trip-wrapper">
            <AiTripPlanner key={aiResetKey} onSearchComplete={handleAiSearchComplete} />

            <div
              style={{
                marginTop: 10,
                textAlign: "right",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  clearResults();
                  setAiResetKey((k) => k + 1);
                  setAiDestinationCity("");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                Reset AI trip results
              </button>
            </div>
          </div>

          {results && results.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {(() => {
                let cityGuess = aiDestinationCity;

                if (!cityGuess) {
                  const p = results[0] || {};
                  let raw =
                    p.destinationCity ||
                    p.city ||
                    p.destinationName ||
                    p.destination_full_name ||
                    p.destination ||
                    "";
                  cityGuess = normalizeCityFromCode(raw) || "destination";
                }

                const images = getHeroImages(cityGuess);
                const safeIndex =
                  images.length > 0 ? heroImageIndex % images.length : 0;
                const current = images[safeIndex] || images[0];
                const { country, flag } = cityToCountry(cityGuess);
                const guideUrl = cityGuideUrl(cityGuess);

                return (
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 18,
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      window.open(guideUrl, "_blank", "noopener,noreferrer")
                    }
                    title={`Open travel guide for ${cityGuess}`}
                  >
                    <img
                      key={`${cityGuess}-${safeIndex}`}
                      src={current.url}
                      alt={current.alt}
                      className="hero-image"
                      style={{
                        width: "100%",
                        maxHeight: 260,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        left: 16,
                        top: 16,
                        padding: "8px 14px",
                        borderRadius: 999,
                        background: "rgba(15,23,42,0.78)",
                        color: "#f9fafb",
                        fontWeight: 700,
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{flag}</span>
                      <span>
                        {cityGuess} • {country}
                      </span>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        right: 16,
                        bottom: 16,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "rgba(15,23,42,0.78)",
                        color: "#e5e7eb",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>Learn about {cityGuess}</span>
                      <span style={{ fontSize: 16 }}>↗</span>
                    </div>

                    {images.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: 10,
                          transform: "translateX(-50%)",
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHeroImageIndex(idx);
                            }}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              border: "none",
                              background:
                                idx === safeIndex
                                  ? "#f97316"
                                  : "rgba(148,163,184,0.9)",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <ResultsArea />
          {/* ✅ Pass currency prop so TypeScript is satisfied */}
          <AiDestinationCompare currency={currency} />
        </>
      )}

      {mode === "manual" && (
        <>
          <div
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 18,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
              🔎 Manual Search
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 64px 1fr",
                gap: 12,
                alignItems: "end",
              }}
            >
              <AirportField
                id="origin"
                label="From"
                code={originCode}
                initialDisplay={originDisplay}
                onTextChange={setOriginDisplay}
                onChangeCode={(code, display) => {
                  setOriginCode(code);
                  setOriginDisplay(display);
                }}
                autoFocus
              />

              <button
                type="button"
                onClick={swapOriginDest}
                title="Swap"
                style={{
                  height: 54,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  cursor: "pointer",
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                ⇄
              </button>

              <AirportField
                id="destination"
                label="To"
                code={destCode}
                initialDisplay={destDisplay}
                onTextChange={setDestDisplay}
                onChangeCode={(code, display) => {
                  setDestCode(code);
                  setDestDisplay(display);
                }}
              />
            </div>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Departure date
                </div>
                <input
                  type="date"
                  value={departDate}
                  min={todayLocal}
                  onChange={(e) => setDepartDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Return date</div>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={roundTrip}
                      onChange={(e) => setRoundTrip(e.target.checked)}
                    />
                    <span style={{ fontWeight: 700 }}>Round trip</span>
                  </label>
                </div>

                <input
                  type="date"
                  value={returnDate}
                  min={todayLocal}
                  disabled={!roundTrip}
                  onChange={(e) => setReturnDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                    opacity: roundTrip ? 1 : 0.5,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Adults</div>
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, Number(e.target.value || 1)))}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Children</div>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, Number(e.target.value || 0)))}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Infants</div>
                <input
                  type="number"
                  min={0}
                  value={infants}
                  onChange={(e) => setInfants(Math.max(0, Number(e.target.value || 0)))}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Cabin</div>
                <select
                  value={cabin}
                  onChange={(e) => setCabin(e.target.value as Cabin)}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                    background: "#fff",
                  }}
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                </select>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={includeHotel}
                    onChange={(e) => setIncludeHotel(e.target.checked)}
                  />
                  <span style={{ fontWeight: 800 }}>Include hotel</span>
                </label>
                <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
                  If enabled, results include flight + hotel bundle pricing.
                </div>
              </div>

              {/* Budget controls removed per request */}
            </div>

            {includeHotel && (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Hotel check-in</div>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    min={todayLocal}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    style={{
                      width: "100%",
                      height: 54,
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      padding: "0 14px",
                      fontSize: 18,
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Hotel check-out
                  </div>
                  <input
                    type="date"
                    value={hotelCheckOut}
                    min={todayLocal}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                    style={{
                      width: "100%",
                      height: 54,
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      padding: "0 14px",
                      fontSize: 18,
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Min hotel stars</div>
                  <select
                    value={minHotelStar}
                    onChange={(e) => setMinHotelStar(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 54,
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      padding: "0 14px",
                      fontSize: 18,
                      background: "#fff",
                    }}
                  >
                    <option value={0}>Any</option>
                    <option value={3}>3+</option>
                    <option value={4}>4+</option>
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {/* Currency & Sort removed from Manual search (kept in header) */}

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Basis</div>
                <select
                  value={sortBasis}
                  onChange={(e) => setSortBasis(e.target.value as any)}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                    background: "#fff",
                  }}
                >
                  <option value="flightOnly">Flight only</option>
                  <option value="bundle">Flight + hotel</option>
                </select>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Max stops</div>
                <select
                  value={maxStops}
                  onChange={(e) => setMaxStops(Number(e.target.value) as any)}
                  style={{
                    width: "100%",
                    height: 54,
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    padding: "0 14px",
                    fontSize: 18,
                    background: "#fff",
                  }}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={runSearch}
                disabled={loading}
                style={{
                  height: 56,
                  padding: "0 18px",
                  borderRadius: 14,
                  border: "1px solid #0f172a",
                  background: loading ? "#cbd5e1" : "#0f172a",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 18,
                  minWidth: 200,
                }}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontWeight: 700,
                }}
              >
                {error}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        html,
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-size: 20px;
          color: #0f172a;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        /* FORCE larger, clearer fonts in AI planner area */
        .ai-trip-wrapper,
        .ai-trip-wrapper * {
          font-size: 18px !important;
          line-height: 1.6 !important;
        }

        .ai-trip-wrapper h2 {
          font-size: 32px !important;
          font-weight: 800 !important;
        }

        .ai-trip-wrapper textarea {
          font-size: 18px !important;
        }

        .ai-trip-wrapper button {
          font-size: 20px !important;
          font-weight: 800 !important;
        }

        .result-card-title {
          font-size: 20px;
          font-weight: 800;
        }

        .result-card-subtitle {
          font-size: 18px;
        }

        .hero-image {
          animation: fadeInHero 0.6s ease-in-out;
        }

        @keyframes fadeInHero {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
