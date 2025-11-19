// components/AiDestinationCompare.tsx
"use client";

import React, { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type AirportRec = {
  role: string; // e.g. "primary_hub"
  name: string;
  code: string;
  reason?: string;
};

type Comparison = {
  name: string;
  country?: string;
  best_for?: string;
  tagline?: string;
  overall_vibe?: string;
  pros?: string[];
  cons?: string[];
  approx_cost_level?: number | null;
  approx_cost_text?: string;
  weather_summary?: string;
  best_months?: string;
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

const costLabel = (lvl?: number | null): string => {
  if (lvl == null) return "Unknown cost";
  if (lvl <= 1) return "Very budget-friendly";
  if (lvl === 2) return "Budget / mid-range";
  if (lvl === 3) return "Mid-range";
  if (lvl === 4) return "Mid-range / premium";
  return "Premium / expensive";
};

function SectionRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value || !value.trim()) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "#e5e7eb",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#cbd5f5" }}>{value}</div>
    </div>
  );
}

function DestinationCard({ d }: { d: Comparison }) {
  const cLabel = costLabel(d.approx_cost_level);
  const city = d.name || "";
  const displayName = d.country ? `${d.name}, ${d.country}` : d.name;

  const gMapsThingsUrl = `https://www.google.com/travel/things-to-do?q=${encodeURIComponent(
    city || "destination"
  )}`;
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    city || "destination"
  )}`;
  const tripAdvisorUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(
    city || "destination"
  )}`;
  const safetySearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    city + " travel safety"
  )}`;

  return (
    <div
      style={{
        borderRadius: 18,
        background: "#020617",
        border: "1px solid #1e293b",
        padding: 14,
        fontSize: 13,
        display: "grid",
        gap: 8,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              margin: 0,
              color: "#f9fafb",
            }}
          >
            {displayName}
          </h3>
          {d.tagline && (
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "#cbd5f5",
              }}
            >
              {d.tagline}
            </div>
          )}
        </div>
        <div
          style={{
            textAlign: "right",
            display: "grid",
            gap: 4,
          }}
        >
          {d.best_for && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid #38bdf8",
                whiteSpace: "nowrap",
                color: "#e0f2fe",
              }}
            >
              Best for: {d.best_for}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
              border: "1px solid #22c55e",
              whiteSpace: "nowrap",
              color: "#bbf7d0",
            }}
          >
            {cLabel}
          </span>
        </div>
      </div>

      {/* PROS / CONS */}
      {(d.pros && d.pros.length > 0) || (d.cons && d.cons.length > 0) ? (
        <div
          style={{
            display: "grid",
            gap: 6,
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          }}
        >
          {d.pros && d.pros.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#4ade80",
                  marginBottom: 2,
                }}
              >
                👍 Pros
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 16,
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                {d.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {d.cons && d.cons.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#f97316",
                  marginBottom: 2,
                }}
              >
                ⚠️ Cons
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 16,
                  fontSize: 13,
                  color: "#facc15",
                }}
              >
                {d.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* WEATHER / COST / BUDGET */}
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          marginTop: 4,
        }}
      >
        <div>
          <SectionRow label="Weather & best time" value={d.weather_summary} />
          <SectionRow label="Best months" value={d.best_months} />
        </div>
        <div>
          <SectionRow
            label="Approximate cost"
            value={d.approx_cost_text || cLabel}
          />
          <SectionRow
            label="Typical daily budget"
            value={d.typical_daily_budget}
          />
          <SectionRow label="Currency" value={d.currency} />
        </div>
      </div>

      {/* DETAIL SECTIONS */}
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

      {/* AIRPORTS */}
      {d.airports && d.airports.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "#e5e7eb",
              marginBottom: 2,
            }}
          >
            Airports
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              fontSize: 12,
            }}
          >
            {d.airports.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid #0ea5e9",
                  background: "#020617",
                  color: "#e0f2fe",
                }}
              >
                {a.code} – {a.name}{" "}
                {a.role && (
                  <span style={{ opacity: 0.8 }}>({a.role})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXTERNAL LINKS */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <a
          href={gMapsThingsUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #0ea5e9",
            textDecoration: "none",
            background: "#0ea5e9",
            color: "#0f172a",
            fontWeight: 600,
          }}
        >
          🧭 Things to do
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #22c55e",
            textDecoration: "none",
            background: "#22c55e",
            color: "#022c22",
            fontWeight: 600,
          }}
        >
          🏨 Hotels
        </a>
        <a
          href={tripAdvisorUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #38bdf8",
            textDecoration: "none",
            background: "#020617",
            color: "#e0f2fe",
            fontWeight: 600,
          }}
        >
          ⭐ Reviews
        </a>
        <a
          href={safetySearchUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #f97316",
            textDecoration: "none",
            background: "#020617",
            color: "#fed7aa",
            fontWeight: 600,
          }}
        >
          🛟 Safety info
        </a>
      </div>

      {/* VIBE FOOTER */}
      {d.overall_vibe && (
        <div
          style={{
            marginTop: 6,
            fontStyle: "italic",
            color: "#cbd5f5",
            fontSize: 12,
          }}
        >
          {d.overall_vibe}
        </div>
      )}
    </div>
  );
}

export function AiDestinationCompare() {
  const [input, setInput] = useState("Bali, Hawaii, Costa Rica");
  const [month, setMonth] = useState<string>("December");
  const [days, setDays] = useState<number>(7);
  const [home, setHome] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Comparison[] | null>(null);

  if (!AI_ENABLED) {
    return null; // Hide if AI is disabled via env
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    try {
      setLoading(true);
      const destinations = input.trim();
      if (!destinations) {
        setError("Please enter at least 2 destinations to compare.");
        return;
      }

      // Get raw response (untyped)
      const raw: any = await aiCompareDestinations({
        destinations,
        month: month || undefined,
        home,
        days,
      });

      // Coerce into our typed shape
      const res: CompareResponse = {
        comparisons: (raw?.comparisons || []).map((c: any): Comparison => {
          let approxLevel: number | null = null;
          if (c?.approx_cost_level !== undefined && c?.approx_cost_level !== null) {
            if (typeof c.approx_cost_level === "number") {
              approxLevel = c.approx_cost_level;
            } else {
              const parsed = Number(c.approx_cost_level);
              approxLevel = Number.isFinite(parsed) ? parsed : null;
            }
          }
          return {
            name: c.name,
            country: c.country,
            best_for: c.best_for,
            tagline: c.tagline,
            overall_vibe: c.overall_vibe,
            pros: c.pros,
            cons: c.cons,
            approx_cost_level: approxLevel,
            approx_cost_text: c.approx_cost_text,
            weather_summary: c.weather_summary,
            best_months: c.best_months,
            dining_and_local_eats: c.dining_and_local_eats,
            hotels_and_areas: c.hotels_and_areas,
            entertainment_and_nightlife: c.entertainment_and_nightlife,
            family_friendly: c.family_friendly,
            kids_activities: c.kids_activities,
            safety_tips: c.safety_tips,
            currency: c.currency,
            typical_daily_budget: c.typical_daily_budget,
            airports: c.airports,
          };
        }),
      };

      setData(res.comparisons || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        border: "1px solid #0f172a",
        background: "#020617",
        color: "#e5e7eb",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Compare destinations with AI
          <span>🌍</span>
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#cbd5f5",
            marginTop: 2,
          }}
        >
          Type a few places you&apos;re considering and we&apos;ll outline
          cost, vibe, weather, and practical details side-by-side.
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns:
            "minmax(0, 2.3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr)",
          alignItems: "end",
        }}
      >
        {/* Destinations */}
        <div style={{ minWidth: 180 }}>
          <label
            style={{
              fontSize: 14,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Destinations to compare
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Bali, Hawaii, Costa Rica"
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "#f9fafb",
              padding: "0 10px",
              fontSize: 14,
            }}
          />
        </div>

        {/* Month */}
        <div>
          <label
            style={{
              fontSize: 14,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            When are you going?
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "#f9fafb",
              padding: "0 10px",
              fontSize: 14,
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
              fontSize: 14,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Trip length (days)
          </label>
          <input
            type="number"
            min={3}
            max={30}
            value={days}
            onChange={(e) =>
              setDays(Math.max(1, Number(e.target.value || "7")))
            }
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "#f9fafb",
              padding: "0 10px",
              fontSize: 14,
            }}
          />
        </div>

        {/* Home base */}
        <div>
          <label
            style={{
              fontSize: 14,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Home airport / city
          </label>
          <input
            type="text"
            value={home}
            onChange={(e) => setHome(e.target.value)}
            placeholder="e.g. Austin, TX"
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "#f9fafb",
              padding: "0 10px",
              fontSize: 14,
            }}
          />
        </div>

        {/* Submit button */}
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(90deg,#0ea5e9,#6366f1,#ec4899)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Comparing…" : "Compare destinations"}
          </button>
        </div>
      </form>

      {/* ERROR */}
      {error && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(248,113,113,0.7)",
            background: "rgba(127,29,29,0.4)",
            padding: 8,
            fontSize: 12,
            color: "#fecaca",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* RESULTS */}
      {data && data.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          }}
        >
          {data.map((d, i) => (
            <DestinationCard key={d.name + i} d={d} />
          ))}
        </div>
      )}
    </section>
  );
}
