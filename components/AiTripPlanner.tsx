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

function buildGoogleFlightsUrl(
  pkg: any,
  searchParams: any | null
): string | undefined {
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

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);

  // soft message when Amadeus / backend is in test mode or fails
  const [warning, setWarning] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs: { key: keyof PlanningPayload["top3"]; label: string }[] = [
      { key: "best_overall", label: "Best overall" },
      { key: "best_budget", label: "Best budget" },
      { key: "best_comfort", label: "Most comfortable" },
    ];

    const items = defs
      .map((def) => {
        const value = t[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { ...def, value };
      })
      .filter(Boolean) as { key: any; label: string; value: Top3Item }[];

    if (!items.length) return null;

    return (
      <section className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <span>🏆 Top 3 options</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map(({ key, label, value }) => (
            <article
              key={key}
              className="rounded-xl bg-slate-800/70 border border-slate-700 p-3 text-xs space-y-1 shadow-sm"
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
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <span>✈ Flight options</span>
          </h3>
          <div className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900 text-[11px] overflow-hidden">
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              className={`px-3 py-1 font-semibold ${
                optionsView === "top3"
                  ? "bg-sky-500 text-white"
                  : "text-slate-200"
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
                  : "text-slate-200"
              }`}
            >
              All options
            </button>
          </div>
        </div>

        {/* Result cards: exactly the same style as Manual Search */}
        <div className="grid gap-3">
          {visible.map((pkg, i) => {
            const bookUrl = buildGoogleFlightsUrl(pkg, searchParams);
            return (
              <ResultCard
                key={pkg.id || i}
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
      setWarning(null);
      setPlanning(null);
      setResults(null);
      setSearchParams(null);
      setOptionsView("top3");

      const data: any = await aiPlanTrip(query);

      if (!data) {
        setWarning(
          "We couldn’t plan this trip. Please try again with a bit more detail."
        );
        return;
      }

      setPlanning(data.planning || null);
      setResults(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);

      if (!data.ok) {
        // Test-mode / Amadeus issues -> soft message only
        setWarning(
          "Live flight prices are not available in this test mode. You can still use Manual Search for real prices."
        );
      } else {
        setWarning(null);
      }
    } catch (err) {
      console.error("AI trip error:", err);
      setWarning(
        "We couldn’t plan this trip right now. Please try again or use Manual Search."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6">
      {/* Dark, elegant card – visually matches your Compare AI card */}
      <div className="rounded-3xl bg-slate-900 text-slate-50 px-5 py-6 shadow-lg space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>Plan my trip with AI</span>
            <span>✈️</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Type one sentence about your trip. We&apos;ll infer dates, cities,
            cabin, and travellers and then show flights in the same card layout
            as your manual search.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Example: "Austin to Boston, flights Nov 20–22, nice hotel near downtown."'
            rows={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            {loading ? "Planning your trip…" : "Generate AI trip"}
          </button>
        </form>

        {warning && (
          <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex gap-2">
            <span>⚠️</span>
            <span>{warning}</span>
          </div>
        )}

        {planning && <Top3Strip planning={planning} />}
        {results && <FlightOptions />}

        {!results && !planning && !warning && (
          <p className="text-[11px] text-slate-400">
            Tip: For now, AI planning works best for simple round-trip ideas.
            Use Manual Search if you need full control over times and airlines.
          </p>
        )}
      </div>
    </section>
  );
}

export default AiTripPlanner;
