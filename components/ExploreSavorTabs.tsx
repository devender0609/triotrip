// components/ExploreSavorTabs.tsx
"use client";
import React from "react";
import SavorExploreLinks from "@/components/SavorExploreLinks";

/**
 * Explore/Savor tabs that:
 *  - appear ONLY after a search (hasSearched === true)
 *  - toggle open/closed on click (show ↔ hide)
 *  - render content lazily (no render until opened)
 */
export default function ExploreSavorTabs({
  hasSearched,
  countryCode,
  countryName,
  city,
  defaultOpen = { explore: false, savor: false },
}: {
  hasSearched: boolean;
  countryCode?: string;   // ISO alpha-2 preferred (e.g., "JP")
  countryName?: string;   // optional if you don’t have code
  city?: string;
  defaultOpen?: { explore?: boolean; savor?: boolean };
}) {
  // show/hide states
  const [showExplore, setShowExplore] = React.useState<boolean>(!!defaultOpen.explore);
  const [showSavor, setShowSavor] = React.useState<boolean>(!!defaultOpen.savor);

  // If no search yet, hide the whole section (tabs + content)
  if (!hasSearched) return null;

  // a11y labels
  const explorePressed = showExplore ? "true" : "false";
  const savorPressed = showSavor ? "true" : "false";

  return (
    <section
      aria-label="Explore and Savor"
      style={{ display: "grid", gap: 10, marginTop: 8 }}
    >
      {/* TABS */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setShowExplore((v) => !v)}
          aria-pressed={explorePressed}
          aria-controls="explore-panel"
          style={{
            border: "1px solid #94a3b8",
            background: showExplore ? "#e0f2fe" : "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          title={showExplore ? "Hide Explore" : "Show Explore"}
        >
          <span role="img" aria-label="compass">🧭</span>
          Explore {showExplore ? "▾" : "▸"}
        </button>

        <button
          type="button"
          onClick={() => setShowSavor((v) => !v)}
          aria-pressed={savorPressed}
          aria-controls="savor-panel"
          style={{
            border: "1px solid #94a3b8",
            background: showSavor ? "#ffe4e6" : "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
          title={showSavor ? "Hide Savor" : "Show Savor"}
        >
          <span role="img" aria-label="fork and knife">🍽️</span>
          Savor {showSavor ? "▾" : "▸"}
        </button>
      </div>

      {/* PANELS (lazy render: only mount when open) */}
      {showExplore && (
        <div
          id="explore-panel"
          role="region"
          aria-label="Explore links"
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
          }}
        >
          <SavorExploreLinks
            category="explore"
            countryCode={countryCode}
            countryName={countryName}
            city={city}
            limit={4}
            title="Explore"
          />
        </div>
      )}

      {showSavor && (
        <div
          id="savor-panel"
          role="region"
          aria-label="Savor links"
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
          }}
        >
          <SavorExploreLinks
            category="savor"
            countryCode={countryCode}
            countryName={countryName}
            city={city}
            when={new Date().toISOString()}
            limit={4}
            title="Savor"
          />
        </div>
      )}
    </section>
  );
}
