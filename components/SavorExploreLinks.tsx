"use client";

import React from "react";
import { exploreSet, savorSet, miscSet } from "../lib/savorExplore";

type Category = "explore" | "savor" | "misc";

type Props = {
  category: Category;
  countryCode?: string;
  countryName?: string;
  city: string;
  limit?: number;
  title: string;
  query?: string; // not used for provider selection now, but kept for compatibility
};

export default function SavorExploreLinks({
  category,
  countryCode,
  countryName,
  city,
  limit = 6,
  title,
}: Props) {
  let providers =
    category === "explore"
      ? exploreSet(city, countryCode)
      : category === "savor"
      ? savorSet(city, countryCode)
      : miscSet(city, countryName, countryCode);

  if (limit > 0) providers = providers.slice(0, limit);

  return (
    <div className="place-card">
      <div className="place-title">{title}</div>
      <div className="place-links">
        {providers.map((p) => (
          <a key={p.id} className="place-link" href={p.url} target="_blank" rel="noreferrer">
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
