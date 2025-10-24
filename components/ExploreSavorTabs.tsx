"use client";

import React from "react";

type SubTab = "explore" | "savor" | "misc";

type Props = {
  /** City to show in the heading, e.g. "Boston" */
  city: string;
  /** ISO country codes (or any non-empty strings) used to detect international vs domestic */
  originCountry?: string | null;
  destCountry?: string | null;
  /** Which panel to show */
  mode: SubTab;
};

function pill(href: string, label: string) {
  return (
    <a
      key={label}
      className="chip"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

function section(title: string, children: React.ReactNode) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <div className="pills">{children}</div>
    </div>
  );
}

/** Normalizes city into a safe query string */
const q = (s: string) => encodeURIComponent(s.trim());

/** Simple city-aware link builders */
const gmaps = (term: string, city: string) =>
  `https://www.google.com/maps/search/${q(`${term} in ${city}`)}`;

const yelp = (term: string, city: string) =>
  `https://www.yelp.com/search?find_desc=${q(term)}&find_loc=${q(city)}`;

const tripadvisor = (term: string, city: string) =>
  `https://www.tripadvisor.com/Search?q=${q(`${term} ${city}`)}`;

const wikivoyage = (city: string) =>
  `https://en.wikivoyage.org/wiki/${q(city)}`;

const wikipedia = (city: string) =>
  `https://en.wikipedia.org/wiki/${q(city)}`;

const lonelyPlanet = (city: string) =>
  `https://www.lonelyplanet.com/search?q=${q(city)}`;

const timeoutCity = (city: string) =>
  `https://www.timeout.com/search?query=${q(city)}`;

const xeCurrency = () => `https://www.xe.com/currencyconverter/`;
const usStateDept = (city: string) =>
  `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/`;

const weather = (city: string) =>
  `https://www.google.com/search?q=${q(`weather ${city}`)}`;

const searchCars = (city: string) =>
  `https://www.google.com/search?q=${q(`car rental ${city}`)}`;

/** International-only dining (example providers common outside US) */
const zomato = (city: string) =>
  `https://www.zomato.com/search?order=asc&q=${q(city)}`;
const eazydiner = (city: string) =>
  `https://www.eazydiner.com/${q(city)}`;

export default function ExploreSavorTabs({
  city,
  originCountry,
  destCountry,
  mode,
}: Props) {
  const isInternational =
    !!originCountry &&
    !!destCountry &&
    originCountry.toLowerCase() !== destCountry.toLowerCase();

  return (
    <div className="wrap">
      {/* Heading: e.g., Explore — Boston / Savor — New Delhi */}
      <div className="heading">
        <span
          className={`dot ${
            mode === "explore" ? "green" : mode === "savor" ? "blue" : "amber"
          }`}
          aria-hidden
        />
        <strong className="title">
          {mode === "explore"
            ? "Explore"
            : mode === "savor"
            ? "Savor"
            : "Miscellaneous"}{" "}
          — {city}
        </strong>
      </div>

      {/* Panels */}
      {mode === "explore" && (
        <div className="grid">
          {section(
            "Top sights",
            <>
              {pill(gmaps("top sights", city), "Google Maps")}
              {pill(tripadvisor("top sights", city), "Tripadvisor")}
              {pill(lonelyPlanet(city), "Lonely Planet")}
              {pill(timeoutCity(city), "Time Out")}
            </>
          )}
          {section(
            "Parks & views",
            <>
              {pill(gmaps("parks viewpoints", city), "Google Maps")}
              {pill(tripadvisor("parks", city), "Tripadvisor")}
            </>
          )}
          {section(
            "Museums",
            <>
              {pill(gmaps("museums", city), "Google Maps")}
              {pill(tripadvisor("museums", city), "Tripadvisor")}
            </>
          )}
          {section(
            "Family",
            <>
              {pill(gmaps("family activities", city), "Google Maps")}
              {pill(tripadvisor("kids family", city), "Tripadvisor")}
            </>
          )}
          {section(
            "Nightlife",
            <>
              {pill(gmaps("nightlife", city), "Google Maps")}
              {pill(tripadvisor("nightlife", city), "Tripadvisor")}
              {pill(timeoutCity(city), "Time Out")}
            </>
          )}
          {section(
            "Guides",
            <>
              {pill(wikivoyage(city), "Wikivoyage")}
              {pill(wikipedia(city), "Wikipedia")}
            </>
          )}
        </div>
      )}

      {mode === "savor" && (
        <div className="grid">
          {section(
            "Best restaurants",
            <>
              {pill(yelp("best restaurants", city), "Yelp")}
              {pill(gmaps("best restaurants", city), "Google Maps")}
              {isInternational && pill(zomato(city), "Zomato")}
            </>
          )}
          {section(
            "Local eats",
            <>
              {pill(yelp("local eats", city), "Yelp")}
              {pill(gmaps("local food", city), "Google Maps")}
            </>
          )}
          {section(
            "Cafés & coffee",
            <>
              {pill(gmaps("cafes coffee", city), "Google Maps")}
              {pill(yelp("coffee", city), "Yelp")}
            </>
          )}
          {section(
            "Street food",
            <>
              {pill(gmaps("street food", city), "Google Maps")}
              {pill(yelp("street food", city), "Yelp")}
            </>
          )}
          {section(
            "Desserts",
            <>
              {pill(gmaps("desserts", city), "Google Maps")}
              {pill(yelp("dessert", city), "Yelp")}
            </>
          )}
          {isInternational &&
            section(
              "Regional dining",
              <>
                {pill(zomato(city), "Zomato")}
                {pill(eazydiner(city), "EazyDiner")}
              </>
            )}
        </div>
      )}

      {mode === "misc" && (
        <div className="grid">
          {section(
            "Know before you go",
            <>
              {pill(wikivoyage(city), "Wikivoyage")}
              {pill(wikipedia(city), "Wikipedia")}
              {pill(xeCurrency(), "XE currency")}
              {pill(usStateDept(city), "US State Dept")}
            </>
          )}
          {section("Weather", <>{pill(weather(city), "Weather")}</>)}
          {section(
            "Pharmacies",
            <>{pill(gmaps("pharmacies", city), "Google Maps")}</>
          )}
          {section("Car rental", <>{pill(searchCars(city), "Search cars")}</>)}
        </div>
      )}

      <style jsx>{`
        .wrap {
          width: 100%;
        }
        .heading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px 14px 6px;
        }
        .title {
          font-size: 16px;
          font-weight: 800;
          color: var(--c-ink-strong, #0f172a);
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 0 2px #fff;
        }
        .dot.green {
          background: #10b981;
        }
        .dot.blue {
          background: #3b82f6;
        }
        .dot.amber {
          background: #f59e0b;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        .card {
          background: var(--c-card, #fff);
          border: 1px solid var(--c-line, #e2e8f0);
          border-radius: 12px;
          padding: 14px;
        }
        .card h4 {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: var(--c-ink-strong, #0f172a);
        }
        .pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid var(--c-line, #e2e8f0);
          border-radius: 10px;
          background: #fff;
          text-decoration: none;
          color: var(--c-ink-strong, #0f172a);
          font-weight: 700;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
        }
        .chip:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
