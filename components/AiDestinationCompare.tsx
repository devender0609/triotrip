// components/AiDestinationCompare.tsx
"use client";

import React, { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

// Feature flag so we can turn this section off if needed
const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type Comparison = {
  name?: string;
  overall_vibe?: string;
  weather_summary?: string;
  best_for?: string;
  approx_cost_level?: string | number;
  pros?: string[];
  cons?: string[];
};

export function AiDestinationCompare() {
  const [destinationsText, setDestinationsText] = useState("");
  const [month, setMonth] = useState("");
  const [days, setDays] = useState(7);
  const [home, setHome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[] | null>(null);

  if (!AI_ENABLED) {
    // If AI is disabled, just don't render the section. This protects builds
    // where NEXT_PUBLIC_AI_ENABLED is false or missing.
    return null;
  }

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setComparisons(null);

    const destArray = destinationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!destArray.length) {
      setError("Please enter at least one destination.");
      return;
    }

    try {
      setLoading(true);

      // Use loose typing so small API shape changes won't break the build.
      const raw: any = await aiCompareDestinations({
        destinations: destArray,
        month: month || undefined,
        days: days || undefined,
        home,
      } as any);

      const items: Comparison[] = Array.isArray(raw?.comparisons)
        ? raw.comparisons
        : [];
      setComparisons(items);
    } catch (err: any) {
      console.error("aiCompareDestinations error", err);
      setError(
        err?.message || "Sorry, the AI comparison could not run right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        marginTop: 24,
        borderRadius: 20,
        padding: 18,
        background:
          "linear-gradient(120deg, #ecfeff, #eef2ff, #fdf2ff)", // light gradient like Figure 2
        border: "1px solid rgba(59,130,246,0.35)",
        boxShadow: "0 10px 25px rgba(15,23,42,0.10)",
      }}
    >
      {/* HEADER */}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 4,
        }}
      >
        Compare destinations with AI 🌍
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "#334155",
          marginBottom: 12,
          maxWidth: 900,
        }}
      >
        Drop in a few places and we’ll compare them for typical cost, weather,
        hotels, food, family-friendliness, safety and more. This is a{" "}
        <strong>separate tool</strong> from your flight search — perfect for
        deciding <em>where</em> to go before you book.
      </p>

      {/* FORM */}
      <form
        onSubmit={handleCompare}
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          alignItems: "end",
          marginBottom: 10,
        }}
      >
        <div style={{ gridColumn: "1 / span 4" }}>
          <label
            style={{
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 4,
              display: "block",
              fontSize: 15,
            }}
          >
            Destinations (comma-separated)
          </label>
          <input
            type="text"
            placeholder="Bali, Hawaii, Costa Rica"
            value={destinationsText}
            onChange={(e) => setDestinationsText(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "11px 13px",
              fontSize: 15,
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 4,
              display: "block",
              fontSize: 15,
            }}
          >
            Month
          </label>
          <input
            type="text"
            placeholder="December"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "11px 13px",
              fontSize: 15,
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 4,
              display: "block",
              fontSize: 15,
            }}
          >
            Days
          </label>
          <input
            type="number"
            min={2}
            max={30}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value || "7", 10))}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "11px 13px",
              fontSize: 15,
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 4,
              display: "block",
              fontSize: 15,
            }}
          >
            Home city / airport
          </label>
          <input
            type="text"
            placeholder="Austin, TX"
            value={home}
            onChange={(e) => setHome(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "11px 13px",
              fontSize: 15,
            }}
          />
        </div>

        <div
          style={{
            textAlign: "right",
            gridColumn: "1 / span 4",
          }}
        >
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "11px 22px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg,#0ea5e9,#6366f1,#ec4899)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 8px 18px rgba(37,99,235,0.35)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Comparing…" : "Compare these places"}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#7f1d1d",
            padding: 10,
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* SIMPLE CARDS – FIGURE-2 STYLE */}
      {comparisons && comparisons.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 6,
          }}
        >
          {comparisons.map((c, idx) => (
            <div
              key={idx}
              style={{
                borderRadius: 16,
                background: "#ffffff",
                border: "1px solid rgba(148,163,184,0.6)",
                padding: 14,
              }}
            >
              {/* City name */}
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 4,
                  color: "#0f172a",
                }}
              >
                {c.name || `Destination ${idx + 1}`}
              </div>

              {/* One-line vibe/summary */}
              <div
                style={{
                  fontSize: 14,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                {c.overall_vibe ||
                  c.weather_summary ||
                  c.best_for ||
                  "No summary available yet."}
              </div>

              {/* Cost line */}
              {typeof c.approx_cost_level !== "undefined" &&
                c.approx_cost_level !== null && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    <span role="img" aria-label="money">
                      💰
                    </span>{" "}
                    Approx. cost level:{" "}
                    <strong>{String(c.approx_cost_level)}</strong>
                  </div>
                )}

              {/* Pros & cons on single lines */}
              {c.pros && c.pros.length > 0 && (
                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 3,
                    color: "#15803d",
                  }}
                >
                  <strong>Pros:</strong> {c.pros.join(" • ")}
                </div>
              )}
              {c.cons && c.cons.length > 0 && (
                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 2,
                    color: "#b91c1c",
                  }}
                >
                  <strong>Cons:</strong> {c.cons.join(" • ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
