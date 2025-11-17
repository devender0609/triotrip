"use client";

import { useState } from "react";
import ResultCard from "./ResultCard";
import { aiPlanTrip } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type Top3Item = {
  id?: string | number;
  title?: string;
  reason?: string;
};

type PlanningPayload = {
  top3?: {
    best_overall?: Top3Item;
    best_budget?: Top3Item;
    best_comfort?: Top3Item;
  };
};

type OptionsView = "top3" | "all";

type AiTripPlannerProps = {};

export function AiTripPlanner(_props: AiTripPlannerProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  // ---- helpers ----

  const totalPax =
    (searchParams?.passengersAdults || 1) +
    (searchParams?.passengersChildren || 0) +
    (searchParams?.passengersInfants || 0);

  const Top3Strip = () => {
    if (!planning?.top3 || !results || !results.length) return null;

    const defs = [
      { key: "best_overall" as const, label: "Best overall", icon: "🥇" },
      { key: "best_budget" as const, label: "Best budget", icon: "💰" },
      { key: "best_comfort" as const, label: "Most comfortable", icon: "🛏️" },
    ];

    const items = defs
      .map((def) => {
        const value = planning.top3?.[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { ...def, value };
      })
      .filter(Boolean) as {
      key: keyof NonNullable<PlanningPayload["top3"]>;
      label: string;
      icon: string;
      value: Top3Item;
    }[];

    if (!items.length) return null;

    return (
      <section className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span>🏆 Top 3 options</span>
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ key, label, icon, value }) => (
            <article
              key={key}
              className="rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-xs shadow-sm"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
              {value.title && (
                <div className="text-[13px] font-semibold text-slate-50 mt-1">
                  {value.title}
                </div>
              )}
              {value.reason && (
                <p className="text-slate-300 leading-snug mt-1">
                  {value.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const FlightOptions = () => {
    if (!results || !results.length) return null;

    const currency = searchParams?.currency || "USD";
    const includeHotel = !!searchParams?.includeHotel;

    const visible = optionsView === "top3" ? results.slice(0, 3) : results;

    return (
      <section className="mt-8 space-y-4">
        {/* header bar with toggle */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>✈ Real flight options (same as manual search)</span>
          </h3>
          <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 text-[11px] overflow-hidden self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              className={`px-3 py-1 font-semibold ${
                optionsView === "top3"
                  ? "bg-sky-500 text-white"
                  : "text-slate-300"
              }`}
            >
              Top 3
            </button>
            <button
              type="button"
              onClick={() => setOptionsView("all")}
              className={`px-3 py-1 font-semibold ${
                optionsView === "all"
                  ? "bg-sky-500 text-white"
                  : "text-slate-300"
              }`}
            >
              All options
            </button>
          </div>
        </div>

        {/* BOXES – this is exactly the same card component as manual search */}
        <div className="grid gap-4">
          {visible.map((pkg, i) => {
            // simple Google Flights deeplink (placeholder)
            const bookUrl = undefined;

            return (
              <ResultCard
                key={pkg.id || i}
                pkg={pkg}
                index={i}
                currency={currency}
                pax={totalPax}
                showHotel={includeHotel}
                hotelNights={pkg.hotelNights ?? 0}
                showAllHotels={optionsView === "all"}
                comparedIds={[]} // compare comes from manual panel only
                onToggleCompare={() => {}}
                onSavedChangeGlobal={() => {}}
                bookUrl={bookUrl}
              />
            );
          })}
        </div>
      </section>
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setPlanning(null);
      setResults(null);
      setSearchParams(null);
      setOptionsView("top3");

      const data = await aiPlanTrip(prompt);

      if (!data?.ok) {
        const msg = (data as any)?.error?.toString() || "";
        if (msg.toLowerCase().includes("amadeus") || msg.includes("400")) {
          setError(
            "We couldn’t fetch live flight prices from our provider right now. Please try different dates or use Manual Search for this trip."
          );
        } else {
          setError("We couldn’t plan this trip. Please try again.");
        }
        return;
      }

      setPlanning((data as any).planning || null);
      setResults((data as any).searchResult?.results || null);
      setSearchParams((data as any).payload?.search || null);

      if (!(data as any).searchResult?.results?.length) {
        setError("AI planned your trip but no flights were returned.");
      }
    } catch (err: any) {
      console.error("AI trip error:", err);
      setError(
        "We couldn’t plan this trip right now. Please try again or use Manual Search."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-2 space-y-4 text-slate-50 bg-slate-950 px-4 py-4 rounded-2xl border border-slate-800">
      {/* header */}
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <span>Plan my trip with AI</span>
          <span>✈️</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
          Tell us your trip idea in one sentence. We&apos;ll interpret it,
          generate an itinerary, and show flight options using the same card
          layout as your manual search.
        </p>
      </div>

      {/* prompt */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder='Example: "Austin to New Delhi, budget-friendly flight and hotel, Nov 18–Dec 3 2025, hotel for 2 nights."'
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          {loading ? "Planning your trip…" : "Generate AI Trip"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* results */}
      {planning && <Top3Strip />}
      {results && <FlightOptions />}

      {!planning && !results && !error && (
        <p className="text-[11px] text-slate-500">
          Tip: include dates and whether you want hotel. Example: &quot;Austin
          to Boston, 2 adults, Thanksgiving week, want flights and 3 nights
          downtown.&quot;
        </p>
      )}
    </section>
  );
}

// so both `import AiTripPlanner` and `import { AiTripPlanner }` work
export default AiTripPlanner;
