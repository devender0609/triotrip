"use client";

import React, { useState } from "react";
import ExploreSavorTabs from "./ExploreSavorTabs";

type CompareResponse = {
  ok: boolean;
  comparisons: {
    name: string;
    approx_cost_level: string;
    weather_summary: string;
    best_for: string;
    pros: string[];
    cons: string[];
    overall_vibe: string;
  }[];
};

interface Props {
  currency: string;
}

const AiDestinationCompare: React.FC<Props> = ({ currency }) => {
  const [destinations, setDestinations] = useState("Bali, Thailand, Hawaii");
  const [month, setMonth] = useState("December");
  const [days, setDays] = useState(7);
  const [homeCity, setHomeCity] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompareResponse["comparisons"]>([]);
  const [activeCityForExplore, setActiveCityForExplore] = useState<string | null>(null);

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResults([]);

    try {
      const raw: any = await fetch("/api/ai-destination-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinations,
          month,
          days,
          home: homeCity,
          currency,
        }),
      }).then((r) => r.json());

      const safe: CompareResponse = {
        ok: !!raw.ok,
        comparisons: Array.isArray(raw.comparisons) ? raw.comparisons : [],
      };

      if (!safe.ok) {
        throw new Error("AI could not compare these destinations.");
      }

      setResults(safe.comparisons);
      if (safe.comparisons.length > 0) {
        setActiveCityForExplore(safe.comparisons[0].name);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong while comparing.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResults([]);
    setError(null);
  }

  return (
    <section className="mt-10">
      <div className="rounded-3xl bg-slate-950/95 border border-slate-800 px-5 py-5 md:px-8 md:py-7 shadow-2xl text-slate-50">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              Compare destinations with AI{" "}
              <span role="img" aria-label="globe" className="text-lg">
                🌍
              </span>
            </h2>
            <p className="mt-1 text-sm md:text-base text-slate-300 max-w-3xl">
              Drop in a few places and we’ll compare them for typical cost, weather,
              food, hotels, nightlife, family-friendliness, safety, and the best
              airports to use. This is a separate tool from your flight search —
              perfect for deciding <strong>where</strong> to go before you book.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-slate-500 px-4 py-2 text-xs md:text-sm font-medium text-slate-100 hover:border-slate-300"
          >
            Reset compare results
          </button>
        </div>

        <form onSubmit={handleCompare} className="space-y-4">
          {/* Destinations row */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-200 mb-1">
              Destinations (comma-separated)
            </label>
            <input
              value={destinations}
              onChange={(e) => setDestinations(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm md:text-base text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Bali, Tokyo, Paris"
            />
          </div>

          {/* Month / days / home city */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-200 mb-1">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:text-base text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-200 mb-1">
                Days
              </label>
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 1)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:text-base text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-200 mb-1">
                Home city / airport
              </label>
              <input
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:text-base text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Austin, TX (AUS)"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 px-6 py-2.5 text-sm md:text-base font-semibold text-slate-50 shadow-lg shadow-sky-500/25 disabled:opacity-60"
            >
              {loading ? "Comparing..." : "Compare these places"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/70 bg-rose-950/40 px-4 py-3 text-xs md:text-sm text-rose-100">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 space-y-4">
            {results.map((r) => (
              <div
                key={r.name}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 md:px-5 md:py-4 text-sm md:text-base"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base md:text-lg font-semibold text-slate-50">
                      {r.name}
                    </div>
                    <div className="text-xs md:text-sm text-slate-400">
                      Approx. cost level: {r.approx_cost_level}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs md:text-sm text-slate-200">
                  <div className="mb-1">
                    <span className="font-semibold text-slate-100">
                      Weather &amp; vibe:{" "}
                    </span>
                    {r.weather_summary} {r.overall_vibe && `• ${r.overall_vibe}`}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold text-slate-100">
                      Best for:{" "}
                    </span>
                    {r.best_for}
                  </div>
                  {r.pros?.length > 0 && (
                    <div className="mb-1">
                      <span className="font-semibold text-emerald-300">
                        Pros:{" "}
                      </span>
                      <span>{r.pros.join(" • ")}</span>
                    </div>
                  )}
                  {r.cons?.length > 0 && (
                    <div>
                      <span className="font-semibold text-rose-300">
                        Cons:{" "}
                      </span>
                      <span>{r.cons.join(" • ")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Explore / Savor / Misc for last active city */}
            {activeCityForExplore && (
              <div className="mt-4">
                <ExploreSavorTabs city={activeCityForExplore} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AiDestinationCompare;
