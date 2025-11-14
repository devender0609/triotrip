// components/AiDestinationCompare.tsx
"use client";

import { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type AirportRec = {
  role: string;   // e.g. "primary_hub", "cheapest_option"
  name: string;   // "Ngurah Rai International Airport"
  code: string;   // "DPS"
  reason: string; // short explanation
};

type Comparison = {
  name: string;
  approx_cost_level: string;
  weather_summary: string;
  best_for: string;
  pros: string[];
  cons: string[];
  overall_vibe: string;
  airports?: AirportRec[];
};

export function AiDestinationCompare() {
  const [input, setInput] = useState("Bali, Thailand, Hawaii");
  const [month, setMonth] = useState("December");
  const [days, setDays] = useState(7);
  const [home, setHome] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Comparison[] | null>(null);

  if (!AI_ENABLED) {
    return (
      <section
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          AI Destination Compare (temporarily disabled)
        </h2>
        <p style={{ fontSize: 14, color: "#475569" }}>
          Once AI is enabled again, you&apos;ll be able to compare destinations
          side-by-side here.
        </p>
      </section>
    );
  }

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    const destinations = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!destinations.length) {
      setError("Please enter at least one destination.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);
      const res = await aiCompareDestinations({
        destinations,
        month: month || undefined,
        home,
        days,
      });
      setData(res.comparisons as any);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const MONTH_OPTIONS = [
    "Any time",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <section
      style={{
        marginTop: 24,
        background: "#0f172a",
        color: "white",
        borderRadius: 16,
        padding: 20,
        display: "grid",
        gap: 12,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        Compare destinations with AI 🌍
      </h2>
      <p style={{ fontSize: 14, opacity: 0.85 }}>
        Not sure where to go? Enter a few places and we&apos;ll compare them for
        cost, weather, vibe, and even which airports are best to fly into.
      </p>

      {/* Form */}
      <form
        onSubmit={handleCompare}
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
          alignItems: "center",
        }}
      >
        {/* Destinations */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Destinations (comma-separated)
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bali, Thailand, Hawaii"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 12,
              border: "1px solid #1e293b",
              fontSize: 14,
              color: "#0f172a",
            }}
          />
        </div>

        {/* Month */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              width: "100%",
              padding: 9,
              borderRadius: 12,
              border: "1px solid #1e293b",
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m === "Any time" ? "" : m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Days */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Days
          </label>
          <input
            type="number"
            min={2}
            max={30}
            value={days}
            onChange={(e) =>
              setDays(Math.max(2, Math.min(30, Number(e.target.value || 7))))
            }
            style={{
              width: "100%",
              padding: 9,
              borderRadius: 12,
              border: "1px solid #1e293b",
              fontSize: 14,
              color: "#0f172a",
            }}
          />
        </div>

        {/* Home city */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Home city / airport
          </label>
          <input
            value={home}
            onChange={(e) => setHome(e.target.value)}
            placeholder="Austin, TX or AUS"
            style={{
              width: "100%",
              padding: 9,
              borderRadius: 12,
              border: "1px solid #1e293b",
              fontSize: 14,
              color: "#0f172a",
            }}
          />
        </div>

        {/* Button full-width */}
        <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              borderRadius: 999,
              padding: "9px 14px",
              border: "none",
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? "default" : "pointer",
              background:
                "linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #ec4899 100%)",
              color: "white",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Comparing destinations…" : "Compare these places"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <p style={{ color: "#fecaca", fontSize: 13 }}>❌ {error}</p>
      )}

      {/* Results */}
      {data && (
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {data.map((d, idx) => (
            <DestinationCard key={idx} d={d} />
          ))}
        </div>
      )}
    </section>
  );
}

function labelForRole(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("primary")) return "Primary hub";
  if (r.includes("cheapest")) return "Cheapest to fly";
  if (r.includes("convenient")) return "Most convenient";
  if (r.includes("happening") || r.includes("busiest"))
    return "Most happening / busiest";
  if (r.includes("safest")) return "Safest reputation";
  return "Recommended";
}

function DestinationCard({ d }: { d: Comparison }) {
  const costLabel =
    d.approx_cost_level === "$"
      ? "Very budget-friendly"
      : d.approx_cost_level === "$$"
      ? "Moderate"
      : d.approx_cost_level === "$$$"
      ? "Pricey"
      : d.approx_cost_level === "$$$$"
      ? "Luxury"
      : "Varies";

  return (
    <div
      style={{
        borderRadius: 16,
        background: "#020617",
        border: "1px solid #1e293b",
        padding: 14,
        fontSize: 13,
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 2,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{d.name}</h3>
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid #38bdf8",
          }}
        >
          {d.approx_cost_level} · {costLabel}
        </span>
      </div>

      <div>
        <strong>Best for:</strong> {d.best_for}
      </div>
      <div>
        <strong>Weather:</strong> {d.weather_summary}
      </div>

      <div style={{ marginTop: 4 }}>
        <strong>Pros:</strong>
        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
          {(d.pros || []).map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 4 }}>
        <strong>Cons:</strong>
        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
          {(d.cons || []).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      {d.airports && d.airports.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <strong>✈ Suggested airports:</strong>
          <div
            style={{
              display: "grid",
              gap: 6,
              marginTop: 4,
            }}
          >
            {d.airports.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: 8,
                  borderRadius: 10,
                  border: "1px solid #1e293b",
                  background: "#020617",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span>
                    <strong>
                      {a.name} ({a.code})
                    </strong>
                  </span>
                  <span style={{ opacity: 0.8 }}>
                    {labelForRole(a.role)}
                  </span>
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  {a.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 6, fontStyle: "italic", color: "#cbd5f5" }}>
        {d.overall_vibe}
      </div>
    </div>
  );
}
