// lib/providersLinks.ts

export type ProviderLinks = {
  maps: (city: string, q?: string) => string;
  tripadvisor: (city: string, q?: string) => string;
  timeout: (city: string, q?: string) => string;
  wikivoyage: (city: string) => string;
  wikipedia: (city: string) => string;
  yelp: (city: string, q?: string) => string;
  openTable: (city: string) => string;
  michelin: (city: string) => string;
  zomato: (city: string) => string;
  eazyDiner: (city: string) => string;
  xe: () => string;
  usStateDept: (city?: string) => string;
  weather: (city?: string) => string;
  cars: (city?: string) => string;
};

/** Robust link builders (work globally; no API keys) */
const maps = (city: string, q?: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent([q, city].filter(Boolean).join(" in "))}`;
const tripadvisor = (city: string, q?: string) =>
  `https://www.tripadvisor.com/Search?q=${encodeURIComponent([q, city].filter(Boolean).join(" "))}`;
const timeout = (city: string, q?: string) =>
  `https://www.timeout.com/search?query=${encodeURIComponent([q, city].filter(Boolean).join(" "))}`;
const wikivoyage = (city: string) =>
  `https://en.wikivoyage.org/wiki/${encodeURIComponent(city)}`;
const wikipedia = (city: string) =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(city)}`;
const yelp = (city: string, q?: string) =>
  `https://www.yelp.com/search?find_desc=${encodeURIComponent(q || "")}&find_loc=${encodeURIComponent(city)}`;
const openTable = (city: string) =>
  `https://www.opentable.com/s?term=${encodeURIComponent(city)}`;
const michelin = (city: string) =>
  `https://guide.michelin.com/en/search?q=${encodeURIComponent(city)}`;
const zomato = (city: string) =>
  `https://www.zomato.com/search?entity_type=city&q=${encodeURIComponent(city)}`;
const eazyDiner = (city: string) =>
  `https://www.eazydiner.com/${encodeURIComponent(city)}`;
const xe = () => `https://www.xe.com/currencyconverter/`;
const usStateDept = (_city?: string) =>
  `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/`;
const weather = (city?: string) =>
  city
    ? `https://www.weather.com/weather/today/l/${encodeURIComponent(city)}`
    : `https://www.weather.com/`;
const cars = (city?: string) =>
  city
    ? `https://www.kayak.com/cars/${encodeURIComponent(city)}`
    : `https://www.kayak.com/cars`;

export function providerLinksFor(_international: boolean): ProviderLinks {
  // For now the same builders; your component decides what to show for intl only (e.g., Regional dining)
  return {
    maps,
    tripadvisor,
    timeout,
    wikivoyage,
    wikipedia,
    yelp,
    openTable,
    michelin,
    zomato,
    eazyDiner,
    xe,
    usStateDept,
    weather,
    cars,
  };
}
