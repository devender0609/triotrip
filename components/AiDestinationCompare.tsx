"use client";

import React, { useState } from "react";
import { aiCompareDestinations } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

function str(value: any, fallback = ""): string {
  if (Array.isArray(value)) return value.join(" ");
  if (value == null) return fallback;
  return String(value);
}

function list(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  return String(value)
    .split(/[\n•\-•]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  currency: string;
};

export function AiDestinationCompare({ currency }: Props) {
  const [destinationsText, setDestinationsText] = useState("");
  const [month, setMonth] = useState("");
  const [days, setDays] = useState(7);
  const [home, setHome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<any[] | null>(null);

  if (!AI_ENABLED) return null;

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setComparisons(null); // overwrite previous results

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

      const raw: any = await aiCompareDestinations({
        destinations: destArray,
        month: month || undefined,
        days: days || undefined,
        home,
        currency: currency || undefined,
      } as any);

      const arr: any[] = Array.isArray(raw?.comparisons)
        ? raw.comparisons
        : Array.isArray(raw)
        ? raw
        : [];

      setComparisons(arr);
    } catch (err: any) {
      console.error("aiCompareDestinations error", err);
      setError(
        err?.message || "Sorry, the AI comparison could not run right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setDestinationsText("");
    setMonth("");
    setDays(7);
    setHome("");
    setError(null);
    setComparisons(null); // hide cards
  }

  return (
    <section
      style={{
        marginTop: 28,
        borderRadius: 20,
        padding: 22,
        background: "#020617",
        border: "1px solid #1f2937",
        boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
        color: "#e5e7eb",
      }}
    >
      <h2
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        Compare destinations with AI 🌍
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "#cbd5f5",
          marginBottom: 14,
          maxWidth: 900,
        }}
      >
        Drop in a few places you&apos;re considering and we&apos;ll compare
        typical cost, weather, hotels, family-friendliness, safety and more.
        Prices are shown in{" "}
        <strong>{currency || "your selected currency"}</strong>.
      </p>

      {/* Form row */}
      <form
        onSubmit={handleCompare}
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div>
          <label
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              display: "block",
              color: "#e5e7eb",
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
              borderRadius: 10,
              border: "1px solid #334155",
              padding: "10px 12px",
              fontSize: 15,
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              display: "block",
              color: "#e5e7eb",
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
              borderRadius: 10,
              border: "1px solid #334155",
              padding: "10px 12px",
              fontSize: 15,
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              display: "block",
              color: "#e5e7eb",
            }}
          >
            Trip length (days)
          </label>
          <input
            type="number"
            min={2}
            max={60}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value || "7", 10))}
            style={{
              width: "100%",
              borderRadius: 10,
              border: "1px solid #334155",
              padding: "10px 12px",
              fontSize: 15,
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              display: "block",
              color: "#e5e7eb",
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
              borderRadius: 10,
              border: "1px solid #334155",
              padding: "10px 12px",
              fontSize: 15,
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>

        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <button
            type="submit"
            disabled={loading}
            style={{
              alignSelf: "flex-end",
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg,#38bdf8,#6366f1,#ec4899)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(59,130,246,0.65)",
              whiteSpace: "nowrap",
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? "Comparing…" : "Compare destinations"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              alignSelf: "flex-end",
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            background: "#7f1d1d",
            borderRadius: 12,
            padding: 8,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {comparisons && comparisons.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            marginTop: 4,
          }}
        >
          {comparisons.map((c, idx) => {
            const name =
              c.name ||
              c.city ||
              c.destination ||
              `Destination ${idx + 1}`;

            const bestFor =
              c.best_for ||
              c.tagline ||
              c.highlight ||
              "Great trip option";

            const costLevel =
              c.approx_cost_level ||
              c.cost ||
              c.cost_level ||
              "Unknown cost";

            const pros = list(c.pros);
            const cons = list(c.cons);

            const weatherBest = str(
              c.weather_best_time ?? c.weather ?? c.weather_summary
            );
            const approxCost = str(
              c.approximate_cost ?? c.approx_cost ?? c.cost_summary
            );
            const dailyBudget = str(
              c.typical_daily_budget ?? c.daily_budget
            );
            const rawCurrency = str(
              c.currency ?? c.currency_code ?? c.currency_name
            );
            const displayCurrency = currency || rawCurrency || "";

            const dining = str(
              c.dining_and_local_eats ??
                c.dining_local ??
                c.food_scene ??
                c.food
            );
            const areasToStay = str(
              c.areas_to_stay ?? c.neighborhoods ?? c.stay_areas
            );
            const nightlife = str(
              c.entertainment_and_nightlife ??
                c.nightlife ??
                c.evening_scene
            );
            const family = str(
              c.family_friendly ??
                c.family_friendliness ??
                c.family_summary
            );
            const kids = str(
              c.activities_for_kids ?? c.kids_activities ?? c.kid_friendly
            );
            const safety = str(
              c.safety_tips ?? c.safety ?? c.safety_summary
            );

            const airports: any[] = Array.isArray(c.airports)
              ? c.airports
              : [];

            const makeLink = (q: string) =>
              `https://www.google.com/search?q=${encodeURIComponent(
                q
              )}`;

            return (
              <div
                key={idx}
                style={{
                  borderRadius: 18,
                  background: "#020617",
                  border: "1px solid #1e293b",
                  padding: 14,
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {name}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#0369a1",
                        padding: "4px 8px",
                        borderRadius: 999,
                        marginBottom: 4,
                      }}
                    >
                      {bestFor}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#111827",
                        padding: "4px 8px",
                        borderRadius: 999,
                        textAlign: "right",
                      }}
                    >
                      {costLevel}
                    </span>
                  </div>
                </div>

                {/* Pros / cons */}
                {(pros.length > 0 || cons.length > 0) && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    {pros.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 4,
                            color: "#4ade80",
                          }}
                        >
                          ✅ Pros
                        </div>
                        <ul
                          style={{
                            listStyle: "disc",
                            paddingLeft: 16,
                            fontSize: 13,
                            color: "#e5e7eb",
                          }}
                        >
                          {pros.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cons.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 4,
                            color: "#facc15",
                          }}
                        >
                          ⚠️ Cons
                        </div>
                        <ul
                          style={{
                            listStyle: "disc",
                            paddingLeft: 16,
                            fontSize: 13,
                            color: "#fee2e2",
                          }}
                        >
                          {cons.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Info blocks */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  {weatherBest && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        WEATHER &amp; BEST TIME
                      </div>
                      <div>{weatherBest}</div>
                    </div>
                  )}

                  {(approxCost || dailyBudget || displayCurrency) && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        APPROXIMATE COST{" "}
                        {displayCurrency
                          ? `(in ${displayCurrency})`
                          : ""}
                      </div>
                      {approxCost && <div>{approxCost}</div>}
                      {dailyBudget && (
                        <div>
                          <strong>Typical daily budget:</strong>{" "}
                          {dailyBudget}
                        </div>
                      )}
                      {displayCurrency && (
                        <div>
                          <strong>Currency:</strong> {displayCurrency}
                        </div>
                      )}
                    </div>
                  )}

                  {dining && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        DINING &amp; LOCAL EATS
                      </div>
                      <div>{dining}</div>
                    </div>
                  )}

                  {areasToStay && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        AREAS &amp; PLACES TO STAY
                      </div>
                      <div>{areasToStay}</div>
                    </div>
                  )}

                  {nightlife && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        ENTERTAINMENT &amp; NIGHTLIFE
                      </div>
                      <div>{nightlife}</div>
                    </div>
                  )}

                  {family && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        FAMILY-FRIENDLY
                      </div>
                      <div>{family}</div>
                    </div>
                  )}

                  {kids && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        ACTIVITIES FOR KIDS
                      </div>
                      <div>{kids}</div>
                    </div>
                  )}

                  {safety && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                        }}
                      >
                        SAFETY TIPS
                      </div>
                      <div>{safety}</div>
                    </div>
                  )}

                  {airports.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          letterSpacing: 0.03,
                          fontSize: 12,
                          color: "#a5b4fc",
                          marginBottom: 4,
                        }}
                      >
                        AIRPORTS
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {airports.map((a, i) => {
                          const code = a.code || a.iata || "";
                          const label =
                            a.label ||
                            a.name ||
                            a.description ||
                            code ||
                            `Option ${i + 1}`;
                          const query = code
                            ? `${code} airport`
                            : `${name} airport`;
                          return (
                            <a
                              key={i}
                              href={makeLink(query)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 12,
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: "1px solid #334155",
                                display: "inline-block",
                                textDecoration: "none",
                                color: "#e5e7eb",
                                background: "#0b1120",
                              }}
                            >
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick links */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                    fontSize: 12,
                  }}
                >
                  <a
                    href={makeLink(`${name} things to do`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#1d4ed8",
                      color: "#e5e7eb",
                      textDecoration: "none",
                    }}
                  >
                    💡 Things to do
                  </a>
                  <a
                    href={makeLink(`${name} hotels`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#047857",
                      color: "#e5e7eb",
                      textDecoration: "none",
                    }}
                  >
                    🏨 Hotels
                  </a>
                  <a
                    href={makeLink(`${name} reviews`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#7c3aed",
                      color: "#e5e7eb",
                      textDecoration: "none",
                    }}
                  >
                    ⭐ Reviews
                  </a>
                  <a
                    href={makeLink(`${name} safety travel advice`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#b91c1c",
                      color: "#fee2e2",
                      textDecoration: "none",
                    }}
                  >
                    🛟 Safety info
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
