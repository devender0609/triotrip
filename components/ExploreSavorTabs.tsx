"use client";

import React from "react";

type Category = "explore" | "savor" | "misc";

type Props = {
  category: Category;
  /** ISO-like country code (optional) */
  countryCode?: string;
  /** Country name (optional) */
  countryName?: string;
  /** Destination city (required) */
  city: string;
  /** Max links to show (soft cap) */
  limit?: number;
  /** Section title to display on the card */
  title: string;
  /** Optional query string to specialize provider links (e.g., "museums") */
  query?: string;
};

const href = {
  gmaps: (city: string, q?: string) =>
    `https://www.google.com/maps/search/${encodeURIComponent(
      (q ? `${q} in ` : "") + city
    )}`,
  tripadvisor: (q: string | undefined, city: string) =>
    `https://www.tripadvisor.com/Search?q=${encodeURIComponent(
      `${q || ""} ${city}`.trim()
    )}`,
  lonelyplanet: (city: string) =>
    `https://www.lonelyplanet.com/search?q=${encodeURIComponent(city)}`,
  timeout: (city: string) =>
    `https://www.timeout.com/search?query=${encodeURIComponent(city)}`,
  wiki: (city: string) =>
    `https://en.wikipedia.org/wiki/${encodeURIComponent(
      city.replace(/\s+/g, "_")
    )}`,
  wikivoyage: (city: string) =>
    `https://en.wikivoyage.org/wiki/${encodeURIComponent(
      city.replace(/\s+/g, "_")
    )}`,
  yelp: (q: string | undefined, city: string) =>
    `https://www.yelp.com/search?find_desc=${encodeURIComponent(
      q || "food"
    )}&find_loc=${encodeURIComponent(city)}`,
  opentable: (city: string) =>
    `https://www.opentable.com/s?term=${encodeURIComponent(city)}`,
  michelin: (city: string) =>
    `https://guide.michelin.com/en/search?q=&city=${encodeURIComponent(city)}`,
  weather: (city: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`weather ${city}`)}`,
  pharmacies: (city: string) =>
    `https://www.google.com/maps/search/${encodeURIComponent(
      `pharmacies in ${city}`
    )}`,
  cars: (city: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(
      `car rental ${city}`
    )}`,
  currency: (city: string) =>
    `https://www.xe.com/currencyconverter/?search=${encodeURIComponent(city)}`,
  stateDept: () =>
    `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`,
};

export default function SavorExploreLinks({
  category,
  countryCode = "",
  countryName = "",
  city,
  limit = 6,
  title,
  query,
}: Props) {
  const q = (query || title || "").toLowerCase();

  // Choose providers based on category
  let providers: { label: string; url: string }[] = [];

  if (category === "explore") {
    providers = [
      { label: "Google Maps", url: href.gmaps(city, q) },
      { label: "Tripadvisor", url: href.tripadvisor(q, city) },
      { label: "Lonely Planet", url: href.lonelyplanet(city) },
      { label: "Time Out", url: href.timeout(city) },
      { label: "Wikipedia", url: href.wiki(city) },
      { label: "Wikivoyage", url: href.wikivoyage(city) },
    ];
  } else if (category === "savor") {
    providers = [
      { label: "Yelp", url: href.yelp(q, city) },
      { label: "OpenTable", url: href.opentable(city) },
      { label: "Michelin", url: href.michelin(city) },
      { label: "Google Maps", url: href.gmaps(city, q) },
    ];
  } else {
    // misc
    if (/know|advice|tips|before/i.test(q) || /know/.test(title.toLowerCase())) {
      providers.push(
        { label: "Wikivoyage", url: href.wikivoyage(city) },
        { label: "Wikipedia", url: href.wiki(city) },
        { label: "XE currency", url: href.currency(city) },
        { label: "US State Dept", url: href.stateDept() }
      );
    } else if (/weather/i.test(q)) {
      providers.push({ label: "Weather", url: href.weather(city) });
    } else if (/pharm/i.test(q)) {
      providers.push({ label: "Google Maps", url: href.pharmacies(city) });
    } else if (/car|rental|cars/i.test(q)) {
      providers.push({ label: "Search cars", url: href.cars(city) });
    } else {
      // generic fallback
      providers.push(
        { label: "Wikivoyage", url: href.wikivoyage(city) },
        { label: "Wikipedia", url: href.wiki(city) }
      );
    }
  }

  if (limit > 0) providers = providers.slice(0, limit);

  return (
    <div className="place-card">
      <div className="place-title">{title}</div>
      <div className="place-links">
        {providers.map((p) => (
          <a
            key={p.label}
            className="place-link"
            href={p.url}
            target="_blank"
            rel="noreferrer"
            title={`${p.label} — ${city}${
              countryName ? ", " + countryName : ""
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>
      <style jsx>{`
        .place-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px;
          background: linear-gradient(180deg, #ffffff, #f9fbff);
        }
        .place-title {
          font-weight: 800;
          margin-bottom: 6px;
          color: #0f172a;
        }
        .place-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .place-link {
          display: inline-block;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          text-decoration: none;
          background: #fff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
