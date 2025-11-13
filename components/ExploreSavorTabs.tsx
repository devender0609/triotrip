"use client";

import React from "react";

// ===== Types =====
type Props = {
  city: string;
  /** Optional: if true we add “Regional dining” under Savor.  */
  isInternational?: boolean;
  /** Which panel is visible; the others are hidden so the page isn’t crowded. */
  active: "explore" | "savor" | "misc";
};

/** Gradient chip */
function Chip({
  href,
  children,
  title,
}: {
  href: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="tt-chip"
    >
      {children}
      <style jsx>{`
        .tt-chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 700;
          text-decoration: none;
          color: #0f172a;
          background: linear-gradient(90deg, #fdfbfb 0%, #ebedee 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(2, 6, 23, 0.06);
          transition: transform 0.05s ease, box-shadow 0.2s ease,
            background 0.2s ease;
          white-space: nowrap;
        }
        .tt-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(2, 6, 23, 0.08);
          background: linear-gradient(90deg, #e0f2fe, #f0f9ff);
        }
      `}</style>
    </a>
  );
}

/** Section card */
function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tt-card">
      <div className="tt-card__title">{title}</div>
      <div className="tt-card__chips">{children}</div>

      <style jsx>{`
        .tt-card {
          border: 1px solid #e6eef7;
          border-radius: 14px;
          padding: 14px;
          background: linear-gradient(180deg, #ffffff, #f8fbff);
          box-shadow: inset 0 1px 0 #fff, 0 8px 20px rgba(2, 6, 23, 0.04);
          min-height: 108px;
        }
        .tt-card__title {
          font-weight: 800;
          color: #0b3b52;
          margin-bottom: 10px;
        }
        .tt-card__chips {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

// Safe Google links
const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const wiki = (q: string) =>
  `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`;
const wikivoyage = (q: string) =>
  `https://en.wikivoyage.org/w/index.php?search=${encodeURIComponent(q)}`;
const tripadvisor = (q: string) =>
  `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q)}`;
const yelp = (q: string) =>
  `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}`;
const xe = () => "https://www.xe.com/currencyconverter/";
const stateDept = (q: string) =>
  `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/`;
const weather = (q: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(q + " weather")}`;
const carRent = (q: string) =>
  `https://www.google.com/travel/search?q=${encodeURIComponent(
    `car rental ${q}`
  )}`;

export default function ExploreSavorTabs({
  city,
  isInternational,
  active,
}: Props) {
  // Heuristic fallback if prop not provided
  const intl =
    typeof isInternational === "boolean"
      ? isInternational
      : /[,]|(, )/.test(city) || /delhi|paris|tokyo|dubai|london|rome|madrid|bangkok|singapore/i.test(city);

  return (
    <div className="wrapper">
      {/* Explore */}
      {active === "explore" && (
        <>
          <h3 className="panelTitle">
            <span className="dot dot--green" /> Explore — {city}
          </h3>
          <div className="grid">
            <Box title="Top sights">
              <Chip href={gmaps(`${city} top sights`)}>Google Maps</Chip>
              <Chip href={tripadvisor(`${city} attractions`)}>Tripadvisor</Chip>
              <Chip href={gmaps(`${city} landmarks`)}>Time Out</Chip>
            </Box>

            <Box title="Parks & views">
              <Chip href={gmaps(`${city} parks`)}>Google Maps</Chip>
              <Chip href={tripadvisor(`${city} parks`)}>Tripadvisor</Chip>
            </Box>

            <Box title="Museums">
              <Chip href={gmaps(`${city} museums`)}>Google Maps</Chip>
              <Chip href={tripadvisor(`${city} museums`)}>Tripadvisor</Chip>
            </Box>

            <Box title="Family">
              <Chip href={gmaps(`${city} family attractions`)}>
                Google Maps
              </Chip>
              <Chip href={tripadvisor(`${city} for kids`)}>Tripadvisor</Chip>
            </Box>

            <Box title="Nightlife">
              <Chip href={gmaps(`${city} nightlife`)}>Google Maps</Chip>
              <Chip href={tripadvisor(`${city} nightlife`)}>Tripadvisor</Chip>
              <Chip href={gmaps(`${city} events`)}>Time Out</Chip>
            </Box>

            <Box title="Guides">
              <Chip href={wikivoyage(city)}>Wikivoyage</Chip>
              <Chip href={wiki(city)}>Wikipedia</Chip>
            </Box>
          </div>
        </>
      )}

      {/* Savor */}
      {active === "savor" && (
        <>
          <h3 className="panelTitle">
            <span className="dot dot--blue" /> Savor — {city}
          </h3>
          <div className="grid">
            <Box title="Best restaurants">
              <Chip href={yelp(`${city} best restaurants`)}>Yelp</Chip>
              <Chip href={gmaps(`${city} restaurants`)}>Google Maps</Chip>
              <Chip href={yelp(`${city} michelin`)}>Michelin</Chip>
            </Box>

            <Box title="Local eats">
              <Chip href={yelp(`${city} local food`)}>Yelp</Chip>
              <Chip href={gmaps(`${city} local food`)}>Google Maps</Chip>
            </Box>

            <Box title="Cafés & coffee">
              <Chip href={gmaps(`${city} cafes`)}>Google Maps</Chip>
              <Chip href={yelp(`${city} coffee`)}>Yelp</Chip>
            </Box>

            <Box title="Street food">
              <Chip href={gmaps(`${city} street food`)}>Google Maps</Chip>
              <Chip href={yelp(`${city} street food`)}>Yelp</Chip>
            </Box>

            <Box title="Desserts">
              <Chip href={gmaps(`${city} desserts`)}>Google Maps</Chip>
              <Chip href={yelp(`${city} desserts`)}>Yelp</Chip>
            </Box>

            {intl && (
              <Box title="Regional dining">
                <Chip href={`https://www.zomato.com/search?cuisines=&q=${encodeURIComponent(city)}`}>
                  Zomato
                </Chip>
                <Chip href={`https://www.eazydiner.com/${encodeURIComponent(city)}`}>
                  EazyDiner
                </Chip>
              </Box>
            )}
          </div>
        </>
      )}

      {/* Misc */}
      {active === "misc" && (
        <>
          <h3 className="panelTitle">
            <span className="dot dot--gold" /> Miscellaneous — {city}
          </h3>
          <div className="grid">
            <Box title="Know before you go">
              <Chip href={wikivoyage(`${city} travel guide`)}>Wikivoyage</Chip>
              <Chip href={wiki(city)}>Wikipedia</Chip>
              <Chip href={xe()}>XE currency</Chip>
              <Chip href={stateDept(city)}>US State Dept</Chip>
            </Box>

            <Box title="Weather">
              <Chip href={weather(city)}>Weather</Chip>
            </Box>

            <Box title="Pharmacies">
              <Chip href={gmaps(`${city} pharmacy`)}>Google Maps</Chip>
            </Box>

            <Box title="Car rental">
              <Chip href={carRent(city)}>Search cars</Chip>
            </Box>
          </div>
        </>
      )}

      <style jsx>{`
        .wrapper {
          display: grid;
          gap: 12px;
        }
        .panelTitle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-weight: 900;
          color: #0b3b52;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.08);
        }
        .dot--green {
          background: #10b981;
        }
        .dot--blue {
          background: #0ea5e9;
        }
        .dot--gold {
          background: #f59e0b;
        }
        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
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
      `}</style>
    </div>
  );
}
