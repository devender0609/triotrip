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

type HotelOption = {
  name: string;
  area?: string;
  approx_price_per_night?: number;
  currency?: string;
  vibe?: string;
  why?: string;
};

type PlanningPayload = {
  top3?: {
    best_overall?: Top3Item;
    best_budget?: Top3Item;
    best_comfort?: Top3Item;
  };
  itinerary?: any[];
  hotels?: HotelOption[];
};

type OptionsView = "top3" | "all";

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

// Build a simple Google Flights link using inferred search params
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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) {
    return null;
  }

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
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>🏆 Top 3 options</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map(({ key, label, value }) => (
            <article
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1 shadow-sm"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
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
    const nights =
      includeHotel && searchParams?.departDate && searchParams?.returnDate
        ? nightsBetween(searchParams.departDate, searchParams.returnDate)
        : 0;

    const visible = optionsView === "top3" ? results.slice(0, 3) : results;

    return (
      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span>✈ Flight options</span>
          </h3>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white text-[11px] overflow-hidden">
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              className={`px-3 py-1 font-semibold ${
                optionsView === "top3"
                  ? "bg-sky-500 text-white"
                  : "text-slate-700"
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
                  : "text-slate-700"
              }`}
            >
              All options
            </button>
          </div>
        </div>

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
                hotelNights={nights}
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

  const HotelSuggestions = ({ hotels }: { hotels?: HotelOption[] }) => {
    if (!hotels || !hotels.length) return null;

    return (
      <section className="mt-6 space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>🏨 Hotel suggestions (AI)</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {hotels.map((h, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1 shadow-sm"
            >
              <div className="text-[13px] font-semibold text-slate-900">
                {h.name}
              </div>
              {h.area && (
                <div className="text-slate-700">
                  <span className="font-semibold">Area: </span>
                  {h.area}
                </div>
              )}
              {(typeof h.approx_price_per_night === "number" || h.currency) && (
                <div className="text-slate-700">
                  <span className="font-semibold">Approx: </span>
                  {h.currency || "USD"}{" "}
                  {typeof h.approx_price_per_night === "number"
                    ? Math.round(h.approx_price_per_night)
                    : ""}{" "}
                  / night
                </div>
              )}
              {h.vibe && (
                <div className="text-slate-700">
                  <span className="font-semibold">Vibe: </span>
                  {h.vibe}
                </div>
              )}
              {h.why && (
                <p className="text-slate-700">
                  <span className="font-semibold">Why: </span>
                  {h.why}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const Itinerary = ({ itinerary }: { itinerary: any[] }) => {
    if (!itinerary || !itinerary.length) return null;

    return (
      <section className="mt-6 space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>📅 Suggested itinerary</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {itinerary.map((day, idx) => {
            const rawDay = day.day;
            const rawDate = day.date;

            let dayLabel = "";
            let dateLabel = "";

            if (typeof rawDay === "number") dayLabel = `Day ${rawDay}`;
            if (typeof rawDate === "string" && rawDate.trim()) {
              dateLabel = new Date(rawDate).toLocaleDateString();
            }

            if (!dayLabel) dayLabel = `Day ${idx + 1}`;
            const header = dateLabel ? `${dayLabel} — ${dateLabel}` : dayLabel;

            return (
              <article
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1 shadow-sm"
              >
                <h4 className="font-semibold text-[13px] flex items-center gap-1">
                  🗓 {header}
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  {(day.activities || []).map((act: string, i: number) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </article>
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
        setError("AI planner failed. Please try again or be more specific.");
        return;
      }

      setPlanning(data.planning || null);
      setResults(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
    } catch (err: any) {
      setError(err.message || "Something went wrong with AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-6 space-y-4">
      <h2 className="text-xl font-semibold">Plan my trip with AI ✈️</h2>
      <p className="text-sm text-slate-600">
        Describe your trip in one sentence. We&apos;ll infer dates, cities,
        cabin, and travellers, then show flights and hotel ideas in a clean,
        card-based layout.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days from Austin to Las Vegas in November, flight + nice hotel, budget-friendly but fun."
          rows={2}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Generate AI trip"}
        </button>
      </form>

      {error && <p className="text-sm text-rose-500">❌ {error}</p>}

      {planning && (
        <>
          <Top3Strip planning={planning} />
          <FlightOptions />
          <HotelSuggestions hotels={planning.hotels} />
          <Itinerary itinerary={planning.itinerary ?? []} />
        </>
      )}
    </section>
  );
}

// 👈 default export so `import AiTripPlanner from "../components/AiTripPlanner"` works
export default AiTripPlanner;
