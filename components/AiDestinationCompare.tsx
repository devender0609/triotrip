"use client";

import React, { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

type Comparison = {
  name?: string;
  approx_cost_level?: string | number;
  weather_summary?: string;
  best_for?: string;
  pros?: string[];
  cons?: string[];
  overall_vibe?: string;
  links?: { label: string; url: string }[];
};

export function AiDestinationCompare() {
  const [destinationsText, setDestinationsText] = useState("");
  const [month, setMonth] = useState("");
  const [days, setDays] = useState(7);
  const [home, setHome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[] | null>(null);

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
      // Use loose typing to avoid TS issues if API changes shape
      const raw: any = await aiCompareDestinations({
        destinations: destArray,
        month: month || undefined,
        home,
        days: days || undefined,
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
          "linear-gradient(120deg, #ecfeff, #eef2ff, #fdf2ff)", // light aqua/indigo/pink
        border: "1px solid rgba(59,130,246,0.35)",
        boxShadow: "0 10px 25px rgba(15,23,42,0.10)",
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 4,
        }}
      >
        Compare destinations with AI 🌍
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "#334155",
          marginBottom: 12,
        }}
      >
        Drop in a few places and we’ll compare them for typical cost, weather,
        hotels, food, family-friendliness, safety and more. This is a{" "}
        <strong>separate tool</strong> from your flight search — perfect for
        deciding <em>where</em> to go before you book.
      </p>

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
              fontSize: 14,
            }}
          >
            Destinations (comma-separated)
          </label>
          <input
            type="text"
            placeholder="Bali, Thailand, Hawaii"
            value={destinationsText}
            onChange={(e) => setDestinationsText(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "10px 12px",
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
              fontSize: 14,
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
              padding: "10px 12px",
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
              fontSize: 14,
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
              padding: "10px 12px",
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
              fontSize: 14,
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
              padding: "10px 12px",
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
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg,#0ea5e9,#6366f1,#ec4899)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 8px 18px rgba(37,99,235,0.35)",
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
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(148,163,184,0.5)",
                padding: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 4,
                  color: "#0f172a",
                }}
              >
                {c.name || `Destination ${idx + 1}`}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                {c.overall_vibe || c.weather_summary || c.best_for}
              </div>
              {typeof c.approx_cost_level !== "undefined" && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  💰 Approx. cost level:{" "}
                  <strong>{String(c.approx_cost_level)}</strong>
                </div>
              )}
              {c.pros && c.pros.length > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 4,
                    color: "#16a34a",
                  }}
                >
                  <strong>Pros:</strong> {c.pros.join(" • ")}
                </div>
              )}
              {c.cons && c.cons.length > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 4,
                    color: "#b91c1c",
                  }}
                >
                  <strong>Cons:</strong> {c.cons.join(" • ")}
                </div>
              )}
              {c.links && c.links.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  {c.links.map((lnk, i) => (
                    <a
                      key={i}
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "#e0f2fe",
                        color: "#0f172a",
                        textDecoration: "none",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      {lnk.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
