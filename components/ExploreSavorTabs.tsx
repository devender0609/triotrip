"use client";

import React from "react";
import { providerLinksFor } from "../lib/providerLinks";

/** Tabs supported by the discovery panel */
export type SubTab = "explore" | "savor" | "misc" | "compare";

/** Props: we only render content for explore/savor/misc (compare is handled elsewhere) */
export type Props = {
  city: string;                // destination display name (e.g., "Boston")
  originCountry?: string;      // ISO/label, used only to detect international
  destCountry?: string;        // ISO/label, used only to detect international
  active: Exclude<SubTab, "compare">;
};

/* ---------- Small UI helpers ---------- */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-2xl bg-white/90 ring-1 ring-slate-200 p-3">
    <h4 className="font-semibold mb-2 text-slate-900">{title}</h4>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const Pill: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold
               bg-slate-50 ring-1 ring-slate-300 hover:bg-white hover:ring-slate-400
               text-slate-800 transition"
  >
    {children}
  </a>
);

/* ---------- Logic helpers ---------- */

function isInternational(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.toLowerCase() !== b.toLowerCase();
}

/* ---------- Component ---------- */

const ExploreSavorTabs: React.FC<Props> = ({
  city,
  originCountry,
  destCountry,
  active,
}) => {
  const intl = isInternational(originCountry, destCountry);
  const links = providerLinksFor(intl);
  const grid = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3";

  return (
    <div className="space-y-3">
      {/* header line */}
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-medium text-slate-800">
          {active.charAt(0).toUpperCase() + active.slice(1)} — {city || "Destination"}
        </span>
      </div>

      {/* ===== EXPLORE ===== */}
      {active === "explore" && (
        <div className={grid}>
          <Section title="Top sights">
            <Pill href={links.maps(city, "top sights")}>Google Maps</Pill>
            <Pill href={links.tripadvisor(city, "Attractions")}>Tripadvisor</Pill>
            <Pill href={links.timeout(city)}>Time Out</Pill>
          </Section>

          <Section title="Parks & views">
            <Pill href={links.maps(city, "parks")}>Google Maps</Pill>
            <Pill href={links.tripadvisor(city, "Nature & Parks")}>Tripadvisor</Pill>
          </Section>

          <Section title="Museums">
            <Pill href={links.maps(city, "museums")}>Google Maps</Pill>
            <Pill href={links.tripadvisor(city, "Museums")}>Tripadvisor</Pill>
          </Section>

          <Section title="Family">
            <Pill href={links.maps(city, "family activities")}>Google Maps</Pill>
            <Pill href={links.tripadvisor(city, "Family & Kids")}>Tripadvisor</Pill>
          </Section>

          <Section title="Nightlife">
            <Pill href={links.maps(city, "nightlife")}>Google Maps</Pill>
            <Pill href={links.tripadvisor(city, "Nightlife")}>Tripadvisor</Pill>
            <Pill href={links.timeout(city, "nightlife")}>Time Out</Pill>
          </Section>

          <Section title="Guides">
            <Pill href={links.wikivoyage(city)}>Wikivoyage</Pill>
            <Pill href={links.wikipedia(city)}>Wikipedia</Pill>
          </Section>
        </div>
      )}

      {/* ===== SAVOR ===== */}
      {active === "savor" && (
        <div className={grid}>
          <Section title="Best restaurants">
            <Pill href={links.yelp(city, "best restaurants")}>Yelp</Pill>
            <Pill href={links.openTable(city)}>OpenTable</Pill>
            {intl && <Pill href={links.michelin(city)}>Michelin</Pill>}
          </Section>

          <Section title="Local eats">
            <Pill href={links.yelp(city, "local eats")}>Yelp</Pill>
            <Pill href={links.maps(city, "local food")}>Google Maps</Pill>
          </Section>

          <Section title="Cafés & coffee">
            <Pill href={links.maps(city, "coffee")}>Google Maps</Pill>
            <Pill href={links.yelp(city, "coffee")}>Yelp</Pill>
          </Section>

          <Section title="Street food">
            <Pill href={links.maps(city, "street food")}>Google Maps</Pill>
            <Pill href={links.yelp(city, "street food")}>Yelp</Pill>
          </Section>

          {intl && (
            <Section title="Regional dining">
              <Pill href={links.zomato(city)}>Zomato</Pill>
              <Pill href={links.eazyDiner(city)}>EazyDiner</Pill>
            </Section>
          )}

          <Section title="Desserts">
            <Pill href={links.maps(city, "desserts")}>Google Maps</Pill>
            <Pill href={links.yelp(city, "desserts")}>Yelp</Pill>
          </Section>
        </div>
      )}

      {/* ===== MISC ===== */}
      {active === "misc" && (
        <div className={grid}>
          <Section title="Know before you go">
            <Pill href={links.wikivoyage(city)}>Wikivoyage</Pill>
            <Pill href={links.wikipedia(city)}>Wikipedia</Pill>
            <Pill href={links.xe()}>XE currency</Pill>
            <Pill href={links.usStateDept(city)}>US State Dept</Pill>
          </Section>

          <Section title="Weather">
            <Pill href={links.weather(city)}>Weather</Pill>
          </Section>

          <Section title="Pharmacies">
            <Pill href={links.maps(city, "pharmacies")}>Google Maps</Pill>
          </Section>

          <Section title="Car rental">
            <Pill href={links.cars(city)}>Search cars</Pill>
          </Section>
        </div>
      )}
    </div>
  );
};

export default ExploreSavorTabs;
