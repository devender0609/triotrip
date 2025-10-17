"use client";
import React from "react";

type Category = "explore" | "savor" | "misc";

type Props = {
  category: Category;
  countryCode?: string;
  countryName?: string;
  city: string;
  limit?: number;
  title?: string;
  query?: string;
};

const Q = (s: string) => encodeURIComponent(s);
const href = {
  gmaps: (city: string, q?: string) =>
    `https://www.google.com/maps/search/${Q((q ? `${q} in ` : "") + city)}`,
  tripadvisor: (q: string | undefined, city: string) =>
    `https://www.tripadvisor.com/Search?q=${Q(`${q || ""} ${city}`.trim())}`,
  lonelyplanet: (city: string) => `https://www.lonelyplanet.com/search?q=${Q(city)}`,
  timeout: (city: string) => `https://www.timeout.com/search?query=${Q(city)}`,
  wiki: (city: string) => `https://en.wikipedia.org/wiki/${Q(city.replace(/\s+/g,"_"))}`,
  wikivoyage: (city: string) => `https://en.wikivoyage.org/wiki/${Q(city.replace(/\s+/g,"_"))}`,
  yelp: (q: string | undefined, city: string) => `https://www.yelp.com/search?find_desc=${Q(q||"food")}&find_loc=${Q(city)}`,
  opentable: (city: string) => `https://www.opentable.com/s?term=${Q(city)}`,
  michelin: (city: string) => `https://guide.michelin.com/en/search?q=&city=${Q(city)}`,
  weather: (city: string) => `https://www.google.com/search?q=${Q(`weather ${city}`)}`,
  pharmacies: (city: string) => `https://www.google.com/maps/search/${Q(`pharmacies in ${city}`)}`,
  cars: (city: string) => `https://www.google.com/search?q=${Q(`car rental ${city}`)}`,
  currency: (city: string) => `https://www.xe.com/currencyconverter/?search=${Q(city)}`,
  stateDept: () => `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`,
};

export default function SavorExploreLinks({
  category, countryCode = "", countryName = "", city, limit = 6, title, query,
}: Props) {
  const q = (query || title || "").toLowerCase();

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
    // Misc
    if (/know|advice|tips|before|kbyg/i.test(q)) {
      providers.push(
        { label: "Wikivoyage", url: href.wikivoyage(city) },
        { label: "Wikipedia", url: href.wiki(city) },
        { label: "XE currency", url: href.currency(city) },
        { label: "US State Dept", url: href.stateDept() },
      );
    } else if (/weather/i.test(q)) {
      providers.push({ label: "Weather", url: href.weather(city) });
    } else if (/pharm/i.test(q)) {
      providers.push({ label: "Google Maps", url: href.pharmacies(city) });
    } else if (/car|rental|cars/i.test(q)) {
      providers.push({ label: "Search cars", url: href.cars(city) });
    }
  }

  if (limit > 0) providers = providers.slice(0, limit);
  if (!providers.length) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {providers.map(p => (
        <a
          key={p.label + p.url}
          className="btn badge"
          href={p.url}
          target="_blank"
          rel="noreferrer"
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
