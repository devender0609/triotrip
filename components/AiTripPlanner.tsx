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

  // If AI is toggled OFF, show a friendly card and no form
  if (!AI_ENABLED) {
    return (
      <section
        style={{
          background: "#f1f5f9",
          borderRadius: 16,
          padding: 16,
          border: "1px solid #e2e8f0",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          AI Trip Planner temporarily unavailable
        </h2>
        <p style={{ fontSize: 14, color: "#475569" }}>
          Our AI assistant is currently turned off or at its usage limit. You
          can still use the normal search below to find great trips.
        </p>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await aiPlanTrip(query);
      if (!data.ok) {
        setError(data.error || "AI planner failed.");
      } else {
        setResult(data);
      }
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
        padding: 16,
        display: "grid",
        gap: 10,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        Plan my trip with AI ✈️
      </h2>
      <p style={{ fontSize: 14, opacity: 0.9 }}>
        Type one sentence and let Triotrip AI suggest your best 3 trips and a
        sample itinerary.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days in Tokyo in March from Austin, under $2500, kid-friendly with good vegetarian food…"
          rows={3}
          style={{
            padding: 10,
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
            padding: "8px 16px",
            border: "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? "default" : "pointer",
            background:
              "linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #ec4899 100%)",
            color: "white",
            opacity: loading || !query.trim() ? 0.7 : 1,
          }}
        >
          {loading ? "Planning your trip…" : "Generate AI Trip"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#fecaca", fontSize: 13 }}>
          ❌ {error}
        </p>
      )}

      {result?.planning && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            background: "#020617",
            maxHeight: 260,
            overflow: "auto",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Top 3 options</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(result.planning.top3 ?? [], null, 2)}
          </pre>

          <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 4 }}>
            Suggested itinerary
          </div>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(result.planning.itinerary ?? [], null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
