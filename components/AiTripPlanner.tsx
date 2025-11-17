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

  const parts: string[] = [
    "Flights",
    "from",
    origin,
    "to",
    destination,
    "on",
    d1,
  ];
  if (d2) parts.push("through", d2);
  parts.push("for", `${pax}`, "travellers");

  const q = encodeURIComponent(parts.join(" "));
  return `https://www.google.com/travel/flights?q=${q}`;
}

function AiTripPlanner() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs: {
      key: keyof NonNullable<PlanningPayload["top3"]>;
      label: string;
      icon: string;
    }[] = [
      { key: "best_overall", label: "Best overall", icon: "🥇" },
      { key: "best_budget", label: "Best budget", icon: "💰" },
      { key: "best_comfort", label: "Most comfortable", icon: "🛏️" },
    ];

    const items = defs
      .map((def) => {
        const value = t[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { key: def.key, label: def.label, icon: def.icon, value };
      })
      .filter(Boolean) as {
      key: keyof NonNullable<PlanningPayload["top3"]>;
      label: string;
      icon: string;
      value: Top3Item;
    }[];

    if (!items.length) return null;

    return (
      <section className="mt-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span>Top 3 picks</span>
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ key, label, icon, value }) => (
            <article
              key={key}
              className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs space-y-1 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
              {value.title && (
                <div className="text-[13px] font-semibold text-slate-900">
                  {value.title}
                </div>
              )}
              {value.reason && (
                <p className="text-slate-600 leading-snug">{value.reason}</p>
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
      <section className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>Flight options</span>
          </h3>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 text-[11px] overflow-hidden">
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              className={`px-3 py-1 font-semibold ${
                optionsView === "top3"
                  ? "bg-sky-500 text-white"
                  : "text-slate-700"
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
                  : "text-slate-700"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* This is where AI results use the same elegant card UI as manual search */}
        <div className="grid gap-5">
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
      setMessage(null);
      setPlanning(null);
      setResults(null);
      setSearchParams(null);
      setOptionsView("top3");

      const data: any = await aiPlanTrip(prompt);

      if (!data) {
        setMessage("We couldn’t plan this trip. Please try again.");
        return;
      }

      if (!data.ok) {
        const raw = (data.error || "").toString().toLowerCase();
        if (raw.includes("amadeus") || raw.includes("400")) {
          setMessage(
            "Live flight prices may be limited in test mode. You can still use Manual Search for full prices."
          );
        } else {
          setMessage(
            "We couldn’t plan this trip. Please try again with a bit more detail."
          );
        }
      } else {
        setMessage(null);
      }

      setPlanning(data.planning || null);
      setResults(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
    } catch (err: any) {
      console.error("AI trip error:", err);
      setMessage(
        "We couldn’t plan this trip right now. Please try again or use Manual Search."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!AI_ENABLED) return null;

  return (
    <section className="mt-4">
      <div className="rounded-2xl bg-white border border-slate-200 px-4 py-5 sm:px-6 sm:py-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
            <span>Plan my trip with AI</span>
            <span>✨</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Describe your trip in one sentence. We&apos;ll infer cities, dates,
            cabin, and travellers, then show real flight options using the same
            card layout as your manual search.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Example: "Austin to Las Vegas, flights Jan 10–15 2026, 2 adults, nice hotel on the Strip."'
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            {loading ? "Planning your trip…" : "Generate AI trip"}
          </button>
        </form>

        {message && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 flex gap-2">
            <span>⚠️</span>
            <span>{message}</span>
          </div>
        )}

        {planning && <Top3Strip planning={planning} />}
        {results && <FlightOptions />}

        {!planning && !results && !message && (
          <p className="text-[11px] text-slate-500">
            Tip: Include dates and whether you want hotel. Example: &quot;2
            adults, Austin to Boston, long weekend in November, flights + 2
            nights hotel downtown.&quot;
          </p>
        )}
      </div>
    </section>
  );
}

export { AiTripPlanner };
export default AiTripPlanner;
