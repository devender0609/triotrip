"use client";

import React from "react";
import SavorExploreLinks from "./SavorExploreLinks";

/**
 * ExploreSavorTabs
 * A compact, reusable panel that renders Explore / Savor / Misc sections
 * using the country/continent-aware link sets from lib/savorExplore.
 *
 * Usage:
 *  <ExploreSavorTabs
 *    city="Tokyo"
 *    countryName="Japan"
 *    countryCode="JP"
 *    show={["explore","savor","misc"]}  // optional; defaults to all three
 *    limit={8}                          // optional; soft cap per section
 *  />
 */

type Category = "explore" | "savor" | "misc";

type Props = {
  /** Display city name (e.g., "Tokyo" or "Paris, France"). Required. */
  city: string;
  /** ISO-like country code (e.g., "JP"). Optional but recommended. */
  countryCode?: string;
  /** Country name (e.g., "Japan"). Optional, used for advisories. */
  countryName?: string;
  /** Which sections to show. Defaults to all three. */
  show?: Category[];
  /** Soft cap for links per section. Defaults to 6. */
  limit?: number;
  /** Optional heading shown at top of the panel. */
  heading?: string;
};

export default function ExploreSavorTabs({
  city,
  countryCode,
  countryName,
  show = ["explore", "savor", "misc"],
  limit = 6,
  heading,
}: Props) {
  // normalize/guard
  const _city = city?.trim() || "Destination";

  return (
    <section className="estabs">
      {heading && <div className="estabs__heading">{heading}</div>}

      <div className="estabs__grid">
        {show.includes("explore") && (
          <SavorExploreLinks
            category="explore"
            city={_city}
            countryCode={countryCode}
            countryName={countryName}
            limit={limit}
            title="🌍 Explore"
          />
        )}

        {show.includes("savor") && (
          <SavorExploreLinks
            category="savor"
            city={_city}
            countryCode={countryCode}
            countryName={countryName}
            limit={limit}
            title="🍽️ Savor"
          />
        )}

        {show.includes("misc") && (
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
