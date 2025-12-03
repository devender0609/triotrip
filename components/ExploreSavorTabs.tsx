import React from "react";

type Props = {
  city: string;
  active: "explore" | "savor" | "misc";
};

// Map common airport codes to real city names
const airportCityMap: Record<string, string> = {
  AUS: "Austin",
  BOS: "Boston",
  JFK: "New York",
  LGA: "New York",
  EWR: "New York",
  DEL: "New Delhi",
  BOM: "Mumbai",
  LHR: "London",
  LGW: "London",
  CDG: "Paris",
  AMS: "Amsterdam",
  SFO: "San Francisco",
  LAX: "Los Angeles",
  ORD: "Chicago",
  DAL: "Dallas",
  DFW: "Dallas",
  MIA: "Miami",
  SEA: "Seattle",
  LAS: "Las Vegas",
  HNL: "Honolulu",
};

const resolveCityFromCode = (raw: string): string => {
  if (!raw) return "your destination";
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();

  // If it's an IATA-style code and in our map, use mapped city
  if (upper.length === 3 && airportCityMap[upper]) {
    return airportCityMap[upper];
  }

  // Otherwise just use what we got, but nicer casing
  return trimmed;
};

const normCity = (city: string) =>
  city && city !== "Destination" ? city : "your destination";

const encodeCity = (city: string) => encodeURIComponent(city || "city");

const ExploreSavorTabs: React.FC<Props> = ({ city, active }) => {
  const resolvedCity = resolveCityFromCode(city);
  const cityName = normCity(resolvedCity);
  const q = encodeCity(resolvedCity);

  const chip = (label: string, href: string) => (
    <a
      key={label + href}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="es-chip"
    >
      {label}
    </a>
  );

  const titleRow = (label: string, colorClass: string) => (
    <div className="es-title-row">
      <span className={`es-dot ${colorClass}`} />
      <span className="es-title">
        {label} — {cityName}
      </span>
    </div>
  );

  if (active === "explore") {
    const mapsTopSights = `https://www.google.com/maps/search/top+sights+in+${q}`;
    const tripTopSights = `https://www.tripadvisor.com/Search?q=${q}+attractions`;
    const timeoutCity = `https://www.timeout.com/search?query=${q}`;

    const mapsParks = `https://www.google.com/maps/search/parks+in+${q}`;
    const tripParks = `https://www.tripadvisor.com/Search?q=${q}+parks`;

    const mapsMuseums = `https://www.google.com/maps/search/museums+in+${q}`;
    const tripMuseums = `https://www.tripadvisor.com/Search?q=${q}+museums`;

    const mapsFamily = `https://www.google.com/maps/search/family+activities+in+${q}`;
    const tripFamily = `https://www.tripadvisor.com/Search?q=${q}+family+activities`;

    const mapsNightlife = `https://www.google.com/maps/search/nightlife+in+${q}`;
    const tripNightlife = `https://www.tripadvisor.com/Search?q=${q}+nightlife`;

    const wikiVoyage = `https://en.wikivoyage.org/wiki/${resolvedCity.replace(
      /\s+/g,
      "_"
    )}`;
    const wiki = `https://en.wikipedia.org/wiki/${resolvedCity.replace(
      /\s+/g,
      "_"
    )}`;

    return (
      <div className="es-root">
        {titleRow("Explore", "dot-explore")}
        <div className="es-grid">
          <div className="es-card">
            <div className="es-card-title">Top sights</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsTopSights)}
              {chip("Tripadvisor", tripTopSights)}
              {chip("Time Out", timeoutCity)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Parks & views</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsParks)}
              {chip("Tripadvisor", tripParks)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Museums</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsMuseums)}
              {chip("Tripadvisor", tripMuseums)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Family</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsFamily)}
              {chip("Tripadvisor", tripFamily)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Nightlife</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsNightlife)}
              {chip("Tripadvisor", tripNightlife)}
              {chip("Time Out", timeoutCity)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Guides</div>
            <div className="es-chip-row">
              {chip("Wikivoyage", wikiVoyage)}
              {chip("Wikipedia", wiki)}
            </div>
          </div>
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  if (active === "savor") {
    const mapsRestaurants = `https://www.google.com/maps/search/restaurants+in+${q}`;
    const yelpRestaurants = `https://www.yelp.com/search?cflt=restaurants&find_loc=${q}`;
    const michelin = `https://guide.michelin.com/search?q=${q}`;

    const mapsCafes = `https://www.google.com/maps/search/cafes+in+${q}`;
    const yelpCafes = `https://www.yelp.com/search?cflt=coffee&find_loc=${q}`;

    const mapsLocal = `https://www.google.com/maps/search/local+food+in+${q}`;
    const yelpLocal = `https://www.yelp.com/search?find_desc=Local+Food&find_loc=${q}`;

    const mapsStreet = `https://www.google.com/maps/search/street+food+in+${q}`;
    const yelpStreet = `https://www.yelp.com/search?find_desc=Street+Food&find_loc=${q}`;

    const mapsDesserts = `https://www.google.com/maps/search/dessert+in+${q}`;
    const yelpDesserts = `https://www.yelp.com/search?find_desc=Dessert&find_loc=${q}`;

    return (
      <div className="es-root">
        {titleRow("Savor", "dot-savor")}
        <div className="es-grid">
          <div className="es-card">
            <div className="es-card-title">Best restaurants</div>
            <div className="es-chip-row">
              {chip("Yelp", yelpRestaurants)}
              {chip("Google Maps", mapsRestaurants)}
              {chip("Michelin", michelin)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Local eats</div>
            <div className="es-chip-row">
              {chip("Yelp", yelpLocal)}
              {chip("Google Maps", mapsLocal)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Cafés & coffee</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsCafes)}
              {chip("Yelp", yelpCafes)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Street food</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsStreet)}
              {chip("Yelp", yelpStreet)}
            </div>
          </div>

          <div className="es-card">
            <div className="es-card-title">Desserts</div>
            <div className="es-chip-row">
              {chip("Google Maps", mapsDesserts)}
              {chip("Yelp", yelpDesserts)}
            </div>
          </div>
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  // misc
  const wikiVoyage = `https://en.wikivoyage.org/wiki/${resolvedCity.replace(
    /\s+/g,
    "_"
  )}`;
  const wiki = `https://en.wikipedia.org/wiki/${resolvedCity.replace(
    /\s+/g,
    "_"
  )}`;
  const xe = `https://www.xe.com/currencyconverter/`;
  const usStateDept = `https://www.google.com/search?q=US+State+Department+travel+${q}`;
  const weather = `https://www.google.com/search?q=weather+${q}`;
  const mapsPharm = `https://www.google.com/maps/search/pharmacy+in+${q}`;
  const cars = `https://www.google.com/search?q=car+rental+${q}`;

  return (
    <div className="es-root">
      {titleRow("Miscellaneous", "dot-misc")}
      <div className="es-grid">
        <div className="es-card">
          <div className="es-card-title">Know before you go</div>
          <div className="es-chip-row">
            {chip("Wikivoyage", wikiVoyage)}
            {chip("Wikipedia", wiki)}
            {chip("XE currency", xe)}
            {chip("US State Dept", usStateDept)}
          </div>
        </div>

        <div className="es-card">
          <div className="es-card-title">Weather</div>
          <div className="es-chip-row">{chip("Weather", weather)}</div>
        </div>

        <div className="es-card">
          <div className="es-card-title">Pharmacies</div>
          <div className="es-chip-row">
            {chip("Google Maps", mapsPharm)}
          </div>
        </div>

        <div className="es-card">
          <div className="es-card-title">Car rental</div>
          <div className="es-chip-row">{chip("Search cars", cars)}</div>
        </div>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
};

const styles = `
  .es-root {
    display: grid;
    gap: 12px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }
  .es-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }
  .es-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }
  .dot-explore {
    background: #22c55e;
  }
  .dot-savor {
    background: #0ea5e9;
  }
  .dot-misc {
    background: #facc15;
  }
  .es-title {
    font-size: 18px;
    font-weight: 700;
  }
  .es-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
  .es-card {
    background: #f8fafc;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    padding: 14px 16px;
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
  }
  .es-card-title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #0f172a;
  }
  .es-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .es-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 14px;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
  }
  .es-chip:hover {
    border-color: #0ea5e9;
    box-shadow: 0 4px 10px rgba(56, 189, 248, 0.25);
  }
`;

export default ExploreSavorTabs;
