"use client";

import React, { useState } from "react";
import ResultCard from "./ResultCard";
import { aiPlanTrip } from "@/lib/api";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type Top3Item = {
  title?: string;
  reason?: string;
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
  hotels?: HotelOption[];
};

type OptionsView = "top3" | "all";

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

function buildGoogleFlightsUrl(pkg: any, searchParams: any | null): string | undefined {
  if (!searchParams) return undefined;

  const origin = searchParams.origin;
  const destination = searchParams.destination;
  const departDate = searchParams.departDate;
  const returnDate = searchParams.returnDate;

  if (!origin || !destination || !departDate) return undefined;

  const d1 = departDate;
  const d2 = returnDate || "";
  const pax =
    (searchParams.passengersAdults || 1) +
    (searchParams.passengersChildren || 0) +
    (searchParams.passengersInfants || 0);

  const parts = ["Flights", "from", origin, "to", destination, "on", d1];
  if (d2) parts.push("through", d2);
  parts.push("for", `${pax}`, "travellers");

  const q = encodeURIComponent(parts.join(" "));
  return `https://www.google.com/travel/flights?q=${q}`;
}

// simple inline styles to match app/page.tsx vibe
const sSection: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const sTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 4,
};

const sSubtitle: React.CSSProperties = {
  fontSize: 13,
  color: "#475569",
  marginBottom: 12,
};

const sTextarea: React.CSSProperties = {
  width: "100%",
  minHeight: 70,
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  padding: "8px 10px",
  fontSize: 13,
  resize: "vertical",
};

const sButtonPrimary: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  color: "white",
  border: "none",
  cursor: "pointer",
  background:
    "linear-gradient(90deg, #38bdf8, #6366f1, #ec4899)",
};

const sTagStrip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  border: "1px solid #cbd5f5",
  background: "white",
};

const sTop3Grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
  marginTop: 8,
};

const sTop3Card: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "white",
  padding: 10,
  fontSize: 12,
};

const sFlightHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 18,
  marginBottom: 6,
};

const sToggleWrap: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  border: "1px solid #cbd5f5",
  overflow: "hidden",
};

const sToggleBtnBase: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 10px",
  border: "none",
  cursor: "pointer",
  background: "transparent",
};

const sResultsGrid: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 4,
};

const sSectionTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 15,
  fontWeight: 600,
};

const sEmoji: React.CSSProperties = { fontSize: 16 };

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<OptionsView>("top3");

  if (!AI_ENABLED) return null;

  const Top3Strip = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs: { key: keyof PlanningPayload["top3"]; label: string }[] = [
      { key: "best_overall", label: "Best overall" },
      { key: "best_budget", label: "Best budget" },
      { key: "best_comfort", label: "Most comfortable" },
    ];

    const items = defs
      .map((def) => {
        const value = t[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { ...def, value };
      })
      .filter(Boolean) as { key: any; label: string; value: Top3Item }[];

    if (!items.length) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <div style={sSectionTitleRow}>
          <span style={sEmoji}>🏆</span>
          <span>Top 3 options</span>
        </div>
        <div style={sTop3Grid}>
          {items.map(({ key, label, value }) => (
            <div key={key} style={sTop3Card}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                {label}
              </div>
              {value.title && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  {value.title}
                </div>
              )}
              {value.reason && (
                <div style={{ color: "#64748b", lineHeight: 1.4 }}>
                  {value.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FlightOptions = () => {
    if (!results || !results.length) return null;

    const currency = searchParams?.currency || "USD";
    const pax =
      (searchParams?.passengersAdults || 1) +
      (searchParams?.passengersChildren || 0) +
      (searchParams?.passengersInfants || 0);
    const includeHotel = !!searchParams?.includeHotel;
    const nights =
      includeHotel && searchParams?.departDate && searchParams?.returnDate
        ? nightsBetween(searchParams.departDate, searchParams.returnDate)
        : 0;
    const visible = optionsView === "top3" ? results.slice(0, 3) : results;

    return (
      <>
        <div style={sFlightHeader}>
          <div style={sSectionTitleRow}>
            <span style={sEmoji}>✈</span>
            <span>Flight options</span>
          </div>
          <div style={sToggleWrap}>
            <button
              type="button"
              style={{
                ...sToggleBtnBase,
                background:
                  optionsView === "top3" ? "#38bdf8" : "transparent",
                color: optionsView === "top3" ? "white" : "#0f172a",
              }}
              onClick={() => setOptionsView("top3")}
            >
              Top 3 options
            </button>
            <button
              type="button"
              style={{
                ...sToggleBtnBase,
                background:
                  optionsView === "all" ? "#38bdf8" : "transparent",
                color: optionsView === "all" ? "white" : "#0f172a",
              }}
              onClick={() => setOptionsView("all")}
            >
              All options
            </button>
          </div>
        </div>

        <div style={sResultsGrid}>
          {visible.map((pkg, i) => {
            const bookUrl = buildGoogleFlightsUrl(pkg, searchParams);
            return (
              <ResultCard
                key={pkg.id || i}
                pkg={pkg}
                index={i}
                currency={currency}
                pax={pax}
                showHotel={includeHotel}
                hotelNights={nights}
                showAllHotels={false}
                comparedIds={[]} // no compare in AI section
                onToggleCompare={() => {}}
                onSavedChangeGlobal={() => {}}
                hideActions={true}
                bookUrl={bookUrl}
              />
            );
          })}
        </div>
      </>
    );
  };

  const HotelSuggestions = ({ hotels }: { hotels?: HotelOption[] }) => {
    if (!hotels || !hotels.length) return null;

    return (
      <div style={{ marginTop: 18 }}>
        <div style={sSectionTitleRow}>
          <span style={sEmoji}>🏨</span>
          <span>Hotel suggestions (AI)</span>
        </div>
        <div style={sTop3Grid}>
          {hotels.map((h, i) => (
            <div key={i} style={sTop3Card}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</div>
              {h.area && (
                <div style={{ fontSize: 12, color: "#475569" }}>
                  <b>Area:</b> {h.area}
                </div>
              )}
              {(typeof h.approx_price_per_night === "number" || h.currency) && (
                <div style={{ fontSize: 12, color: "#475569" }}>
                  <b>Approx:</b> {h.currency || "USD"}{" "}
                  {typeof h.approx_price_per_night === "number"
                    ? Math.round(h.approx_price_per_night)
                    : ""}{" "}
                  / night
                </div>
              )}
              {h.vibe && (
                <div style={{ fontSize: 12, color: "#475569" }}>
                  <b>Vibe:</b> {h.vibe}
                </div>
              )}
              {h.why && (
                <div style={{ fontSize: 12, color: "#475569" }}>
                  <b>Why:</b> {h.why}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Itinerary = ({ itinerary }: { itinerary: any[] }) => {
    if (!itinerary || !itinerary.length) return null;

    return (
      <div style={{ marginTop: 18 }}>
        <div style={sSectionTitleRow}>
          <span style={sEmoji}>📅</span>
          <span>Suggested itinerary</span>
        </div>
        <div style={sTop3Grid}>
          {itinerary.map((day, idx) => {
            const rawDay = day.day;
            const rawDate = day.date;

            let dayLabel = "";
            let dateLabel = "";

            if (typeof rawDay === "number") dayLabel = `Day ${rawDay}`;
            if (typeof rawDate === "string" && rawDate.trim()) {
              dateLabel = new Date(rawDate).toLocaleDateString();
            }

            if (!dayLabel) dayLabel = `Day ${idx + 1}`;
            const header = dateLabel ? `${dayLabel} — ${dateLabel}` : dayLabel;

            return (
              <div key={idx} style={sTop3Card}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {header}
                </div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {(day.activities || []).map((a: string, i: number) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setPlanning(null);
      setResults(null);
      setSearchParams(null);
      setOptionsView("top3");

      const data: any = await aiPlanTrip(query);
      if (!data?.ok) {
        setError("AI planner failed. Please try again or be more specific.");
        return;
      }

      setPlanning(data.planning || null);
      setResults(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
    } catch (err: any) {
      setError(err.message || "Something went wrong with AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={sSection}>
      <h2 style={sTitle}>Plan my trip with AI ✈️</h2>
      <p style={sSubtitle}>
        Describe your trip in one sentence. We&apos;ll infer dates, cities,
        cabin, and travellers, then show flights and hotel ideas in the same
        clean layout as your manual search.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          style={sTextarea}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days New Delhi to Mumbai, flight Jan 2–6 2026, budget-friendly hotels, entertainment."
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            ...sButtonPrimary,
            opacity: loading || !query.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Thinking…" : "Generate AI trip"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>
          ❌ {error}
        </div>
      )}

      {planning && (
        <>
          <Top3Strip planning={planning} />
          <FlightOptions />
          <HotelSuggestions hotels={planning.hotels} />
          <Itinerary itinerary={planning.itinerary ?? []} />
        </>
      )}
    </section>
  );
}

export default AiTripPlanner;
