"use client";

import React from "react";

type Props = {
  city: string;                 // e.g., "Boston" or "New Delhi"
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

/** Very-reliable deep links only */
const maps = (city: string, q: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent(q)}+in+${encodeURIComponent(city)}`;
const trip = (city: string, q: string) =>
  `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q + " " + city)}`;
const timeout = (city: string) => `https://www.timeout.com/search?query=${encodeURIComponent(city)}`;
const wiki = (city: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(city)}`;
const wikivoy = (city: string) => `https://en.wikivoyage.org/wiki/${encodeURIComponent(city)}`;
const yelp = (city: string, q: string) =>
  `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=${encodeURIComponent(city)}`;
const opentable = (city: string) => `https://www.opentable.com/s?term=${encodeURIComponent(city)}`;
const michelin = (city: string) =>
  `https://www.thefork.com/search/?search-text=${encodeURIComponent(city)}`;
const zomato = (city: string) =>
  `https://www.zomato.com/search?entity_type=city&q=${encodeURIComponent(city)}`;
const eazy = (city: string) => `https://www.eazydiner.com/${encodeURIComponent(city)}`;
const xe = () => `https://www.xe.com/currencyconverter/`;
const usState = () =>
  `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/`;
const weather = () => `https://www.weather.com/`;
const cars = () => `https://www.kayak.com/cars`;

export default function ExploreSavorTabs({ city, mode }: Props) {
  return (
    <div className="tt-sections">
      {/* ===== EXPLORE ===== */}
      {mode === "explore" && (
        <>
          <div className="tt-header"><span className="tt-dot" /><b>Explore — {city}</b></div>
          <div className="tt-grid">
            <Section title="Top sights">
              <Pill href={maps(city, "top sights")}>Google Maps</Pill>
              <Pill href={trip(city, "things to do")}>Tripadvisor</Pill>
              <Pill href={timeout(city)}>Time Out</Pill>
            </Section>
            <Section title="Parks & views">
              <Pill href={maps(city, "parks")}>Google Maps</Pill>
              <Pill href={trip(city, "parks")}>Tripadvisor</Pill>
            </Section>
            <Section title="Museums">
              <Pill href={maps(city, "museums")}>Google Maps</Pill>
              <Pill href={trip(city, "museums")}>Tripadvisor</Pill>
            </Section>
            <Section title="Family">
              <Pill href={maps(city, "kids activities")}>Google Maps</Pill>
              <Pill href={trip(city, "family activities")}>Tripadvisor</Pill>
            </Section>
            <Section title="Nightlife">
              <Pill href={maps(city, "nightlife")}>Google Maps</Pill>
              <Pill href={trip(city, "nightlife")}>Tripadvisor</Pill>
              <Pill href={timeout(city)}>Time Out</Pill>
            </Section>
            <Section title="Guides">
              <Pill href={wikivoy(city)}>Wikivoyage</Pill>
              <Pill href={wiki(city)}>Wikipedia</Pill>
            </Section>
          </div>
        </>
      )}

      {/* ===== SAVOR ===== */}
      {mode === "savor" && (
        <>
          <div className="tt-header"><span className="tt-dot" /><b>Savor — {city}</b></div>
          <div className="tt-grid">
            <Section title="Best restaurants">
              <Pill href={yelp(city, "best restaurants")}>Yelp</Pill>
              <Pill href={opentable(city)}>OpenTable</Pill>
              <Pill href={michelin(city)}>Michelin</Pill>
            </Section>
            <Section title="Local eats">
              <Pill href={yelp(city, "local eats")}>Yelp</Pill>
              <Pill href={maps(city, "local food")}>Google Maps</Pill>
            </Section>
            <Section title="Cafés & coffee">
              <Pill href={maps(city, "coffee")}>Google Maps</Pill>
              <Pill href={yelp(city, "coffee")}>Yelp</Pill>
            </Section>
            <Section title="Street food">
              <Pill href={maps(city, "street food")}>Google Maps</Pill>
              <Pill href={yelp(city, "street food")}>Yelp</Pill>
            </Section>
            <Section title="Desserts">
              <Pill href={maps(city, "dessert")}>Google Maps</Pill>
              <Pill href={yelp(city, "dessert")}>Yelp</Pill>
            </Section>
            {/* Regional dining for international audiences */}
            <Section title="Regional dining">
              <Pill href={zomato(city)}>Zomato</Pill>
              <Pill href={eazy(city)}>EazyDiner</Pill>
            </Section>
          </div>
        </>
      )}

      {/* ===== MISC ===== */}
      {mode === "misc" && (
        <>
          <div className="tt-header"><span className="tt-dot" /><b>Miscellaneous — {city}</b></div>
          <div className="tt-grid">
            <Section title="Know before you go">
              <Pill href={wikivoy(city)}>Wikivoyage</Pill>
              <Pill href={wiki(city)}>Wikipedia</Pill>
              <Pill href={xe()}>XE currency</Pill>
              <Pill href={usState()}>US State Dept</Pill>
            </Section>
            <Section title="Weather">
              <Pill href={weather()}>Weather</Pill>
            </Section>
            <Section title="Pharmacies">
              <Pill href={maps(city, "pharmacy")}>Google Maps</Pill>
            </Section>
            <Section title="Car rental">
              <Pill href={cars()}>Search cars</Pill>
            </Section>
          </div>
        </>
      )}

      <style jsx>{`
        .tt-header { display:flex; align-items:center; gap:8px; color:#0f172a; margin-bottom:8px; }
        .tt-dot { width:10px; height:10px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 2px #d1fae5 inset; }
        .tt-sections { display:grid; gap:12px; }
        .tt-grid { display:grid; gap:12px; grid-template-columns:repeat(4, minmax(0,1fr)); }
        @media (max-width:1100px){ .tt-grid{ grid-template-columns:repeat(2, minmax(0,1fr)); } }
        @media (max-width:640px){ .tt-grid{ grid-template-columns:1fr; } }
        .tt-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:14px; min-height:120px; }
        .tt-card-title { font-weight:800; color:#0f172a; margin-bottom:12px; }
        .tt-pills { display:flex; flex-wrap:wrap; gap:10px 12px; }
        .tt-pill {
          display:inline-block; text-decoration:none; font-weight:700; color:#0f172a;
          background:#fff; border:1px solid #e2e8f0; border-radius:999px; padding:7px 12px;
          line-height:1; white-space:nowrap; box-shadow:0 1px 0 rgba(0,0,0,.03);
        }
        .tt-pill:hover { border-color:#60a5fa; box-shadow:0 2px 10px rgba(2,132,199,.1); }
      `}</style>
    </div>
  );
}
