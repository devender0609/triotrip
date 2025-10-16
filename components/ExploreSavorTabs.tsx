"use client";

import React, { useState } from "react";
import SavorExploreLinks from "./SavorExploreLinks";

type Props = {
  /** Destination city name, e.g., "Paris" */
  city: string;
  /** Destination country code (ISO-like, if you have it). Safe to pass empty string. */
  countryCode?: string;
  /** Destination country name, e.g., "France" */
  countryName?: string;
  /** If false, component renders nothing (used when tabs must appear only after search). */
  showTabs?: boolean;
};

export default function ExploreSavorTabs({
  city,
  countryCode = "",
  countryName = "",
  showTabs = false,
}: Props) {
  // Toggle sections open/close on click
  const [open, setOpen] = useState<"explore" | "savor" | "misc" | null>(null);

  if (!showTabs || !city) return null;

  const Tab = ({
    id,
    label,
    active,
    onClick,
  }: {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className={`tab ${active ? "tab--active" : ""}`}
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: active ? "1px solid #93c5fd" : "1px solid #e2e8f0",
        background: active
          ? "linear-gradient(180deg,#ffffff,#eef6ff)"
          : "#fff",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="tablist">
        <Tab
          id="explore"
          label="🌍 Explore"
          active={open === "explore"}
          onClick={() => setOpen((v) => (v === "explore" ? null : "explore"))}
        />
        <Tab
          id="savor"
          label="🍽️ Savor"
          active={open === "savor"}
          onClick={() => setOpen((v) => (v === "savor" ? null : "savor"))}
        />
        <Tab
          id="misc"
          label="🧭 Miscellaneous"
          active={open === "misc"}
          onClick={() => setOpen((v) => (v === "misc" ? null : "misc"))}
        />
      </div>

      {/* Panels (row-wise fancy sections) */}
      {open === "explore" && (
        <div className="places-panel">
          <h3 className="subtle-h">🌍 Explore — {city}</h3>
          <div className="places-grid">
            <SavorExploreLinks
              category="explore"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Top sights"
              query="top attractions"
            />
            <SavorExploreLinks
              category="explore"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Parks & views"
              query="parks scenic views"
            />
            <SavorExploreLinks
              category="explore"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Museums"
              query="museums"
            />
            <SavorExploreLinks
              category="explore"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Family"
              query="family activities"
            />
            <SavorExploreLinks
              category="explore"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Nightlife"
              query="nightlife bars"
            />
            <SavorExploreLinks
              category="explore"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Guides"
              query="city guide"
            />
          </div>
        </div>
      )}

      {open === "savor" && (
        <div className="places-panel">
          <h3 className="subtle-h">🍽️ Savor — {city}</h3>
          <div className="places-grid">
            <SavorExploreLinks
              category="savor"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Best restaurants"
              query="best restaurants"
            />
            <SavorExploreLinks
              category="savor"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Local eats"
              query="local food"
            />
            <SavorExploreLinks
              category="savor"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Cafés & coffee"
              query="cafes coffee"
            />
            <SavorExploreLinks
              category="savor"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Street food"
              query="street food"
            />
            <SavorExploreLinks
              category="savor"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Desserts"
              query="desserts"
            />
          </div>
        </div>
      )}

      {open === "misc" && (
        <div className="places-panel">
          <h3 className="subtle-h">🧭 Miscellaneous — {city}</h3>
          <div className="places-grid">
            <SavorExploreLinks
              category="misc"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Know before you go"
              query="travel advice"
            />
            <SavorExploreLinks
              category="misc"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Weather"
              query="weather"
            />
            <SavorExploreLinks
              category="misc"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Pharmacies"
              query="pharmacies"
            />
            <SavorExploreLinks
              category="misc"
              countryCode={countryCode}
              countryName={countryName}
              city={city}
              limit={6}
              title="Car rental"
              query="car rental"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .places-panel { border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px; background: #fff; }
        .subtle-h { font-weight: 900; margin: 0 0 10px; color: #0f172a; }
        .places-grid {
          display: grid; gap: 12px;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }
        .place-card {
          border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px;
          background: linear-gradient(180deg,#ffffff,#f9fbff);
        }
        .place-title { font-weight: 800; margin-bottom: 6px; }
        .place-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .place-link {
          display: inline-block; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 10px;
          text-decoration: none; background: #fff; font-weight: 700;
        }
        .tab--active { outline: 2px solid #93c5fd; }
      `}</style>
    </section>
  );
}
