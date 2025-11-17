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
  itinerary?: any[];
  hotels?: any[]; // AI hotel suggestions (structured)
};

type OptionsView = "top3" | "all";

/** Build a prefilled Google Flights link (nice “Book on Google Flights” button) */
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

function AiTripPlannerInner() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  /*********************
   *  TOP 3 OPTIONS BOX
   *********************/
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
      <section className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
          <span>🏆 Top 3 Options</span>
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

  /*********************
   *  FLIGHT RESULT BOX
   *********************/
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
        {/* Flight section header in its own box */}
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

        {/* Each flight option is the same white card as manual search */}
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

  /*********************
   *  HOTEL RESULT BOX
   *********************/
  const HotelSection = () => {
    const hotels = Array.isArray(planning?.hotels)
      ? planning!.hotels
      : [];

    if (!hotels.length) return null;

    return (
      <section className="mt-8 space-y-3">
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <span>🏨 Hotel suggestions (AI)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            These are AI-picked hotel ideas based on your budget and vibe. Check
            prices on your favorite booking site.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {hotels.map((h, i) => {
            const name = h.name || h.title || h.hotel || `Option ${i + 1}`;
            const area = h.area || h.location || h.neighborhood || "";
            const approx =
              h.approx || h.price || h.priceText || h.approxPrice || "";
            const vibe =
              h.vibe || h.description || h.notes || h.summary || "";

            return (
              <article
                key={i}
                className="rounded-2xl bg-gradient-to-br from-sky-900/80 via-indigo-900/80 to-slate-900/90 border border-sky-500/40 px-4 py-3 text-xs shadow-sm flex flex-col gap-1"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                  Hotel option {i + 1}
                </div>
                <div className="text-[13px] font-semibold text-slate-50">
                  {name}
                </div>
                {area && (
                  <div className="text-slate-200">
                    <span className="font-semibold">Area:</span> {area}
                  </div>
                )}
                {approx && (
                  <div className="text-slate-200">
                    <span className="font-semibold">Approx:</span> {approx}
                  </div>
                )}
                {vibe && (
                  <div className="text-slate-200">
                    <span className="font-semibold">Vibe:</span> {vibe}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*********************
   *  ITINERARY BOX
   *********************/
  const ItinerarySection = () => {
    const days = Array.isArray(planning?.itinerary)
      ? planning!.itinerary
      : [];

    if (!days.length) return null;

    return (
      <section className="mt-10 space-y-3">
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <span>📅 Suggested Itinerary</span>
          </h3>
        </div>
        <div className="space-y-3">
          {days.map((day: any, idx: number) => {
            const title =
              day.title ||
              day.dayLabel ||
              `Day ${idx + 1}${day.date ? ` — ${day.date}` : ""}`;
            const activities: string[] =
              day.activities || day.items || day.plans || [];

            return (
              <article
                key={idx}
                className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs space-y-1 shadow-sm"
              >
                <div className="font-semibold text-slate-50 text-[13px]">
                  {title}
                </div>
                {activities.length > 0 && (
                  <ul className="list-disc ml-4 mt-1 space-y-1 text-slate-300">
                    {activities.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*********************
   *  SUBMIT HANDLER
   *********************/
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
            "We couldn’t fetch live flight prices from our provider right now. Please try different dates or use Manual Search for this trip."
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
      setResults(data.searchResult?.results || null); // same data as manual search
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

  /*********************
   *  RENDER
   *********************/
  return (
    <section className="mt-6">
      <div className="space-y-4 text-slate-50">
        {/* HEADER – this should match exactly the screenshot you just sent */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <span>Plan my trip with AI</span>
            <span>✈️</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Tell us your trip idea in one sentence. We&apos;ll interpret it,
            generate an itinerary, and show real flight options using the same
            data as your manual search.
          </p>
        </div>

        {/* PROMPT + BUTTON */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Example: "Austin to New Delhi, budget friendly flight and hotel, Nov 18–Dec 3 2025, hotel for 2 nights."'
            rows={2}
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

        {/* MESSAGE (IF ANY) */}
        {message && (
          <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex gap-2">
            <span>⚠️</span>
            <span>{message}</span>
          </div>
        )}

        {/* RESULT BOXES */}
        {planning && <Top3Strip planning={planning} />}
        {results && <FlightOptions />}
        {planning && <HotelSection />}
        {planning && <ItinerarySection />}

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

export function AiTripPlanner() {
  return <AiTripPlannerInner />;
}

export default AiTripPlannerInner;
