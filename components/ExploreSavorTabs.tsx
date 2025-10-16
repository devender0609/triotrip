"use client";

import React from "react";
import SavorExploreLinks from "./SavorExploreLinks";

type Mode = "explore" | "savor" | "misc";

type Props = {
  destinationCity: string;
  destinationCountry?: string;
  showTabs: boolean;
  /** which of the three to show (this component is rendered per tab) */
  mode: Mode;
};

export default function ExploreSavorTabs({
  destinationCity,
  destinationCountry = "",
  showTabs,
  mode,
}: Props) {
  if (!showTabs) return null;
  const city = destinationCity || "Destination";
  const country = destinationCountry || "";

  return (
    <section className="places-panel" aria-label={`${mode} ${city}`}>
      {mode === "explore" && (
        <>
          <div className="subtle-h">🌍 Explore — {city}</div>
          <div className="places-grid">
            <SavorExploreLinks category="explore" city={city} countryName={country} limit={4} title="Top sights" query="top sights" />
            <SavorExploreLinks category="explore" city={city} countryName={country} limit={3} title="Parks & views" query="parks views" />
            <SavorExploreLinks category="explore" city={city} countryName={country} limit={3} title="Museums" query="museums" />
            <SavorExploreLinks category="explore" city={city} countryName={country} limit={3} title="Family" query="family activities" />
            <SavorExploreLinks category="explore" city={city} countryName={country} limit={3} title="Nightlife" query="nightlife" />
            <SavorExploreLinks category="explore" city={city} countryName={country} limit={2} title="Guides" query="city guide" />
          </div>
        </>
      )}

      {mode === "savor" && (
        <>
          <div className="subtle-h">🍽️ Savor — {city}</div>
          <div className="places-grid">
            <SavorExploreLinks category="savor" city={city} countryName={country} limit={4} title="Best restaurants" query="best restaurants" />
            <SavorExploreLinks category="savor" city={city} countryName={country} limit={3} title="Local eats" query="local food" />
            <SavorExploreLinks category="savor" city={city} countryName={country} limit={3} title="Cafés & coffee" query="coffee" />
            <SavorExploreLinks category="savor" city={city} countryName={country} limit={3} title="Street food" query="street food" />
            <SavorExploreLinks category="savor" city={city} countryName={country} limit={3} title="Desserts" query="desserts" />
          </div>
        </>
      )}

      {mode === "misc" && (
        <>
          <div className="subtle-h">🧭 Miscellaneous — {city}</div>
          <div className="places-grid">
            <SavorExploreLinks category="misc" city={city} countryName={country} limit={4} title="Know before you go" query="know before you go" />
            <SavorExploreLinks category="misc" city={city} countryName={country} limit={2} title="Weather" query="weather" />
            <SavorExploreLinks category="misc" city={city} countryName={country} limit={2} title="Pharmacies" query="pharmacies" />
            <SavorExploreLinks category="misc" city={city} countryName={country} limit={2} title="Car rental" query="car rental" />
          </div>
        </>
      )}
    </section>
  );
}
