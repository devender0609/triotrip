// components/AiTripPlanner.tsx
"use client";

import { useState } from "react";
import { aiPlanTrip } from "@/lib/api";
import ResultCard from "./ResultCard";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type Top3Item = {
  title?: string;
  reason?: string;
};

type PlanningPayload = {
  top3?: {
    best_overall?: Top3Item;
    best_budget?: Top3Item;
    best_comfort?: Top3Item;
  };
  itinerary?: any[];
};

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [packages, setPackages] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!AI_ENABLED) {
    return (
      <section style={{ padding: 16 }}>
        <h2>AI Planner unavailable</h2>
        <p>You can still use the manual search below.</p>
      </section>
    );
  }

  // ---------- TOP 3 ----------
  const Top3 = ({ planning }: { planning: PlanningPayload }) => {
    const t = planning.top3;
    if (!t) return null;

    const defs: { key: keyof PlanningPayload["top3"]; label: string }[] = [
      { key: "best_overall", label: "🥇 Best overall" },
      { key: "best_budget", label: "💸 Best budget" },
      { key: "best_comfort", label: "😌 Most comfortable" },
    ];

    const items = defs
      .map((def) => {
        const value = t[def.key];
        if (!value || (!value.title && !value.reason)) return null;
        return { ...def, value };
      })
      .filter(Boolean) as { key: any; label: string; value: Top3Item }[];

    if (items.length === 0) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>🏆 Top 3 Options</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {items.map(({ key, label, value }) => (
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
              {value.reason && (
                <p style={{ color: "#94a3b8", fontSize: 14 }}>{value.reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- ITINERARY ----------
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
            dateLabel = new Date(rawDay).toLocaleDateString();
          }

          if (typeof rawDate === "string" && rawDate.trim()) {
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

  // ---------- REAL RESULTS USING ResultCard ----------
  const RealOptions = () => {
    if (!packages || packages.length === 0) return null;

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

    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>
          ✈ Real flight options (same as manual search)
        </h3>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {packages.slice(0, 3).map((pkg, i) => (
            <ResultCard
              key={pkg.id || i}
              pkg={pkg}
              index={i}
              currency={currency}
              pax={pax}
              showHotel={includeHotel}
              hotelNights={nights}
              showAllHotels={false}
              comparedIds={[]}
              onToggleCompare={() => {}}
              onSavedChangeGlobal={() => {}}
            />
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
      setPlanning(null);
      setPackages(null);
      setSearchParams(null);

      const data: any = await aiPlanTrip(query);

      if (!data?.ok) {
        setError("AI planner failed. Please try again or be more specific.");
        return;
      }

      setPlanning(data.planning || null);
      setPackages(data.searchResult?.results || null);
      setSearchParams(data.searchParams || null);
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
        Tell us your trip idea in one sentence. We&apos;ll interpret it,
        generate an itinerary, and show real flight options using the same data
        as manual search.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days from Austin to Las Vegas, Jan 10–15 2026, mid-budget, nightlife and shows."
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

      {planning && (
        <>
          <Top3 planning={planning} />
          <RealOptions />
          <Itinerary itinerary={planning.itinerary ?? []} />
        </>
      )}
    </section>
  );
}
