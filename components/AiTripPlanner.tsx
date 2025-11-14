// components/AiTripPlanner.tsx
"use client";

import { useState } from "react";
import { aiPlanTrip } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!AI_ENABLED) {
    return (
      <section style={{ padding: 16 }}>
        <h2>AI Planner unavailable</h2>
        <p>You can still use the manual search below.</p>
      </section>
    );
  }

  const Itinerary = ({ itinerary }: { itinerary: any[] }) => {
    if (!itinerary || itinerary.length === 0) return null;

    return (
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>📅 Suggested Itinerary</h3>
        {itinerary.map((day, idx) => (
          <div
            key={idx}
            style={{
              background: "#020617",
              padding: 16,
              borderRadius: 12,
              border: "1px solid #1e293b",
            }}
          >
            <h4 style={{ fontSize: 16, marginBottom: 8 }}>
              🗓 Day {day.day} —{" "}
              {day.date
                ? new Date(day.date).toLocaleDateString()
                : "Date not specified"}
            </h4>
            <ul style={{ paddingLeft: 16 }}>
              {(day.activities || []).map((act: string, i: number) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  • {act}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const Top3 = ({ planning }: any) => {
    if (!planning?.top3) return null;
    const items = planning.top3;

    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>🏆 Top 3 Options</h3>

        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {Object.entries(items).map(([label, item]: any, idx) => (
            <div
              key={idx}
              style={{
                background: "#0f172a",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #1e293b",
              }}
            >
              <h4 style={{ fontSize: 16, marginBottom: 6 }}>
                {label === "best_overall" && "🥇 Best Overall"}
                {label === "best_budget" && "💸 Best Budget"}
                {label === "best_comfort" && "😌 Most Comfortable"}
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                {item.reason || "Chosen by AI"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await aiPlanTrip(query);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong with AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        background: "#0f172a",
        color: "white",
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        display: "grid",
        gap: 10,
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>
        Plan my trip with AI ✈️
      </h2>
      <p style={{ opacity: 0.8, marginBottom: 4 }}>
        Tell us your trip idea in one sentence. We&apos;ll propose top options
        and a day-by-day itinerary.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 2-day trip from Austin to Boston, Dec 1–3, 2025, budget friendly, good food."
          rows={3}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #1e293b",
            fontSize: 14,
            resize: "vertical",
            color: "#0f172a",
          }}
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            borderRadius: 999,
            padding: "10px 16px",
            border: "none",
            fontWeight: 600,
            fontSize: 15,
            cursor: loading ? "default" : "pointer",
            background:
              "linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #ec4899 100%)",
            color: "white",
            opacity: loading || !query.trim() ? 0.7 : 1,
          }}
        >
          {loading ? "Thinking…" : "Generate AI Trip"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#fecaca", fontSize: 14, marginTop: 4 }}>
          ❌ {error}
        </p>
      )}

      {result?.planning && (
        <>
          <Top3 planning={result.planning} />
          <Itinerary itinerary={result.planning.itinerary ?? []} />
        </>
      )}
    </section>
  );
}
