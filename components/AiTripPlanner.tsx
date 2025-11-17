"use client";

import { useState } from "react";
import { aiPlanTrip } from "@/lib/api";
import ResultCard from "./ResultCard";

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

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

// Build a simple Google Flights link using search parameters + passengers
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

  const qParts = ["Flights", "from", origin, "to", destination, "on", d1];
  if (d2) qParts.push("through", d2);
  qParts.push("for", `${pax}`, "travellers");

  const q = encodeURIComponent(qParts.join(" "));
  return `https://www.google.com/travel/flights?q=${q}`;
}

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [packages, setPackages] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<"top3" | "all">("top3");

  if (!AI_ENABLED) {
    return (
      <section className="mt-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 text-slate-100">
        <h2 className="text-lg font-semibold">AI trip planner unavailable</h2>
        <p className="text-sm text-slate-300">
          You can still use the manual search form to find flights and hotels.
        </p>
      </section>
    );
  }

  // ---------- Top 3 (compact) ----------
  const Top3 = ({ planning }: { planning: PlanningPayload }) => {
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

    if (items.length === 0) return null;

    return (
      <section className="space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>🏆 Top 3 options</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map(({ key, label, value }) => (
            <article
              key={key}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1"
            >
              <div className="font-semibold text-slate-100 text-[11px] uppercase tracking-wide">
                {label}
              </div>
              {value.title && (
                <div className="font-semibold text-[13px]">{value.title}</div>
              )}
              {value.reason && (
                <p className="text-slate-400 leading-snug">{value.reason}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  };

  // ---------- Flight options (use same ResultCard as manual) ----------
  const FlightOptions = () => {
    if (!packages || packages.length === 0) return null;

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

    const visiblePkgs =
      optionsView === "top3" ? packages.slice(0, 3) : packages;

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span>✈ Flight options</span>
          </h3>
          <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950/80 text-[11px]">
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              className={`px-3 py-1 rounded-full font-semibold ${
                optionsView === "top3"
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-200"
              }`}
            >
              Top 3 options
            </button>
            <button
              type="button"
              onClick={() => setOptionsView("all")}
              className={`px-3 py-1 rounded-full font-semibold ${
                optionsView === "all"
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-200"
              }`}
            >
              All options
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {visiblePkgs.map((pkg, i) => {
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
                showAllHotels={false}
                comparedIds={[]}
                onToggleCompare={() => {}}
                onSavedChangeGlobal={() => {}}
                hideActions={true} // no Save/Compare buttons in AI section
                bookUrl={bookUrl}
              />
            );
          })}
        </div>
      </section>
    );
  };

  // ---------- Hotel suggestions (AI text, but styled like cards) ----------
  const HotelOptions = ({ hotels }: { hotels?: HotelOption[] }) => {
    if (!hotels || hotels.length === 0) return null;
    return (
      <section className="space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>🏨 Hotel suggestions (AI)</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {hotels.map((h, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1"
            >
              <div className="font-semibold text-[13px]">{h.name}</div>
              {h.area && (
                <div className="text-slate-300">
                  <span className="font-semibold">Area: </span>
                  {h.area}
                </div>
              )}
              {(typeof h.approx_price_per_night === "number" ||
                h.currency) && (
                <div className="text-slate-300">
                  <span className="font-semibold">Approx: </span>
                  {h.currency || "USD"}{" "}
                  {typeof h.approx_price_per_night === "number"
                    ? Math.round(h.approx_price_per_night)
                    : ""}{" "}
                  / night
                </div>
              )}
              {h.vibe && (
                <div>
                  <span className="font-semibold">Vibe: </span>
                  {h.vibe}
                </div>
              )}
              {h.why && (
                <p className="text-slate-400 leading-snug">
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

  // ---------- Itinerary ----------
  const Itinerary = ({ itinerary }: { itinerary: any[] }) => {
    if (!itinerary || itinerary.length === 0) return null;

    return (
      <section className="space-y-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span>📅 Suggested itinerary</span>
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {itinerary.map((day, idx) => {
            const rawDay = day.day;
            const rawDate = day.date;

            let dayLabel = "";
            let dateLabel = "";

            if (typeof rawDay === "number") {
              dayLabel = `Day ${rawDay}`;
            } else if (
              typeof rawDay === "string" &&
              /^\d{4}-\d{2}-\d{2}/.test(rawDay)
            ) {
              dateLabel = new Date(rawDay).toLocaleDateString();
            }

            if (typeof rawDate === "string" && rawDate.trim()) {
              dateLabel = new Date(rawDate).toLocaleDateString();
            }

            if (!dayLabel) dayLabel = `Day ${idx + 1}`;
            const header = dateLabel ? `${dayLabel} — ${dateLabel}` : dayLabel;

            return (
              <article
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1"
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

  // ---------- Submit ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setPlanning(null);
      setPackages(null);
      setSearchParams(null);
      setOptionsView("top3");

      const data: any = await aiPlanTrip(query);

      if (!data?.ok) {
        setError("AI planner failed. Please try again or be more specific.");
        return;
      }

      setPlanning(data.planning || null);
      setPackages(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
    } catch (err: any) {
      setError(err.message || "Something went wrong with AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 text-slate-50 space-y-4">
      <h2 className="text-xl font-semibold">Plan my trip with AI ✈️</h2>
      <p className="text-sm text-slate-300">
        Describe your trip in one sentence. We&apos;ll interpret it and show
        you a clean set of flight options and hotel ideas, using the same layout
        as the manual search.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days from New Delhi to Mumbai, Jan 2–6 2026, budget-friendly, hotels, entertainment."
          rows={3}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-slate-50 shadow-md disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Generate AI trip"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-rose-300">❌ {error}</p>
      )}

      {planning && (
        <div className="space-y-6 pt-2">
          <Top3 planning={planning} />
          <FlightOptions />
          <HotelOptions hotels={planning.hotels} />
          <Itinerary itinerary={planning.itinerary ?? []} />
        </div>
      )}
    </section>
  );
}
