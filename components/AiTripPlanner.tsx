// components/AiTripPlanner.tsx
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

type FlightOption = {
  label: string;
  from?: string;
  to?: string;
  airline?: string;
  approx_price?: number;
  currency?: string;
  notes?: string;
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
  flights?: FlightOption[];
  hotels?: HotelOption[];
};

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanningPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!AI_ENABLED) {
    return (
      <section style={{ padding: 16 }}>
        <h2>AI Planner unavailable</h2>
        <p>You can still use the manual search below.</p>
      </section>
    );
  }

  // ---------- TOP 3 UI ----------
  const Top3 = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const items: { key: keyof PlanningPayload["top3"]; label: string }[] = [
      { key: "best_overall", label: "🥇 Best overall" },
      { key: "best_budget", label: "💸 Best budget" },
      { key: "best_comfort", label: "😌 Most comfortable" },
    ];

    const realItems = items
      .map((def) => {
        const value = t[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { ...def, value };
      })
      .filter(Boolean) as { key: any; label: string; value: Top3Item }[];

    if (realItems.length === 0) return null; // <-- no empty cards or extra space

    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>🏆 Top 3 Options</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {realItems.map(({ key, label, value }) => (
            <div
              key={key}
              style={{
                background: "#0f172a",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #1e293b",
              }}
            >
              <h4 style={{ fontSize: 16, marginBottom: 4 }}>{label}</h4>
              {value.title && (
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: value.reason ? 4 : 0,
                  }}
                >
                  {value.title}
                </div>
              )}
              {/* Only show reason if it exists – no “Chosen by AI” filler */}
              {value.reason && (
                <p style={{ color: "#94a3b8", fontSize: 14 }}>{value.reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- ITINERARY UI ----------
  const Itinerary = ({ itinerary }: { itinerary: any[] }) => {
    if (!itinerary || itinerary.length === 0) return null;

    return (
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>📅 Suggested Itinerary</h3>
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
            // some models might put date into "day"
            dateLabel = new Date(rawDay).toLocaleDateString();
          }

          if (typeof rawDate === "string" && rawDate.trim()) {
            // preferred date field
            dateLabel = new Date(rawDate).toLocaleDateString();
          }

          if (!dayLabel) dayLabel = `Day ${idx + 1}`;
          const header = dateLabel ? `${dayLabel} — ${dateLabel}` : dayLabel;

          return (
            <div
              key={idx}
              style={{
                background: "#020617",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #1e293b",
              }}
            >
              <h4 style={{ fontSize: 16, marginBottom: 8 }}>🗓 {header}</h4>
              <ul style={{ paddingLeft: 16 }}>
                {(day.activities || []).map((act: string, i: number) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    • {act}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------- FLIGHT OPTIONS UI ----------
  const FlightOptions = ({ flights }: { flights?: FlightOption[] }) => {
    if (!flights || flights.length === 0) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>✈ Flight options</h3>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {flights.map((f, i) => (
            <div
              key={i}
              style={{
                background: "#020617",
                borderRadius: 12,
                border: "1px solid #1e293b",
                padding: 12,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {f.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {f.from && f.to && (
                  <span>
                    {f.from} → {f.to}
                  </span>
                )}
                {f.airline && <span>• {f.airline}</span>}
                {typeof f.approx_price === "number" && (
                  <span>
                    • approx{" "}
                    {(f.currency || "USD") +
                      " " +
                      Math.round(f.approx_price)}
                  </span>
                )}
              </div>
              {f.notes && (
                <div style={{ marginTop: 4, color: "#cbd5f5" }}>{f.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- HOTEL OPTIONS UI ----------
  const HotelOptions = ({ hotels }: { hotels?: HotelOption[] }) => {
    if (!hotels || hotels.length === 0) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>🏨 Hotel suggestions</h3>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {hotels.map((h, i) => (
            <div
              key={i}
              style={{
                background: "#020617",
                borderRadius: 12,
                border: "1px solid #1e293b",
                padding: 12,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{h.name}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {h.area && <span>{h.area}</span>}
                {typeof h.approx_price_per_night === "number" && (
                  <span>
                    {" "}
                    • ~
                    {(h.currency || "USD") +
                      " " +
                      Math.round(h.approx_price_per_night)}
                    /night
                  </span>
                )}
              </div>
              {h.vibe && (
                <div style={{ marginTop: 4 }}>
                  <strong>Vibe:</strong> {h.vibe}
                </div>
              )}
              {h.why && (
                <div style={{ marginTop: 2 }}>
                  <strong>Why:</strong> {h.why}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- SUBMIT ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await aiPlanTrip(query);
      setResult(data.planning as PlanningPayload);
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
        Tell us your trip idea in one sentence. We&apos;ll propose top options, a
        day-by-day itinerary, and suggested flights &amp; hotels.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days from Austin to Las Vegas by flight, Jan 10–15 2026, mid-budget, shows and nightlife."
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

      {result && (
        <>
          <Top3 planning={result} />
          <FlightOptions flights={result.flights} />
          <HotelOptions hotels={result.hotels} />
          <Itinerary itinerary={result.itinerary ?? []} />
        </>
      )}
    </section>
  );
}
