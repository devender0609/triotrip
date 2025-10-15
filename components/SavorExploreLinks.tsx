"use client";
import React from "react";

type Props = {
  category: "explore" | "savor";
  city?: string;
  countryName?: string;
  countryCode?: string;
  title?: string;
  limit?: number;
  when?: string; // ISO date (optional)
};

function qurl(base: string, params: Record<string, string>) {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export default function SavorExploreLinks({
  category,
  city,
  countryName,
  countryCode,
  title,
  limit = 6,
}: Props) {
  const place = city || countryName || "your destination";

  // Providers (reputable, broadly available)
  const explore = [
    {
      name: "Google Travel – Things to do",
      url: city
        ? `https://www.google.com/travel/things-to-do?dest=${encodeURIComponent(city)}`
        : `https://www.google.com/travel/things-to-do`,
      emoji: "🧭",
    },
    {
      name: "Lonely Planet",
      url: city
        ? `https://www.lonelyplanet.com/search?q=${encodeURIComponent(city)}`
        : `https://www.lonelyplanet.com/`,
      emoji: "🌍",
    },
    {
      name: "Time Out – City Guides",
      url: city
        ? `https://www.timeout.com/search?query=${encodeURIComponent(city)}`
        : `https://www.timeout.com/travel`,
      emoji: "⏱️",
    },
    {
      name: "Tripadvisor – Attractions",
      url: city
        ? `https://www.tripadvisor.com/Search?q=${encodeURIComponent(city)}%20attractions`
        : `https://www.tripadvisor.com/Attractions`,
      emoji: "⭐",
    },
    {
      name: "Culture Trip",
      url: city
        ? `https://theculturetrip.com/search?query=${encodeURIComponent(city)}`
        : `https://theculturetrip.com/`,
      emoji: "🎒",
    },
  ];

  const savor = [
    {
      name: "Google Maps – Best restaurants",
      url: city
        ? `https://www.google.com/maps/search/${encodeURIComponent(`best restaurants in ${city}`)}`
        : `https://www.google.com/maps/search/restaurants`,
      emoji: "🍽️",
    },
    {
      name: "Time Out – Restaurants",
      url: city
        ? `https://www.timeout.com/search?query=${encodeURIComponent(`${city} restaurants`)}`
        : `https://www.timeout.com/food-drink`,
      emoji: "🍷",
    },
    {
      name: "MICHELIN Guide",
      url: city
        ? `https://guide.michelin.com/en/search?q=${encodeURIComponent(city)}`
        : `https://guide.michelin.com/`,
      emoji: "⭐",
    },
    {
      name: "Tripadvisor – Restaurants",
      url: city
        ? `https://www.tripadvisor.com/Search?q=${encodeURIComponent(city)}%20restaurants`
        : `https://www.tripadvisor.com/Restaurants`,
      emoji: "🥘",
    },
    {
      name: "Eater (if available)",
      url: city
        ? `https://www.eater.com/search?q=${encodeURIComponent(city)}`
        : `https://www.eater.com/`,
      emoji: "🍜",
    },
  ];

  const items = (category === "explore" ? explore : savor).slice(0, limit);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 800, color: "#0f172a" }}>
        {category === "explore" ? "Explore" : "Savor"} — {place}
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {items.map((p, i) => (
          <li key={`${p.name}-${i}`}>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                textDecoration: "none",
                color: "#0f172a",
                background: "#fff",
                fontWeight: 600,
              }}
            >
              <span aria-hidden>{p.emoji}</span>
              <span>{p.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
