"use client";
import React from "react";
import SavorExploreLinks from "@/components/SavorExploreLinks";

export default function ExploreSavorTabs({
  destinationCity,
  destinationCountry,
  mode,       // "explore" | "savor" | "misc"
  showTabs,   // kept for compatibility; not used to render tabs here
}: {
  destinationCity: string;
  destinationCountry: string;
  mode: "explore" | "savor" | "misc";
  showTabs?: boolean;
}) {
  const city = destinationCity || "Destination";
  const countryName = destinationCountry || "";

  return (
    <div className="card">
      {mode === "explore" && (
        <div className="places-grid">
          <div className="places-col">
            <h3 className="section-title">🧭 Guides</h3>
            <SavorExploreLinks category="explore" city={city} countryName={countryName} title="Guides" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🏛️ Museums</h3>
            <SavorExploreLinks category="explore" city={city} countryName={countryName} title="Museums" query="museums" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🌆 Top sights</h3>
            <SavorExploreLinks category="explore" city={city} countryName={countryName} title="Top sights" query="top attractions" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🌳 Parks & views</h3>
            <SavorExploreLinks category="explore" city={city} countryName={countryName} title="Parks & views" query="parks viewpoints" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">👨‍👩‍👧 Family</h3>
            <SavorExploreLinks category="explore" city={city} countryName={countryName} title="Family" query="family kids" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🌙 Nightlife</h3>
            <SavorExploreLinks category="explore" city={city} countryName={countryName} title="Nightlife" query="nightlife" limit={12} />
          </div>
        </div>
      )}

      {mode === "savor" && (
        <div className="places-grid">
          <div className="places-col">
            <h3 className="section-title">🍽️ Restaurants</h3>
            <SavorExploreLinks category="savor" city={city} countryName={countryName} title="Restaurants" query="restaurants" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">☕ Cafés</h3>
            <SavorExploreLinks category="savor" city={city} countryName={countryName} title="Cafés" query="cafes coffee" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🍸 Bars</h3>
            <SavorExploreLinks category="savor" city={city} countryName={countryName} title="Bars" query="bars" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🛒 Markets</h3>
            <SavorExploreLinks category="savor" city={city} countryName={countryName} title="Markets" query="markets street food" limit={12} />
          </div>
        </div>
      )}

      {mode === "misc" && (
        <div className="places-grid">
          <div className="places-col">
            <h3 className="section-title">ℹ️ Know before you go</h3>
            <SavorExploreLinks category="misc" city={city} countryName={countryName} title="Know before you go" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🌦️ Weather</h3>
            <SavorExploreLinks category="misc" city={city} countryName={countryName} title="Weather" query="weather" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">💊 Pharmacies</h3>
            <SavorExploreLinks category="misc" city={city} countryName={countryName} title="Pharmacies" query="pharmacy" limit={12} />
          </div>
          <div className="places-col">
            <h3 className="section-title">🚗 Car rental</h3>
            <SavorExploreLinks category="misc" city={city} countryName={countryName} title="Car rental" query="car rental" limit={12} />
          </div>
        </div>
      )}
    </div>
  );
}
