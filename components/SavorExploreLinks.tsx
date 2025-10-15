// components/SavorExploreLinks.tsx
"use client";
import React from "react";
import { pickSites, type Category } from "../lib/savorExplore";

type Props = {
  category: Category;              // "explore" | "savor"
  countryCode?: string;            // ISO alpha-2 (preferred)
  countryName?: string;            // if code not available
  city?: string;
  when?: string;                   // ISO datetime for reservations
  limit?: number;                  // number of links to show
  title?: string;
};

export default function SavorExploreLinks({
  category, countryCode, countryName, city, when, limit = 4, title
}: Props) {
  const items = pickSites(category, { countryCode, countryName, city, when, limit });

  if (!items.length) return null;

  return (
    <section className="savor-explore-links" aria-label={`${category} links`}>
      <header style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
        {title || (category === "explore" ? "Explore" : "Savor")}
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it) => (
          <a
            key={it.id}
            href={it.url}
            target="_blank"
            rel="noreferrer"
            className="savor-explore-link"
            style={{
              border: "1px solid #e2e8f0",
              padding: "8px 12px",
              borderRadius: 10,
              background: "#fff",
              textDecoration: "none",
              color: "#0f172a",
              fontWeight: 600
            }}
          >
            {it.name}
          </a>
        ))}
      </div>
    </section>
  );
}
