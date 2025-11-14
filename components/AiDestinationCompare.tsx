// components/AiDestinationCompare.tsx
"use client";

import { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

export function AiDestinationCompare() {
  const [input, setInput] = useState("Bali, Thailand, Hawaii");
  const [month, setMonth] = useState("December");
  const [days, setDays] = useState(7);
  const [home, setHome] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[] | null>(null);

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
        month,
        home,
        days,
      });
      setData(res.comparisons);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        padding: 16,
        display: "grid",
        gap: 10,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>
        Compare destinations with AI 🌍
      </h2>

      <form
        onSubmit={handleCompare}
        style={{ display: "grid", gap: 8, gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bali, Thailand, Hawaii"
          style={{
            padding: 8,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <input
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="Month"
          style={{
            padding: 8,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value || "7"))}
          style={{
            padding: 8,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <input
          value={home}
          onChange={(e) => setHome(e.target.value)}
          placeholder="Home city"
          style={{
            padding: 8,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            gridColumn: "1 / -1",
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            fontWeight: 600,
            marginTop: 4,
            background:
              "linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #ec4899 100%)",
            color: "white",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Comparing..." : "Compare destinations"}
        </button>
      </form>

      {error && (
        <div style={{ color: "#b91c1c", fontSize: 13 }}>❌ {error}</div>
      )}

      {data && (
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {data.map((d: any) => (
            <div
              key={d.name}
              style={{
                borderRadius: 14,
                background: "white",
                border: "1px solid #e5e7eb",
                padding: 10,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 4,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{d.name}</span>
                <span>{d.approx_cost_level}</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Best for:</strong> {d.best_for}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Weather:</strong> {d.weather_summary}
              </div>
              <div>
                <strong>Pros:</strong>
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {(d.pros || []).map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Cons:</strong>
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {(d.cons || []).map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 4, fontStyle: "italic" }}>
                {d.overall_vibe}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
