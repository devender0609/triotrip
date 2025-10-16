"use client";

import React, { useMemo } from "react";

/**
 * Robust link builders that don't depend on fragile city IDs.
 * We lean on providers that accept free-text city searches.
 * Country-aware switches only where the provider is truly country-scoped.
 */

const Q = (x: string) => encodeURIComponent(x.trim());

const href = {
  // Universal helpers
  gmaps: (city: string, q?: string) =>
    `https://www.google.com/maps/search/${Q((q ? q + " " : "") + city)}`,
  tripadvisor: (q: string, city: string) =>
    `https://www.tripadvisor.com/Search?q=${Q(q + " " + city)}&searchSessionId=&sid=`,
  lonelyplanet: (city: string) =>
    `https://www.lonelyplanet.com/search?q=${Q(city)}`,
  timeout: (city: string) =>
    `https://www.timeout.com/search?query=${Q(city)}`,
  wiki: (city: string) =>
    `https://en.wikipedia.org/wiki/Special:Search?search=${Q(city)}`,
  wikivoyage: (city: string) =>
    `https://en.wikivoyage.org/w/index.php?search=${Q(city)}`,
  currency: (cityOrCountry: string) =>
    `https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${Q(cityOrCountry)}`, // not used by default, but available

  // Food/Drink
  yelp: (city: string, term = "") =>
    `https://www.yelp.com/search?find_desc=${Q(term)}&find_loc=${Q(city)}`,
  michelin: (city: string) =>
    `https://guide.michelin.com/en/search?q=${Q(city)}`,
  eater: (city: string) =>
    `https://www.eater.com/search?q=${Q(city)}`,

  // National/official (country-aware where it makes sense)
  tourism: (countryCode: string, city: string) => {
    const cc = (countryCode || "").toUpperCase();
    if (cc === "US") return `https://www.travelusa.com/search?query=${Q(city)}`;
    if (cc === "GB") return `https://www.visitbritain.com/en/search?search=${Q(city)}`;
    if (cc === "FR") return `https://www.france.fr/en/search?keys=${Q(city)}`;
    if (cc === "JP") return `https://www.japan.travel/en/search/?q=${Q(city)}`;
    if (cc === "AE") return `https://www.visitdubai.com/en/search#q=${Q(city)}`;
    if (cc === "SG") return `https://www.visitsingapore.com/en/search/?q=${Q(city)}`;
    // generic fallback
    return `https://duckduckgo.com/?q=${Q(countryCode + " official tourism " + city)}`;
  },

  // Weather / Pharmacies / Car rental
  weather: (city: string) => `https://www.google.com/search?q=${Q(city + " weather")}`,
  pharmacies: (city: string) => `https://www.google.com/maps/search/${Q("pharmacy " + city)}`,
  carRental: (city: string) =>
    `https://www.google.com/search?q=${Q("car rental " + city)}`,

  // Know before you go (credible general info)
  cdcTravel: (countryCode: string) =>
    `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${Q(countryCode.toLowerCase())}`,
  ukFCDO: (countryCode: string) =>
    `https://www.gov.uk/foreign-travel-advice/${Q(countryCode.toLowerCase())}`,
  stateDept: (countryCode: string) =>
    `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${Q(countryCode)}-travel-advisory.html`,
};

export default function SavorExploreLinks({
  category,        // "explore" | "savor" | "misc"
  countryCode = "",// e.g., "US"
  countryName = "",// e.g., "United States"
  city,            // destination city (string)
  title,           // section title (unused here; kept for compatibility)
  query = "",      // subcategory hint like "museums"
  limit = 12,
}: {
  category: "explore" | "savor" | "misc";
  countryCode?: string;
  countryName?: string;
  city: string;
  title?: string;
  query?: string;
  limit?: number;
}) {
  const providers = useMemo(() => {
    const list: { label: string; url: string }[] = [];

    if (category === "explore") {
      // Top sights / Museums / Family / Parks / Nightlife / Guides
      const q = query.trim().toLowerCase();
      const add = (...items: { label: string; url: string }[]) => list.push(...items);

      // Guides
      if (!q || /guide|top|sight/.test(q)) {
        add(
          { label: "Lonely Planet", url: href.lonelyplanet(city) },
          { label: "Time Out", url: href.timeout(city) },
          { label: "Wikivoyage", url: href.wikivoyage(city) }
        );
      }

      // Museums
      if (!q || /museum/.test(q)) {
        add(
          { label: "Tripadvisor – Museums", url: href.tripadvisor("museums", city) },
          { label: "Google Maps – Museums", url: href.gmaps(city, "museums") }
        );
      }

      // Top sights
      if (!q || /top|sight|attraction/.test(q)) {
        add(
          { label: "Tripadvisor – Things to Do", url: href.tripadvisor("top sights", city) },
          { label: "Google Maps – Attractions", url: href.gmaps(city, "attractions") }
        );
      }

      // Parks & views
      if (!q || /park|view|scenic|hike/.test(q)) {
        add(
          { label: "Google Maps – Parks", url: href.gmaps(city, "parks") },
          { label: "Google Maps – Viewpoints", url: href.gmaps(city, "viewpoints") }
        );
      }

      // Family
      if (!q || /family|kids/.test(q)) {
        add(
          { label: "Tripadvisor – Family", url: href.tripadvisor("family activities", city) },
          { label: "Google Maps – Kids", url: href.gmaps(city, "kid friendly") }
        );
      }

      // Nightlife
      if (!q || /night|bar|club/.test(q)) {
        add(
          { label: "Tripadvisor – Nightlife", url: href.tripadvisor("nightlife", city) },
          { label: "Google Maps – Bars & Clubs", url: href.gmaps(city, "bars clubs") }
        );
      }

      // National/Official (for the country)
      if (countryCode) {
        add({ label: "Official Tourism", url: href.tourism(countryCode, city) });
      }
    }

    if (category === "savor") {
      // Restaurants / Cafés / Bars / Markets
      const q = query.trim().toLowerCase();
      const add = (...items: { label: string; url: string }[]) => list.push(...items);

      // Restaurants
      if (!q || /restaurant|food|eat/.test(q)) {
        add(
          { label: "Google Maps – Restaurants", url: href.gmaps(city, "restaurants") },
          { label: "Yelp – Restaurants", url: href.yelp(city, "restaurants") },
          { label: "Michelin Guide", url: href.michelin(city) }
        );
      }

      // Cafés
      if (!q || /cafe|coffee/.test(q)) {
        add(
          { label: "Google Maps – Cafés", url: href.gmaps(city, "cafes") },
          { label: "Yelp – Cafés", url: href.yelp(city, "cafes") }
        );
      }

      // Bars
      if (!q || /bar|cocktail|pub/.test(q)) {
        add(
          { label: "Google Maps – Bars", url: href.gmaps(city, "bars") },
          { label: "Yelp – Bars", url: href.yelp(city, "bars") }
        );
      }

      // Markets / Street food
      if (!q || /market|street/.test(q)) {
        add(
          { label: "Google Maps – Markets", url: href.gmaps(city, "markets") },
          { label: "Tripadvisor – Markets", url: href.tripadvisor("markets", city) }
        );
      }
    }

    if (category === "misc") {
      const add = (...items: { label: string; url: string }[]) => list.push(...items);

      // Know before you go (country)
      if (countryCode) {
        add(
          { label: "CDC Traveler Health", url: href.cdcTravel(countryCode) },
          { label: "UK FCDO Advice", url: href.ukFCDO(countryCode) },
          { label: "US State Dept", url: href.stateDept(countryCode) },
        );
      } else if (countryName) {
        // fallback: search by name if no code
        add(
          { label: "CDC Traveler Health", url: `https://duckduckgo.com/?q=${Q("CDC travel " + countryName)}` },
          { label: "UK FCDO Advice", url: `https://duckduckgo.com/?q=${Q("FCDO travel advice " + countryName)}` },
          { label: "US State Dept", url: `https://duckduckgo.com/?q=${Q("state department travel advisory " + countryName)}` },
        );
      }

      // Weather / Pharmacies / Car rental (city)
      add(
        { label: "Weather", url: href.weather(city) },
        { label: "Pharmacies (Maps)", url: href.pharmacies(city) },
        { label: "Car rental", url: href.carRental(city) },
      );
    }

    // De-duplicate by label+url and cap to limit
    const dedup = new Map<string, { label: string; url: string }>();
    for (const it of list) dedup.set(`${it.label}::${it.url}`, it);
    return Array.from(dedup.values()).slice(0, limit);
  }, [category, city, countryCode, countryName, query, limit]);

  if (!city) return null;

  return (
    <div className="badge-row">
      {providers.map((p) => (
        <a key={`${p.label}-${p.url}`} href={p.url} target="_blank" rel="noreferrer" className="badge-link">
          {p.label}
        </a>
      ))}
    </div>
  );
}
