// components/AiDestinationCompare.tsx
"use client";

import { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type AirportRec = {
  role: string;
  name: string;
  code: string;
  reason: string;
};

type Comparison = {
  name: string;
  approx_cost_level: string;
  weather_summary: string;
  best_for: string;
  pros: string[];
  cons: string[];
  overall_vibe: string;
  dining_and_local_eats?: string;
  hotels_and_areas?: string;
  entertainment_and_nightlife?: string;
  family_friendly?: string;
  kids_activities?: string;
  safety_tips?: string;
  currency?: string;
  typical_daily_budget?: string;
  airports?: AirportRec[];
};

type CompareResponse = {
  comparisons: Comparison[];
};

/* MAIN COMPONENT – named export */
export function AiDestinationCompare() {
  const [input, setInput] = useState("Bali, Thailand, Hawaii");
  const [month, setMonth] = useState("December");
  const [days, setDays] = useState(7);
  const [home, setHome] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Comparison[] | null>(null);

  if (!AI_ENABLED) return null;

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

      const res = (await aiCompareDestinations({
        destinations,
        month: month || undefined,
        home,
        days,
      })) as CompareResponse;

      setData(res.comparisons);
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
        marginTop: 32,
        padding: 24,
        borderRadius: 18,
        border: "1px solid #0f172a",
        background: "#020617",
        color: "#e5e7eb",
        display: "grid",
        gap: 16,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        fontSize: 15, // base size – matches AI trip planner
      }}
    >
      {/* HEADER (match Plan my trip with AI) */}
      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Compare destinations with AI</span>
          <span>🌍</span>
        </div>
        <p
          style={{
            fontSize: 15,
            color: "#cbd5f5",
            maxWidth: 900,
            lineHeight: 1.6,
          }}
        >
          Not sure where to go? Enter a few places and we&apos;ll compare them
          for cost, weather, food, hotels, nightlife, family-friendliness,
          safety, and the best airports to use.
        </p>
      </div>

      {/* FORM – dark inputs + gradient button like AI planner */}
      <form
        onSubmit={handleCompare}
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
          alignItems: "center",
        }}
      >
        {/* Destinations */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            style={{
              fontSize: 15,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
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
              padding: 12,
              borderRadius: 14,
              border: "1px solid #1e293b",
              fontSize: 15,
              color: "#f9fafb",
              background: "#020617",
            }}
          />
        </div>

        {/* Month */}
        <div>
          <label
            style={{
              fontSize: 15,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              width: "100%",
              padding: 11,
              borderRadius: 14,
              border: "1px solid #1e293b",
              fontSize: 15,
              color: "#f9fafb",
              background: "#020617",
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
              fontSize: 15,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
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
              padding: 11,
              borderRadius: 14,
              border: "1px solid #1e293b",
              fontSize: 15,
              color: "#f9fafb",
              background: "#020617",
            }}
          />
        </div>

        {/* Home city */}
        <div>
          <label
            style={{
              fontSize: 15,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
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
              padding: 11,
              borderRadius: 14,
              border: "1px solid #1e293b",
              fontSize: 15,
              color: "#f9fafb",
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
              padding: "13px 20px",
              border: "none",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "default" : "pointer",
              background:
                "linear-gradient(90deg, #0ea5e9, #6366f1, #ec4899)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Comparing destinations…" : "Compare these places"}
          </button>
        </div>
      </form>

      {/* ERROR */}
      {error && (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(248,113,113,0.6)",
            background: "rgba(153,27,27,0.35)",
            padding: 12,
            fontSize: 14,
            color: "#fecaca",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* RESULTS – dark cards to match AI planner results */}
      {data && (
        <div
          style={{
            marginTop: 10,
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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

/* ---------- HELPERS ---------- */

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

function costLabel(level: string): string {
  switch (level) {
    case "$":
      return "Very budget-friendly";
    case "$$":
      return "Moderate";
    case "$$$":
      return "Pricey";
    case "$$$$":
      return "Luxury";
    default:
      return "Varies";
  }
}

function SectionRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "#93c5fd",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, marginTop: 3, color: "#e5e7eb" }}>
        {value}
      </div>
    </div>
  );
}

/* ---------- RESULT CARD ---------- */

function DestinationCard({ d }: { d: Comparison }) {
  const cLabel = costLabel(d.approx_cost_level);

  return (
    <article
      style={{
        borderRadius: 18,
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(12,74,110,0.9))",
        border: "1px solid #1e293b",
        padding: 16,
        fontSize: 15,
        display: "grid",
        gap: 8,
        boxShadow: "0 10px 25px rgba(15,23,42,0.55)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#f9fafb",
          }}
        >
          {d.name}
        </h3>
        <span
          style={{
            fontSize: 13,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #38bdf8",
            color: "#e0f2fe",
            whiteSpace: "nowrap",
          }}
        >
          {d.approx_cost_level} · {cLabel}
        </span>
      </div>

      <div style={{ fontSize: 15, color: "#e5e7eb" }}>
        <strong>Best for:</strong> {d.best_for}
      </div>
      <div style={{ fontSize: 15, color: "#e5e7eb" }}>
        <strong>Weather:</strong> {d.weather_summary}
      </div>

      <div style={{ marginTop: 6 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#bbf7d0",
            marginBottom: 4,
          }}
        >
          ✅ Pros
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(d.pros || []).map((p, i) => (
            <li key={i} style={{ marginBottom: 3 }}>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 6 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#fecaca",
            marginBottom: 4,
          }}
        >
          ⚠️ Cons
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(d.cons || []).map((c, i) => (
            <li key={i} style={{ marginBottom: 3 }}>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <SectionRow
        label="Dining & local eats"
        value={d.dining_and_local_eats}
      />
      <SectionRow
        label="Hotels & areas to stay"
        value={d.hotels_and_areas}
      />
      <SectionRow
        label="Entertainment & nightlife"
        value={d.entertainment_and_nightlife}
      />
      <SectionRow
        label="Family-friendly"
        value={d.family_friendly}
      />
      <SectionRow
        label="Activities for kids"
        value={d.kids_activities}
      />
      <SectionRow label="Safety tips" value={d.safety_tips} />
      <SectionRow label="Currency" value={d.currency} />
      <SectionRow
        label="Typical daily budget"
        value={d.typical_daily_budget}
      />

      {d.airports && d.airports.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "#93c5fd",
            }}
          >
            Suggested airports
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            {d.airports.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: 9,
                  borderRadius: 14,
                  border: "1px solid #1e293b",
                  background: "#020617",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    gap: 8,
                  }}
                >
                  <span>
                    <strong>
                      {a.name} ({a.code})
                    </strong>
                  </span>
                  <span style={{ opacity: 0.9 }}>
                    {labelForRole(a.role)}
                  </span>
                </div>
                <div style={{ fontSize: 14, marginTop: 3 }}>
                  {a.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 8,
          fontStyle: "italic",
          fontSize: 15,
          color: "#e5e7eb",
        }}
      >
        {d.overall_vibe}
      </div>
    </article>
  );
}

/* DEFAULT EXPORT TOO */
export default AiDestinationCompare;
