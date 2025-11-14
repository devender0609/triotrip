"use client";

import React, { useState } from "react";
import ResultCard from "./ResultCard";

type ListTab = "top3" | "all";

export function AiTripPlanner() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // full search result from /api/ai/plan-trip
  const [results, setResults] = useState<any[] | null>(null);
  const [aiTop3, setAiTop3] = useState<any | null>(null);
  const [itinerary, setItinerary] = useState<any[] | null>(null);

  // view state
  const [listTab, setListTab] = useState<ListTab>("top3");

  const totalPax = 1;        // for now – we can parse this from prompt later
  const currency = "USD";    // same as manual default
  const includeHotel = true; // AI bundles always talk about hotels for now

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setAiTop3(null);
    setItinerary(null);

    try {
      const res = await fetch("/api/ai/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "AI planner failed.");
      }

      const json = await res.json();
      // shape: { ok, searchResult, top3, itinerary }
      const pkgs = json?.searchResult?.results || [];
      setResults(pkgs);
      setAiTop3(json?.top3 || null);
      setItinerary(json?.itinerary || null);
      setListTab("top3");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Sorry, we couldn’t generate this trip. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const shown =
    results && results.length > 0
      ? listTab === "top3"
        ? results.slice(0, 3)
        : results
      : [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Intro text + prompt box */}
      <div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          Plan my trip with AI ✈️
        </h2>
        <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
          Describe your trip in one sentence. We&apos;ll infer dates, cities,
          cabin, and travellers, then show flights and hotel ideas in the same
          clean layout as your manual search.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder='Example: "5 days from Austin to Las Vegas in November, flight + nice hotel, budget-friendly but fun."'
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #CBD5E1",
              padding: 10,
              resize: "vertical",
              fontSize: 14,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: 999,
              padding: "10px 16px",
              border: "none",
              background:
                "linear-gradient(90deg, #0ea5e9, #6366f1, #ec4899)",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading ? "Planning your trip…" : "Generate AI trip"}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#7f1d1d",
            padding: 10,
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Only show results if we have flights */}
      {results && results.length > 0 && (
        <>
          {/* AI Top 3 summary – short and compact */}
          {aiTop3 && (
            <div
              style={{
                background: "#0f172a",
                color: "white",
                borderRadius: 16,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                ✨ AI Top 3 Picks
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                {["best_overall", "best_budget", "best_comfort"].map((key) => {
                  const info = (aiTop3 as any)[key];
                  if (!info?.id) return null;
                  const pkg = results.find(
                    (r: any) => String(r.id) === String(info.id)
                  );
                  if (!pkg) return null;

                  const title =
                    key === "best_overall"
                      ? "Best overall"
                      : key === "best_budget"
                      ? "Best budget"
                      : "Most comfortable";

                  const destText =
                    pkg.destination ||
                    pkg.destinationName ||
                    "This option";

                  return (
                    <div
                      key={key}
                      style={{
                        background: "#020617",
                        borderRadius: 14,
                        padding: 10,
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 4,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: 0.04,
                          color: "#fbbf24",
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ fontWeight: 600 }}>{destText}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        {info.reason || "Chosen by AI based on your prompt."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flights heading + view toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span role="img" aria-label="flight">
                ✈️
              </span>
              <span>Flight options</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className={`chip ${listTab === "top3" ? "on" : ""}`}
                onClick={() => setListTab("top3")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border:
                    listTab === "top3"
                      ? "1px solid #0ea5e9"
                      : "1px solid #E2E8F0",
                  background:
                    listTab === "top3" ? "#0ea5e9" : "white",
                  color: listTab === "top3" ? "white" : "#0f172a",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Top 3 options
              </button>
              <button
                type="button"
                onClick={() => setListTab("all")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border:
                    listTab === "all"
                      ? "1px solid #0ea5e9"
                      : "1px solid #E2E8F0",
                  background:
                    listTab === "all" ? "#0ea5e9" : "white",
                  color: listTab === "all" ? "white" : "#0f172a",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                All options
              </button>
            </div>
          </div>

          {/* Flight cards – EXACT same component as manual search */}
          {shown.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {shown.map((pkg: any, i: number) => (
                <ResultCard
                  key={pkg.id || i}
                  pkg={pkg}
                  index={i}
                  currency={currency}
                  pax={totalPax}
                  showHotel={includeHotel}
                  hotelNights={
                    includeHotel ? pkg.hotelNights ?? 0 : 0
                  }
                  showAllHotels={listTab === "all"}
                  comparedIds={[]} // no compare panel in AI view (for now)
                  onToggleCompare={() => {}}
                  onSavedChangeGlobal={() => {}}
                  hideActions={false}
                  bookUrl={pkg.bookUrl}
                />
              ))}
            </div>
          )}

          {/* Hotel suggestion strip (AI only, small and neat) */}
          {itinerary && itinerary.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span role="img" aria-label="hotel">
                  🏨
                </span>
                <span>Suggested itinerary</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(200px, 1fr))",
                }}
              >
                {itinerary.map((day: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 16,
                      background: "#0f172a",
                      color: "white",
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: 4,
                        fontSize: 13,
                      }}
                    >
                      {day.title || `Day ${idx + 1}`}
                    </div>
                    <div style={{ whiteSpace: "pre-line" }}>
                      {day.description || ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
