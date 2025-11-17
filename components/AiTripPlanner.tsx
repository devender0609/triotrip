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

// Small helper to build a Google Flights deeplink
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

export function AiTripPlanner() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);

  const [warning, setWarning] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs: { key: keyof NonNullable<PlanningPayload["top3"]>; label: string; icon: string }[] =
      [
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
      <section className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <span>🏆 Top 3 picks</span>
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ key, label, icon, value }) => (
            <article
              key={key}
              className="rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-xs space-y-1 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span>{icon}</span>
                <span>{label}</span>
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
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>✈ Flight options</span>
            <span className="text-xs text-slate-400">
              (same layout as Manual Search)
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
              All
            </button>
          </div>
        </div>

        {/* 🔥 THIS is where AI flights use the SAME ResultCard as manual */}
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
                comparedIds={[]}          // no compare tray in AI view
                onToggleCompare={() => {}} // disabled
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

      const data: any = await aiPlanTrip(prompt);

      if (!data) {
        setWarning("We couldn’t plan this trip. Please try again.");
        return;
      }

      if (!data.ok) {
        const msg = (data.error || "").toString().toLowerCase();
        if (msg.includes("amadeus") || msg.includes("400")) {
          setWarning(
            "Live flight prices are limited in test mode. You can still use Manual Search for real prices."
          );
        } else {
          setWarning(
            "We couldn’t plan this trip. Please try again with a bit more detail."
          );
        }
      }

      setPlanning(data.planning || null);
      setResults(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
    } catch (err: any) {
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
      {/* Main AI card – dark, clean, no messy text sections */}
      <div className="rounded-3xl bg-slate-950 text-slate-50 px-5 py-6 shadow-lg space-y-5 border border-slate-800">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <span>Plan my trip with AI</span>
            <span>✨</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Type one sentence about your trip. We&apos;ll infer cities, dates,
            cabin, and travellers, then show flight options in the same card
            layout as your manual search.
          </p>
        </div>

        {/* Prompt input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Example: "Austin to Las Vegas, flights Jan 10–15 2026, fun hotel on the Strip."'
            rows={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          >
            {loading ? "Planning your trip…" : "Generate AI trip"}
          </button>
        </form>

        {/* Soft warning (no ugly raw error text) */}
        {warning && (
          <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex gap-2">
            <span>⚠️</span>
            <span>{warning}</span>
          </div>
        )}

        {/* Compact Top-3 and clean ResultCard flight layout */}
        {planning && <Top3Strip planning={planning} />}
        {results && <FlightOptions />}

        {!planning && !results && !warning && (
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

export default AiTripPlanner;
