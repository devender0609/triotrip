"use client";

import React, { useState, FormEvent } from "react";

type Props = {
  currency: string;
};

type SimpleComparison = {
  name: string;
  approxCost: string;
  bestFor: string;
  pros: string;
  cons: string;
};

export default function AiDestinationCompare({ currency }: Props) {
  const [destinations, setDestinations] = useState("Bali, Thailand, Hawaii");
  const [month, setMonth] = useState("December");
  const [days, setDays] = useState("7");
  const [home, setHome] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SimpleComparison[] | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parts = destinations
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      if (!parts.length) {
        setError("Please enter at least one destination.");
        setResults(null);
        setLoading(false);
        return;
      }

      // simple, fake comparison so the layout looks good
      const generated: SimpleComparison[] = parts.map((name, idx) => {
        const level = idx % 3;

        const approxCost =
          level === 0
            ? `${currency} $ – budget`
            : level === 1
            ? `${currency} $$ – mid-range`
            : `${currency} $$$ – higher end`;

        const bestFor =
          level === 0
            ? "Budget-friendly adventures and local culture."
            : level === 1
            ? "Balanced comfort, food and sightseeing."
            : "Upscale stays, fine dining and relaxed exploring.";

        const pros =
          level === 0
            ? "Great value, street food, markets, and local experiences."
            : level === 1
            ? "Nice mix of attractions, dining, and walkable areas."
            : "Stylish hotels, great restaurants, and scenic views.";

        const cons =
          level === 0
            ? "Can be crowded or noisy in peak areas."
            : level === 1
            ? "Popular neighborhoods may get busy in high season."
            : "Higher prices, especially in central locations.";

        return { name, approxCost, bestFor, pros, cons };
      });

      setResults(generated);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while comparing these places.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <section className="mt-10">
      {/* OUTER CARD – matches “Plan my trip with AI” */}
      <div className="rounded-3xl bg-slate-950 text-slate-50 px-4 py-5 sm:px-6 sm:py-6 shadow-xl border border-slate-800">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Compare destinations with AI
            </h2>
            <span className="text-2xl" aria-hidden="true">
              🌍
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="hidden sm:inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Reset compare results
          </button>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-200 mb-6 max-w-3xl leading-relaxed">
          Drop in a few places and we’ll compare them for cost, weather, food,
          hotels, nightlife, family-friendliness, safety, and the best airports
          to use. This is a separate tool from your flight search — perfect for
          deciding <span className="font-semibold text-sky-300">where</span> to
          go before you book.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destinations input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-100">
              Destinations (comma-separated)
            </label>
            <input
              type="text"
              value={destinations}
              onChange={(e) => setDestinations(e.target.value)}
              placeholder="Bali, Thailand, Hawaii"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm sm:text-base text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Month / Days / Home city */}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.6fr)_minmax(0,1.3fr)]">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-100">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm sm:text-base text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-100">
                Days
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm sm:text-base text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-100">
                Home city / airport
              </label>
              <input
                type="text"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="Austin, TX"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm sm:text-base text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-fuchsia-500 to-pink-500 px-6 py-2.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-fuchsia-500/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-wait transition-all"
            >
              {loading ? "Comparing..." : "Compare these places"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="sm:hidden inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Reset compare results
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/60 bg-red-950/60 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* RESULTS */}
        {results && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {results.map((r) => (
              <div
                key={r.name}
                className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-50">
                    {r.name}
                  </h3>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100">
                    {r.approxCost}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-sky-200 font-medium">
                  {r.bestFor}
                </p>
                <div className="mt-2 space-y-1 text-xs sm:text-sm leading-relaxed">
                  <p>
                    <span className="font-semibold text-emerald-300">
                      Pros:
                    </span>{" "}
                    {r.pros}
                  </p>
                  <p>
                    <span className="font-semibold text-rose-300">
                      Cons:
                    </span>{" "}
                    {r.cons}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
