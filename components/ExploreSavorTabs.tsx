"use client";

import React from "react";
import SavorExploreLinks from "./SavorExploreLinks";

type Category = "explore" | "savor" | "misc";

type Props = {
  city: string;
  countryCode?: string;
  countryName?: string;
  /** Which sections to show. Defaults to all three. */
  show?: Category[];
  limit?: number;
  heading?: string;
  /** NEW: force a single mode, e.g. "explore" only */
  mode?: Category;
};

export default function ExploreSavorTabs({
  city,
  countryCode,
  countryName,
  show = ["explore", "savor", "misc"],
  limit = 6,
  heading,
  mode,
}: Props) {
  const _city = city?.trim() || "Destination";

  // if mode is given, override show with that single category
  const categories: Category[] = mode ? [mode] : show;

  return (
    <section className="estabs">
      {heading && <div className="estabs__heading">{heading}</div>}

      <div className="estabs__grid">
        {categories.includes("explore") && (
          <SavorExploreLinks
            category="explore"
            city={_city}
            countryCode={countryCode}
            countryName={countryName}
            limit={limit}
            title="🌍 Explore"
          />
        )}

        {categories.includes("savor") && (
          <SavorExploreLinks
            category="savor"
            city={_city}
            countryCode={countryCode}
            countryName={countryName}
            limit={limit}
            title="🍽️ Savor"
          />
        )}

        {categories.includes("misc") && (
          <SavorExploreLinks
            category="misc"
            city={_city}
            countryCode={countryCode}
            countryName={countryName}
            limit={limit}
            title="🧭 Miscellaneous"
          />
        )}
      </div>

      <style jsx>{`
        .estabs {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
        }
        .estabs__heading {
          font-weight: 700;
          font-size: 18px;
          color: #0f172a;
          margin-bottom: 10px;
        }
        .estabs__grid {
          display: grid;
          grid-template-columns: repeat(${categories.length}, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .estabs__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .estabs__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
