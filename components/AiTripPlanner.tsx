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

function nightsBetween(a?: string, b?: string) {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (!Number.isFinite(A) || !Number.isFinite(B)) return 0;
  return Math.max(0, Math.round((B - A) / 86400000));
}

// Build a simple Google Flights link using search parameters + first flight
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

  // Very simple but effective deep link
  const qParts = [
    "Flights",
    "from",
    origin,
    "to",
    destination,
    "on",
    d1,
  ];
  if (d2) {
    qParts.push("through", d2);
  }
  qParts.push("for", `${pax}`, "travellers");

  const q = encodeURIComponent(qParts.join(" "));
  return `https://www.google.com/travel/flights?q=${q}`;
}

export function AiTripPlanner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<PlanningPayload | null>(null);
  const [packages, setPackages] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optionsView, setOptionsView] = useState<"top3" | "all">("top3");

  if (!AI_ENABLED) {
    return (
      <section style={{ padding: 16 }}>
        <h2>AI Planner unavailable</h2>
        <p>You can still use the manual search below.</p>
      </section>
    );
  }

  // ---------- TOP 3 (compressed layout) ----------
  const Top3 = ({ planning }: { planning: PlanningPayload }) => {
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

    if (items.length === 0) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>🏆 Top 3 options</h3>
        </div>
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
        >
          {items.map(({ key, label, value }) => (
            <div
              key={key}
              style={{
                background: "#020617",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #1e293b",
                fontSize: 12,
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{label}</div>
              {value.title && (
                <div style={{ fontWeight: 600, fontSize: 13 }}>{value.title}</div>
              )}
              {value.reason && (
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.3 }}>
                  {value.reason}
                </div>
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
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>📅 Suggested itinerary</h3>
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
                padding: 14,
                borderRadius: 12,
                border: "1px solid #1e293b",
              }}
            >
              <h4 style={{ fontSize: 14, marginBottom: 6 }}>🗓 {header}</h4>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {(day.activities || []).map((act: string, i: number) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------- HOTEL OPTIONS (AI–generated, city-relevant) ----------
  const HotelOptions = ({ hotels }: { hotels?: HotelOption[] }) => {
    if (!hotels || hotels.length === 0) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>🏨 Hotel suggestions (AI)</h3>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {hotels.map((h, i) => (
            <div
              key={i}
              style={{
                background: "#020617",
                borderRadius: 12,
                border: "1px solid #1e293b",
                padding: 10,
                fontSize: 12,
                display: "grid",
                gap: 2,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{h.name}</div>
              {h.area && <div style={{ opacity: 0.9 }}>{h.area}</div>}
              {(typeof h.approx_price_per_night === "number" || h.currency) && (
                <div style={{ opacity: 0.9 }}>
                  ~{h.currency || "USD"}{" "}
                  {typeof h.approx_price_per_night === "number"
                    ? Math.round(h.approx_price_per_night)
                    : ""}{" "}
                  per night
                </div>
              )}
              {h.vibe && (
                <div>
                  <strong>Vibe:</strong> {h.vibe}
                </div>
              )}
              {h.why && (
                <div>
                  <strong>Why:</strong> {h.why}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- FLIGHT OPTIONS USING ResultCard + tabs ----------
  const FlightOptions = () => {
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

    const visiblePkgs =
      optionsView === "top3" ? packages.slice(0, 3) : packages;

    return (
      <div style={{ marginTop: 16 }}>
        {/* Tabs row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>✈ Flight options</h3>
          <div
            style={{
              display: "inline-flex",
              background: "#020617",
              borderRadius: 999,
              padding: 2,
              border: "1px solid #1e293b",
              fontSize: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setOptionsView("top3")}
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                border: "none",
                cursor: "pointer",
                background:
                  optionsView === "top3" ? "#38bdf8" : "transparent",
                color: optionsView === "top3" ? "#0f172a" : "#e2e8f0",
                fontWeight: 600,
              }}
            >
              Top 3 options
            </button>
            <button
              type="button"
              onClick={() => setOptionsView("all")}
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                border: "none",
                cursor: "pointer",
                background:
                  optionsView === "all" ? "#38bdf8" : "transparent",
                color: optionsView === "all" ? "#0f172a" : "#e2e8f0",
                fontWeight: 600,
              }}
            >
              All options
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {visiblePkgs.map((pkg, i) => {
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
                comparedIds={[]}
                onToggleCompare={() => {}}
                onSavedChangeGlobal={() => {}}
                hideActions={true} // hide Save / Compare in AI section
                bookUrl={bookUrl}
              />
            );
          })}
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
      setOptionsView("top3");

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
      <p style={{ opacity: 0.8, marginBottom: 4, fontSize: 14 }}>
        Describe your trip in one sentence. We&apos;ll interpret it, suggest an
        itinerary, recommend hotels, and show real flight options you can book.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: 5 days from Austin to Las Vegas, Jan 10–15 2026, mid-budget, shows and nightlife."
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
          {loading ? "Thinking…" : "Generate AI trip"}
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
          <FlightOptions />
          <HotelOptions hotels={planning.hotels} />
          <Itinerary itinerary={planning.itinerary ?? []} />
        </>
      )}
    </section>
  );
}
