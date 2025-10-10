"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResultCard from "../components/ResultCard";
import SavedChip from "../components/SavedChip";

export const dynamic = "force-dynamic";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type SortBasis = "flightOnly" | "bundle";

type SearchPayload = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  roundTrip: boolean;

  passengers: number;
  passengersAdults: number;
  passengersChildren: number;
  passengersInfants: number;
  passengersChildrenAges?: number[];

  cabin: Cabin;

  includeHotel: boolean;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  minHotelStar?: number;

  minBudget?: number;
  maxBudget?: number;
  currency: string;
  sort: SortKey;
  sortBasis?: SortBasis;
  maxStops?: 0 | 1 | 2;
  refundable?: boolean;
  greener?: boolean;
};

const CABINS: Cabin[] = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];
const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "INR"];
const STOP_CHOICES = [
  { v: "", label: "More than 1 stop" },
  { v: "0", label: "Non-stop" },
  { v: "1", label: "1 stop" },
  { v: "2", label: "2 stops" },
] as const;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-slate-500">Loading…</div>}>
      <PageInner />
    </Suspense>
  );
}

function PageInner() {
  const router = useRouter();
  const qs = useSearchParams();

  // --- Form state
  const [origin, setOrigin] = useState(qs.get("origin") || "");
  const [destination, setDestination] = useState(qs.get("destination") || "");
  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState(qs.get("depart") || "");
  const [returnDate, setReturnDate] = useState(qs.get("return") || "");

  const [adults, setAdults] = useState<number>(Number(qs.get("adults") || 1));
  const [children, setChildren] = useState<number>(Number(qs.get("children") || 0));
  const [infants, setInfants] = useState<number>(Number(qs.get("infants") || 0));
  const [childrenAges, setChildrenAges] = useState<number[]>(
    (qs.get("cAges") || "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isFinite(n))
  );
  const [cabin, setCabin] = useState<Cabin>("ECONOMY");

  const [includeHotel, setIncludeHotel] = useState<boolean>(qs.get("hotel") === "1");
  const [hotelCheckIn, setHotelCheckIn] = useState(qs.get("hci") || "");
  const [hotelCheckOut, setHotelCheckOut] = useState(qs.get("hco") || "");
  const [minHotelStar, setMinHotelStar] = useState<number | undefined>(
    qs.get("hstar") ? Number(qs.get("hstar")) : undefined
  );

  const [minBudget, setMinBudget] = useState(qs.get("bmin") || "");
  const [maxBudget, setMaxBudget] = useState(qs.get("bmax") || "");
  const [currency, setCurrency] = useState(qs.get("cur") || "USD");
  const [sort, setSort] = useState<SortKey>("best");
  const [sortBasis, setSortBasis] = useState<SortBasis>("flightOnly");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2 | undefined>(undefined);
  const [refundable, setRefundable] = useState(false);
  const [greener, setGreener] = useState(false);

  // compare & saved
  const [compared, setCompared] = useState<string[]>([]);
  const toggleCompare = (id: string) =>
    setCompared((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const [savedCount, setSavedCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    const h = () => {
      try {
        const arr = JSON.parse(localStorage.getItem("triptrio:saved") || "[]");
        setSavedCount(Array.isArray(arr) ? arr.length : 0);
      } catch {}
    };
    window.addEventListener("triptrio:saved:changed", h);
    return () => window.removeEventListener("triptrio:saved:changed", h);
  }, []);

  // children age fields stay in sync
  useEffect(() => {
    setChildrenAges((prev) => {
      const next = prev.slice(0, children);
      while (next.length < children) next.push(8);
      return next;
    });
  }, [children]);

  // results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hotelWarning, setHotelWarning] = useState<string | null>(null);
  const showHotelFields = useMemo(() => includeHotel === true, [includeHotel]);

  // --- Search
  async function runSearch() {
    setLoading(true);
    setCompared([]);
    try {
      const params = new URLSearchParams();
      if (origin) params.set("origin", origin);
      if (destination) params.set("destination", destination);
      if (departDate) params.set("depart", departDate);
      if (returnDate) params.set("return", returnDate);
      params.set("adults", String(adults));
      if (children) params.set("children", String(children));
      if (infants) params.set("infants", String(infants));
      if (childrenAges.length) params.set("cAges", childrenAges.join(","));
      if (includeHotel) {
        params.set("hotel", "1");
        if (hotelCheckIn) params.set("hci", hotelCheckIn);
        if (hotelCheckOut) params.set("hco", hotelCheckOut);
        if (minHotelStar != null) params.set("hstar", String(minHotelStar));
      }
      if (minBudget) params.set("bmin", minBudget);
      if (maxBudget) params.set("bmax", maxBudget);
      if (currency && currency !== "USD") params.set("cur", currency);
      router.replace(`/?${params.toString()}`);

      const payload: SearchPayload = {
        origin,
        destination,
        departDate,
        returnDate: roundTrip ? returnDate : undefined,
        roundTrip,
        passengers: adults + children + infants,
        passengersAdults: adults,
        passengersChildren: children,
        passengersInfants: infants,
        passengersChildrenAges: childrenAges,
        cabin,
        includeHotel,
        hotelCheckIn: includeHotel ? hotelCheckIn : undefined,
        hotelCheckOut: includeHotel ? hotelCheckOut : undefined,
        minHotelStar: includeHotel ? minHotelStar : undefined,
        minBudget: minBudget ? Number(minBudget) : undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        currency,
        sort,
        sortBasis,
        maxStops,
        refundable,
        greener,
      };

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Search failed");
      setResults(j?.results || []);
      setHotelWarning(j?.hotelWarning || null);
    } catch (e: any) {
      alert(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // --- Reset: acts like a fresh page load (no query params, cleared state/results)
  function handleReset() {
    // Clear URL
    router.replace("/");
    // Clear all state
    setOrigin("");
    setDestination("");
    setRoundTrip(true);
    setDepartDate("");
    setReturnDate("");
    setAdults(1);
    setChildren(0);
    setInfants(0);
    setChildrenAges([]);
    setCabin("ECONOMY");
    setIncludeHotel(false);
    setHotelCheckIn("");
    setHotelCheckOut("");
    setMinHotelStar(undefined);
    setMinBudget("");
    setMaxBudget("");
    setCurrency("USD");
    setSort("best");
    setSortBasis("flightOnly");
    setMaxStops(undefined);
    setRefundable(false);
    setGreener(false);
    setCompared([]);
    setResults([]);
    setHotelWarning(null);
    // Optional: also scroll to top
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const chip = (active = false, tone: "flight" | "hotel" | "neutral" = "neutral") =>
    `inline-block h-8 px-3 rounded-full border font-extrabold ${
      active
        ? tone === "hotel"
          ? "tt-chip-acc-hotel"
          : tone === "flight"
          ? "tt-chip-acc-flight"
          : "tt-chip-acc-neutral"
        : "tt-chip"
    }`;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 text-slate-700 text-sm">
        <span className={`${chip(true, "flight")}`}>Top-3 picks</span>
        <span>•</span>
        <span className="hover:underline cursor-default">Smarter</span>
        <span>•</span>
        <span className="hover:underline cursor-default">Clearer</span>
        <span>•</span>
        <span className="hover:underline cursor-default">Bookable</span>
        <div className="ml-auto"><SavedChip count={savedCount} /></div>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900">Find your perfect trip</h1>

      {/* Search card */}
      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Origin / Destination */}
          <div>
            <div className="font-semibold text-slate-800 mb-1">Origin</div>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="City, airport or code"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>
          <div>
            <div className="font-semibold text-slate-800 mb-1">Destination</div>
            <div className="flex gap-2">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                placeholder="City, airport or code"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <button
                type="button"
                className="w-10 rounded-xl border border-slate-300 font-bold"
                title="Swap"
                onClick={() => {
                  setOrigin((o) => {
                    const tmp = destination;
                    setDestination(o);
                    return tmp;
                  });
                }}
              >
                ⇄
              </button>
            </div>
          </div>

          {/* Trip */}
          <div>
            <div className="font-semibold text-slate-800 mb-1">Trip</div>
            <div className="flex gap-2">
              <button type="button" className={chip(!roundTrip, "flight")} onClick={() => setRoundTrip(false)}>
                One-way
              </button>
              <button type="button" className={chip(roundTrip, "flight")} onClick={() => setRoundTrip(true)}>
                Round-trip
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Depart</div>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Return</div>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={!roundTrip}
              />
            </div>
          </div>

          {/* Pax & Cabin */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Adults</div>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Children</div>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={children}
                onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Infants</div>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={infants}
                onChange={(e) => setInfants(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Cabin</div>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={cabin}
                onChange={(e) => setCabin(e.target.value as Cabin)}
              >
                {CABINS.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stops / flags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Stops</div>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={maxStops ?? ""}
                onChange={(e) => setMaxStops(e.target.value ? (Number(e.target.value) as 0 | 1 | 2) : undefined)}
              >
                {STOP_CHOICES.map((opt) => (
                  <option key={opt.label} value={opt.v}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6 pt-7">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={refundable} onChange={(e) => setRefundable(e.target.checked)} />
                <span>Refundable</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={greener} onChange={(e) => setGreener(e.target.checked)} />
                <span>Greener</span>
              </label>
            </div>
          </div>

          {/* Currency & budgets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Currency</div>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-slate-800 mb-1">Min budget</div>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="min"
                />
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-1">Max budget</div>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="max"
                />
              </div>
            </div>
          </div>

          {/* Include hotel + conditional hotel fields */}
          <div className="flex items-center gap-2">
            <input id="incHotel" type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
            <label htmlFor="incHotel" className="font-semibold">Include hotel</label>
          </div>

          <div className="lg:col-span-2 grid lg:grid-cols-3 gap-4" style={{ display: showHotelFields ? "grid" : "none" }}>
            {showHotelFields && (
              <>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Hotel check-in</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                  />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Hotel check-out</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                  />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Min hotel stars</div>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    value={minHotelStar ?? ""}
                    onChange={(e) => setMinHotelStar(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Any</option>
                    <option value="3">3★+</option>
                    <option value="4">4★+</option>
                    <option value="5">5★</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Sort basis */}
          <div>
            <div className="font-semibold text-slate-800 mb-1">Sort by (basis)</div>
            <div className="flex gap-2">
              <button type="button" className={chip(sortBasis === "flightOnly", "flight")} onClick={() => setSortBasis("flightOnly")}>
                Flight only
              </button>
              <button
                type="button"
                className={chip(sortBasis === "bundle", "hotel")}
                onClick={() => setSortBasis("bundle")}
                disabled={!includeHotel}
                title={!includeHotel ? "Enable 'Include hotel' to sort by bundle total" : ""}
              >
                Bundle total
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="lg:col-span-2 flex justify-end gap-2">
            <button
              onClick={handleReset}
              type="button"
              className="btn-secondary"
              title="Reset all fields"
            >
              Reset
            </button>

            <button
              onClick={runSearch}
              disabled={loading}
              className="btn-primary"
              title="Search"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs row */}
      <div className="flex flex-wrap items-center gap-3">
        <button className={chip(sort === "best", "flight")} onClick={() => setSort("best")}>Best overall</button>
        <button className={chip(sort === "cheapest", "flight")} onClick={() => setSort("cheapest")}>Cheapest</button>
        <button className={chip(sort === "fastest", "flight")} onClick={() => setSort("fastest")}>Fastest</button>
        <button className={chip(sort === "flexible", "flight")} onClick={() => setSort("flexible")}>Flexible</button>
        {/* Your Top-3 / All buttons could be wired to a count filter if you like */}
        <span className="ml-auto text-sm text-slate-600">
          {hotelWarning ? <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800">{hotelWarning}</span> : null}
        </span>
      </div>

      {/* Results */}
      <div className="mt-4 grid gap-4">
        {results.map((pkg, i) => (
          <ResultCard
            key={pkg.id || i}
            pkg={{
              ...pkg,
              origin,
              destination,
              hotelCheckIn,
              hotelCheckOut,
              passengersAdults: adults,
              passengersChildren: children,
              passengersChildrenAges: childrenAges,
            }}
            index={i}
            currency={currency}
            pax={adults + children + infants}
            comparedIds={compared}
            onToggleCompare={toggleCompare}
            onSavedChangeGlobal={setSavedCount}
            large={true}
            showHotel={includeHotel}
          />
        ))}
      </div>
    </div>
  );
}
