"use client";

import { useState } from "react";
import ResultCard from "./ResultCard";
import { aiPlanTrip } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type Top3Item = {
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

/**
 * Build a Google Flights URL that is pre-filled with the AI-inferred search.
 * This doesn’t have to be perfect, just useful for the user.
 */
function buildGoogleFlightsUrl(pkg: any, searchParams: any | null): string | undefined {
  if (!searchParams) return undefined;

  const origin = searchParams.origin;
  const destination = searchParams.destination;
  const departDate = searchParams.departDate;
  const returnDate = searchParams.returnDate;

  if (!origin || !destination || !departDate) return undefined;

  const d1 = departDate;
  const d2 = returnDate || "";
  const pax =
    (searchParams.passengersAdults || 1) +
    (searchParams.passengersChildren || 0) +
    (searchParams.passengersInfants || 0);

  const parts = ["Flights", "from", origin, "to", destination, "on", d1];
  if (d2) parts.push("through", d2);
  parts.push("for", `${pax}`, "travellers");

  const q = encodeURIComponent(parts.join(" "));
  return `https://www.google.com/travel/flights?q=${q}`;
}

function AiTripPlannerInner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs: { key: keyof NonNullable<PlanningPayload["top3"]>; label: string }[] =
      [
        { key: "best_overall", label: "Best overall" },
        { key: "best_budget", label: "Best budget" },
        { key: "best_comfort", label: "Most comfortable" },
      ];

    const items = defs
      .map((def) => {
        const value = t[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { key: def.key, label: def.label, value };
      })
      .filter(Boolean) as {
      key: keyof NonNullable<PlanningPayload["top3"]>;
      label: string;
      value: Top3Item;
    }[];

    if (!items.length) return null;

    return (
      <section className="mt-4 space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2 text-slate-100">
          <span>🏆 Top 3 options</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map(({ key, label, value }) => (
            <article
              key={key}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs space-y-1 shadow-sm"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </div>
              {value.title && (
                <div className="text-[13px] font-semibold text-slate-50">
                  {value.title}
                </div>
              )}
              {value.reason && (
                <p className="text-slate-300 leading-snug">{value.reason}</p>
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
    const pax =
      (searchParams?.passengersAdults || 1) +
      (searchParams?.passengersChildren || 0) +
      (searchParams?.passengersInfants || 0);
    const includeHotel = !!searchParams?.includeHotel;

    const visible = optionsView === "top3" ? results.slice(0, 3) : results;

    return (
      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold flex items-center gap-2 text-slate-100">
            <span>✈ Real flight options</span>
            <span className="text-xs text-slate-400">
              (same prices as Manual Search)
            </span>
          </h3>
          <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 text-[11px] overflow-hidden">
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              className={`px-3 py-1 font-semibold ${
                optionsView === "top3"
                  ? "bg-sky-500 text-white"
                  : "text-slate-300"
              }`}
            >
              Top 3 options
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

        {/* Use the SAME elegant ResultCard layout as manual search */}
        <div className="grid gap-3">
          {visible.map((pkg, i) => {
            const bookUrl = buildGoogleFlightsUrl(pkg, searchParams);
            return (
              <ResultCard
                key={pkg.id || `ai-${i}`}
                pkg={pkg}
                index={i}
                currency={currency}
                pax={pax}
                showHotel={includeHotel}
                hotelNights={pkg.hotelNights ?? 0}
                showAllHotels={optionsView === "all"}
                comparedIds={[]}
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
    try {
      setLoading(true);
      setError(null);
      setPlanning(null);
      setResults(null);
      setSearchParams(null);
      setOptionsView("top3");

      const data: any = await aiPlanTrip(query);

      if (!data?.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : "AI planner failed.";
        // Friendlier message for Amadeus issues
        if (msg.toLowerCase().includes("amadeus")) {
          setError(
            "We couldn’t fetch live flight prices from our provider right now. Please try different dates or use Manual Search for this trip."
          );
        } else {
          setError(msg || "AI planner failed. Please try again or be more specific.");
        }
        return;
      }

      setPlanning(data.planning || null);
      setResults(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
    } catch (err: any) {
      setError(err?.message || "Something went wrong with AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-6 space-y-4 text-slate-100">
      <h2 className="text-xl font-semibold">Plan my trip with AI ✈️</h2>
      <p className="text-sm text-slate-300">
        Tell us your trip idea in one sentence. We&apos;ll interpret it,
        generate an itinerary, and show real flight options in the same clean
        card layout as your manual search.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: Austin to Boston, flight + hotel, Dec 1–6, 2025, nice hotel."
          rows={2}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Generate AI Trip"}
        </button>
      </form>

      {error && <p className="text-sm text-rose-400">❌ {error}</p>}

      {planning && <Top3Strip planning={planning} />}
      {results && <FlightOptions />}
    </section>
  );
}

export function AiTripPlanner() {
  return <AiTripPlannerInner />;
}

// Default export so `import AiTripPlanner from "./components/AiTripPlanner"` also works
export default AiTripPlannerInner;
