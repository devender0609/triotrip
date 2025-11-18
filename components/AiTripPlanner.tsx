"use client";

import React, { useState } from "react";
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

const containerStyle: React.CSSProperties = {
  marginTop: 8,
  padding: 16,
  borderRadius: 16,
  border: "1px solid #0f172a",
  background: "#020617",
  color: "#e5e7eb",
  display: "grid",
  gap: 12,
};

const boxTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 4,
};

const smallText: React.CSSProperties = {
  fontSize: 11,
  color: "#cbd5f5",
};

const infoBarStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(56,189,248,0.5)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,47,73,0.95))",
  padding: 10,
};

const chipColGrid: React.CSSProperties = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
};

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(30,64,175,0.6)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(12,74,110,0.9))",
  padding: 10,
  fontSize: 12,
};

const hotelCard: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #1e293b",
  background: "#020617",
  padding: 10,
  fontSize: 12,
};

const dayCard: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #1e293b",
  background: "#020617",
  padding: 10,
  fontSize: 12,
};

function AiTripPlanner({ onSearchComplete }: AiTripPlannerProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!AI_ENABLED) return null;

  /*************** TOP 3 (BOXES) ***************/
  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs = [
      { key: "best_overall" as const, label: "Best overall", icon: "🥇" },
      { key: "best_budget" as const, label: "Best budget", icon: "💰" },
      { key: "best_comfort" as const, label: "Best comfort", icon: "🛋️" },
    ];

    return (
      <section style={{ display: "grid", gap: 8 }}>
        <div style={infoBarStyle}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🔝 AI’s top picks</span>
          </div>
          <p style={smallText}>
            These are the trips the AI thinks fit your request best. You’ll see
            the full list of live options below in the results section.
          </p>
        </div>

        <div style={chipColGrid}>
          {defs.map(({ key, label, icon }) => {
            const value = (t as any)?.[key] as Top3Item | undefined;
            if (!value) return null;

            return (
              <article key={key} style={cardStyle}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: "#e0f2fe",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
                {value.title && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#f9fafb",
                    }}
                  >
                    {value.title}
                  </div>
                )}
                {value.reason && (
                  <p
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    {value.reason}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*************** HOTELS (BOXES) ***************/
  const HotelSection = () => {
    const hotels = Array.isArray(planning?.hotels) ? planning!.hotels : [];
    if (!hotels.length) return null;

    return (
      <section style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <div style={infoBarStyle}>
          <div style={boxTitle}>🏨 Hotel suggestions (AI)</div>
          <p style={smallText}>
            AI-picked hotel ideas based on your budget and vibe. Check prices on
            your favorite booking site.
          </p>
        </div>

        <div style={chipColGrid}>
          {hotels.map((h, i) => {
            const name = h.name || h.title || h.hotel || `Option ${i + 1}`;
            const area = h.area || h.location || h.neighborhood || "";
            const approx =
              h.approx || h.price || h.priceText || h.approxPrice || "";
            const vibe =
              h.vibe || h.description || h.notes || h.summary || "";

            return (
              <article key={i} style={hotelCard}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: "#38bdf8",
                    marginBottom: 4,
                  }}
                >
                  Hotel option {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#f9fafb",
                    marginBottom: 2,
                  }}
                >
                  {name}
                </div>
                {area && (
                  <div
                    style={{
                      color: "#cbd5f5",
                      fontSize: 12,
                      marginBottom: 2,
                    }}
                  >
                    📍 {area}
                  </div>
                )}
                {approx && (
                  <div style={{ color: "#e5e7eb", fontSize: 12 }}>
                    <strong>Approx:</strong> {approx}
                  </div>
                )}
                {vibe && (
                  <p
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  >
                    {vibe}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  /*************** ITINERARY (DAY BOXES) ***************/
  const ItinerarySection = () => {
    const days = Array.isArray(planning?.itinerary)
      ? planning!.itinerary
      : [];

    if (!days.length) return null;

    return (
      <section style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <div style={infoBarStyle}>
          <div style={boxTitle}>📅 Suggested Itinerary</div>
          <p style={smallText}>
            Use this as a starting point – you can adjust days or swap
            activities once you pick final flights and hotel.
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
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
              <article key={i} style={dayCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#f9fafb",
                    }}
                  >
                    {title}
                  </div>
                  {day.label && (
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        borderRadius: 999,
                        padding: "2px 8px",
                        border: "1px solid rgba(16,185,129,0.6)",
                        background: "rgba(6,95,70,0.35)",
                        color: "#a7f3d0",
                      }}
                    >
                      {day.label}
                    </span>
                  )}
                </div>

                {summary && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#e5e7eb",
                      marginBottom: 4,
                    }}
                  >
                    {summary}
                  </p>
                )}

                {bullets.length > 0 && (
                  <ul
                    style={{
                      listStyle: "none",
                      paddingLeft: 0,
                      margin: 0,
                      display: "grid",
                      gap: 3,
                    }}
                  >
                    {bullets.map((b: any, idx: number) => {
                      if (typeof b === "string") {
                        return (
                          <li
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 6,
                              fontSize: 11,
                              color: "#e5e7eb",
                            }}
                          >
                            <span>•</span>
                            <span>{b}</span>
                          </li>
                        );
                      }
                      const time = b.time || b.when;
                      const text = b.text || b.title || b.activity || "";
                      return (
                        <li
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                            fontSize: 11,
                            color: "#e5e7eb",
                          }}
                        >
                          <span>{time ? "⏰" : "•"}</span>
                          <span>
                            {time && (
                              <strong>{time}: </strong>
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
    <section style={containerStyle}>
      {/* HEADER */}
      <div style={{ display: "grid", gap: 4 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Plan my trip with AI</span>
          <span>✈️</span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "#cbd5f5",
            maxWidth: 640,
          }}
        >
          Tell us your trip idea in one sentence. We&apos;ll interpret it,
          generate an itinerary, and show real flight options using the same
          data as your manual search.
        </p>
      </div>

      {/* INPUT + BUTTON */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 8, marginTop: 4 }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Example: "Austin to Boston, Nov 30 – Dec 3 2025, 2 nights hotel, budget friendly."'
          rows={2}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid #1e293b",
            background: "#020617",
            color: "#f9fafb",
            padding: 8,
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            background:
              "linear-gradient(90deg, #0ea5e9, #6366f1, #ec4899)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading || !prompt.trim() ? "default" : "pointer",
            opacity: loading || !prompt.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Planning your trip…" : "Generate AI Trip"}
        </button>
      </form>

      {/* MESSAGE */}
      {message && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(251,191,36,0.6)",
            background: "rgba(251,191,36,0.12)",
            padding: 8,
            fontSize: 11,
            color: "#facc15",
            display: "flex",
            gap: 6,
          }}
        >
          <span>⚠️</span>
          <span>{message}</span>
        </div>
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
