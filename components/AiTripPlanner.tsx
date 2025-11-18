"use client";

import { useState } from "react";
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
  hotels?: any[];
  itinerary?: any[];
};

type AiTripPlannerProps = {
  onSearchComplete?: (payload: {
    searchParams: any;
    searchResult: any;
    planning: PlanningPayload | null;
  }) => void;
};

function AiTripPlanner({ onSearchComplete }: AiTripPlannerProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!AI_ENABLED) return null;

  /*************** TOP 3 STRIP (CARDS) ***************/
  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs = [
      { key: "best_overall" as const, label: "Best overall", icon: "🥇" },
      { key: "best_budget" as const, label: "Best budget", icon: "💰" },
      { key: "best_comfort" as const, label: "Best comfort", icon: "🛋️" },
    ];

    return (
      <section className="mt-6 space-y-3">
        <div className="rounded-2xl bg-slate-900/90 border border-sky-500/40 px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <span>🔝 AI’s top picks</span>
          </h3>
          <p className="text-[11px] text-slate-300 mt-1">
            These are the trips the AI thinks fit your request best. You’ll see
            the full list of live options below in the results section.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {defs.map(({ key, label, icon }) => {
            const value = (t as any)?.[key] as Top3Item | undefined;
            if (!value) return null;
            return (
              <article
                key={key}
                className="rounded-2xl bg-gradient-to-br from-sky-900/70 via-slate-900 to-slate-950 border border-sky-500/40 px-4 py-3 text-xs space-y-1 shadow-sm"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
                {value.title && (
                  <div className="text-[13px] font-semibold text-slate-50">
                    {value.title}
                  </div>
                )}
                {value.reason && (
                  <p className="text-slate-200 leading-snug">{value.reason}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*************** HOTEL SUGGESTIONS (CARDS) ***************/
  const HotelSection = () => {
    const hotels = Array.isArray(planning?.hotels) ? planning!.hotels : [];
    if (!hotels.length) return null;

    return (
      <section className="mt-8 space-y-3">
        <div className="rounded-2xl bg-slate-900/90 border border-sky-500/40 px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <span>🏨 Hotel suggestions (AI)</span>
          </h3>
          <p className="text-[11px] text-slate-300 mt-1">
            AI-picked hotel ideas based on your budget and vibe. Check prices on
            your favorite booking site.
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
                className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-4 text-xs shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                    Hotel option {i + 1}
                  </div>
                  {h.tag && (
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-[10px] uppercase tracking-wide text-sky-200">
                      {h.tag}
                    </span>
                  )}
                </div>
                <div className="text-[13px] font-semibold text-slate-50">
                  {name}
                </div>
                {area && (
                  <div className="text-slate-300 flex items-center gap-1">
                    <span>📍</span>
                    <span>{area}</span>
                  </div>
                )}
                {approx && (
                  <div className="text-slate-200">
                    <span className="font-semibold">Approx:</span> {approx}
                  </div>
                )}
                {vibe && (
                  <p className="text-slate-200 leading-snug">{vibe}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*************** ITINERARY (DAY CARDS) ***************/
  const ItinerarySection = () => {
    const days = Array.isArray(planning?.itinerary)
      ? planning!.itinerary
      : [];

    if (!days.length) return null;

    return (
      <section className="mt-10 space-y-3">
        <div className="rounded-2xl bg-slate-900/90 border border-sky-500/40 px-4 py-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
            <span>📅 Suggested Itinerary</span>
          </h3>
          <p className="text-[11px] text-slate-300 mt-1">
            Use this as a starting point – you can adjust days or swap
            activities once you pick final flights and hotel.
          </p>
        </div>

        <div className="grid gap-3">
          {days.map((day: any, i: number) => {
            const title = day.title || `Day ${i + 1}`;
            const summary = day.summary || day.overview || "";
            const bullets =
              Array.isArray(day.items) && day.items.length
                ? day.items
                : Array.isArray(day.activities)
                ? day.activities
                : [];

            return (
              <article
                key={i}
                className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-4 text-xs shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-semibold text-slate-100">
                    {title}
                  </div>
                  {day.label && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] uppercase tracking-wide text-emerald-200">
                      {day.label}
                    </span>
                  )}
                </div>

                {summary && (
                  <p className="text-slate-300 leading-snug">{summary}</p>
                )}

                {bullets.length > 0 && (
                  <ul className="mt-1 space-y-1.5 text-slate-200">
                    {bullets.map((b: any, idx: number) => {
                      if (typeof b === "string") {
                        return (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-[11px]"
                          >
                            <span className="mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        );
                      }
                      const time = b.time || b.when;
                      const text = b.text || b.title || b.activity || "";
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-[11px]"
                        >
                          <span className="mt-0.5">
                            {time ? "⏰" : "•"}
                          </span>
                          <span>
                            {time && (
                              <span className="font-semibold">
                                {time}:{" "}
                              </span>
                            )}
                            {text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*************** SUBMIT HANDLER ***************/
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      setPlanning(null);

      const data: any = await aiPlanTrip(prompt);

      if (!data) {
        setMessage("We couldn’t plan this trip. Please try again.");
        return;
      }

      const planningPayload: PlanningPayload | null = data.planning || null;
      setPlanning(planningPayload);

      if (!data.ok) {
        const raw = (data.error || "").toString().toLowerCase();
        if (raw.includes("amadeus") || raw.includes("400")) {
          setMessage(
            "We couldn’t fetch live flight prices from our provider. Please try different dates or use Manual Search."
          );
        } else {
          setMessage(
            "We couldn’t plan this trip right now. Please try again or use Manual Search."
          );
        }
      } else {
        setMessage(null);
      }

      // send structured info back to main page so it can show real flight/hotel boxes
      if (onSearchComplete) {
        onSearchComplete({
          searchParams: data.searchParams || null,
          searchResult: data.searchResult || null,
          planning: planningPayload,
        });
      }
    } catch (err: any) {
      console.error("AI trip error:", err);
      setMessage(
        "We couldn’t plan this trip right now. Please try again or use Manual Search."
      );
    } finally {
      setLoading(false);
    }
  }

  /*************** RENDER ***************/
  return (
    <section className="mt-2 space-y-4 text-slate-50 bg-slate-950 rounded-2xl border border-slate-800 px-4 py-5">
      {/* HEADER */}
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

      {/* INPUT + BUTTON */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Example: "Austin to Boston, Nov 30 – Dec 3 2025, 2 nights hotel, budget friendly."'
          rows={2}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          {loading ? "Planning your trip…" : "Generate AI Trip"}
        </button>
      </form>

      {/* WARNING / INFO */}
      {message && (
        <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 flex gap-2">
          <span>⚠️</span>
          <span>{message}</span>
        </div>
      )}

      {!planning && !message && (
        <p className="text-[11px] text-slate-500">
          Tip: Include dates and whether you want hotel. Example: &quot;2
          adults, Austin to Boston, long weekend in November, flights + 2 nights
          hotel downtown.&quot;
        </p>
      )}

      {/* BOXED AI RESULTS */}
      {planning && (
        <>
          <Top3Strip planning={planning} />
          <HotelSection />
          <ItinerarySection />
        </>
      )}
    </section>
  );
}

export default AiTripPlanner;
