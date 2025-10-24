"use client";

import React from "react";
import { buildUrl, isInternational } from "../lib/providerLinks";

type Props = {
  city: string;                 // e.g., "Boston" or "New Delhi"
  country?: string;             // ISO-2 of destination, e.g. "US", "IN"
  originCountry?: string;       // ISO-2 of origin (for international checks)
  mode: "explore" | "savor" | "misc";
};

/** Small UI helpers */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="tt-card">
    <div className="tt-card-title">{title}</div>
    <div className="tt-pills">{children}</div>
  </div>
);

const Pill: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a className="tt-pill" href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

/** Build common provider links */
const L = {
  gmaps: (city: string, term: string) => buildUrl("maps", { city, country: "", term }),
  trip: (city: string, term: string) => buildUrl("tripadvisor", { city, country: "", term }),
  lp: (city: string) => buildUrl("lonelyplanet", { city, country: "", term: "" }), // graceful fallback via providerLinks
  timeout: (city: string) => buildUrl("timeout", { city, country: "", term: "" }),
  wikiVoy: (city: string) => buildUrl("wikivoyage", { city, country: "", term: "" }),
  wiki: (city: string) => buildUrl("wikipedia", { city, country: "", term: "" }),
  yelp: (city: string, term: string) => buildUrl("yelp", { city, country: "", term }),
  opentable: (city: string) => buildUrl("opentable", { city, country: "", term: "" }),
  michelin: (city: string) => buildUrl("thefork", { city, country: "", term: "" }), // reliable alt for many regions
  zomato: (city: string) => buildUrl("zomato", { city, country: "", term: "" }),
  eazy: (city: string) => buildUrl("eazydiner", { city, country: "", term: "" }),
  weather: () => buildUrl("weather", { city: "", country: "" }), // handled in helper as generic
  xe: () => buildUrl("xe", { city: "", country: "" }),
  state: () => buildUrl("state_dept", { city: "", country: "" }),
  cars: () => buildUrl("cars", { city: "", country: "" }),
};

/** Grid for each tab exactly like your original design */
export default function ExploreSavorTabs({ city, country = "", originCountry, mode }: Props) {
  const intl = isInternational(originCountry, country);

  return (
    <div className="tt-sections">
      {/* ===== EXPLORE ===== */}
      {mode === "explore" && (
        <>
          <div className="tt-header">
            <span className="tt-dot" /> <b>Explore — {city}</b>
          </div>

          <div className="tt-grid">
            <Section title="Top sights">
              <Pill href={L.gmaps(city, "top sights")}>Google Maps</Pill>
              <Pill href={L.trip(city, "things to do")}>Tripadvisor</Pill>
              <Pill href={L.timeout(city)}>Time Out</Pill>
            </Section>

            <Section title="Parks & views">
              <Pill href={L.gmaps(city, "parks")} >Google Maps</Pill>
              <Pill href={L.trip(city, "parks")}>Tripadvisor</Pill>
            </Section>

            <Section title="Museums">
              <Pill href={L.gmaps(city, "museums")}>Google Maps</Pill>
              <Pill href={L.trip(city, "museums")}>Tripadvisor</Pill>
            </Section>

            <Section title="Family">
              <Pill href={L.gmaps(city, "kids activities")}>Google Maps</Pill>
              <Pill href={L.trip(city, "family")}>Tripadvisor</Pill>
            </Section>

            <Section title="Nightlife">
              <Pill href={L.gmaps(city, "nightlife")}>Google Maps</Pill>
              <Pill href={L.trip(city, "nightlife")}>Tripadvisor</Pill>
              <Pill href={L.timeout(city)}>Time Out</Pill>
            </Section>

            <Section title="Guides">
              <Pill href={L.wikiVoy(city)}>Wikivoyage</Pill>
              <Pill href={L.wiki(city)}>Wikipedia</Pill>
            </Section>
          </div>
        </>
      )}

      {/* ===== SAVOR ===== */}
      {mode === "savor" && (
        <>
          <div className="tt-header">
            <span className="tt-dot" /> <b>Savor — {city}</b>
          </div>

          <div className="tt-grid">
            <Section title="Best restaurants">
              <Pill href={L.yelp(city, "best restaurants")}>Yelp</Pill>
              <Pill href={L.opentable(city)}>OpenTable</Pill>
              <Pill href={L.michelin(city)}>Michelin</Pill>
            </Section>

            <Section title="Local eats">
              <Pill href={L.yelp(city, "local eats")}>Yelp</Pill>
              <Pill href={L.gmaps(city, "local food")}>Google Maps</Pill>
            </Section>

            <Section title="Cafés & coffee">
              <Pill href={L.gmaps(city, "coffee cafe")}>Google Maps</Pill>
              <Pill href={L.yelp(city, "coffee")}>Yelp</Pill>
            </Section>

            <Section title="Street food">
              <Pill href={L.gmaps(city, "street food")}>Google Maps</Pill>
              <Pill href={L.yelp(city, "street food")}>Yelp</Pill>
            </Section>

            <Section title="Desserts">
              <Pill href={L.gmaps(city, "dessert")}>Google Maps</Pill>
              <Pill href={L.yelp(city, "dessert")}>Yelp</Pill>
            </Section>

            {/* International-only section just like your spec */}
            {intl && (
              <Section title="Regional dining">
                <Pill href={L.zomato(city)}>Zomato</Pill>
                <Pill href={L.eazy(city)}>EazyDiner</Pill>
              </Section>
            )}
          </div>
        </>
      )}

      {/* ===== MISC ===== */}
      {mode === "misc" && (
        <>
          <div className="tt-header">
            <span className="tt-dot" /> <b>Miscellaneous — {city}</b>
          </div>

          <div className="tt-grid">
            <Section title="Know before you go">
              <Pill href={L.wikiVoy(city)}>Wikivoyage</Pill>
              <Pill href={L.wiki(city)}>Wikipedia</Pill>
              <Pill href={L.xe()}>XE currency</Pill>
              <Pill href={L.state()}>US State Dept</Pill>
            </Section>

            <Section title="Weather">
              <Pill href={L.weather()}>Weather</Pill>
            </Section>

            <Section title="Pharmacies">
              <Pill href={L.gmaps(city, "pharmacy")}>Google Maps</Pill>
            </Section>

            <Section title="Car rental">
              <Pill href={L.cars()}>Search cars</Pill>
            </Section>
          </div>
        </>
      )}

      {/* Scoped styles to match your previous card/pill look */}
      <style jsx>{`
        .tt-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .tt-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          box-shadow: 0 0 0 2px #d1fae5 inset;
        }
        .tt-sections {
          display: grid;
          gap: 12px;
        }
        .tt-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        @media (max-width: 1100px) {
          .tt-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .tt-grid {
            grid-template-columns: 1fr;
          }
        }
        .tt-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          min-height: 120px;
        }
        .tt-card-title {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
        }
        .tt-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .tt-pill {
          display: inline-block;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 6px 12px;
          font-weight: 700;
          color: #0f172a;
          text-decoration: none;
          box-shadow: 0 1px 0 rgba(0,0,0,0.03);
        }
        .tt-pill:hover {
          border-color: #60a5fa;
          box-shadow: 0 2px 10px rgba(2,132,199,0.08);
        }
      `}</style>
    </div>
  );
}
