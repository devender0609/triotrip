// lib/savorExplore.ts
// Region-aware link builders + robust country resolution + provider availability rules.

type CC = "AF"|"AS"|"EU"|"NA"|"OC"|"SA"|"AN";

export const countryToContinent: Record<string, CC> = {
  // North America
  US:"NA", CA:"NA", MX:"NA",
  // South America
  BR:"SA", AR:"SA", CL:"SA", PE:"SA", CO:"SA",
  // Europe (subset + GB)
  GB:"EU", IE:"EU", FR:"EU", DE:"EU", IT:"EU", ES:"EU", PT:"EU", NL:"EU", BE:"EU", CH:"EU", AT:"EU",
  SE:"EU", NO:"EU", DK:"EU", FI:"EU", IS:"EU", CZ:"EU", PL:"EU", GR:"EU", RO:"EU", HU:"EU", TR:"EU",
  // Oceania
  AU:"OC", NZ:"OC",
  // Asia (subset)
  JP:"AS", KR:"AS", CN:"AS", IN:"AS", AE:"AS", SG:"AS", HK:"AS", TH:"AS", MY:"AS", PH:"AS", VN:"AS", ID:"AS", QA:"AS", KW:"AS", SA:"AS",
  // Africa (a few)
  ZA:"AF", EG:"AF",
};

const NAME_SYNONYM_TO_CC: Record<string,string> = {
  "united states":"US","usa":"US","u.s.a.":"US","us":"US","america":"US",
  "united kingdom":"GB","uk":"GB","great britain":"GB","england":"GB",
  "uae":"AE","united arab emirates":"AE",
  "south korea":"KR","republic of korea":"KR","korea":"KR",
  "hong kong":"HK","singapore":"SG","japan":"JP","china":"CN","india":"IN","australia":"AU","new zealand":"NZ",
  "france":"FR","germany":"DE","italy":"IT","spain":"ES","portugal":"PT","ireland":"IE","netherlands":"NL","belgium":"BE",
  "switzerland":"CH","austria":"AT","sweden":"SE","norway":"NO","denmark":"DK","finland":"FI","iceland":"IS",
  "czechia":"CZ","czech republic":"CZ","greece":"GR","poland":"PL","romania":"RO","hungary":"HU","turkey":"TR",
  "mexico":"MX","canada":"CA","brazil":"BR","argentina":"AR","chile":"CL","peru":"PE","colombia":"CO",
  "south africa":"ZA","egypt":"EG","thailand":"TH","malaysia":"MY","philippines":"PH","vietnam":"VN","indonesia":"ID",
  "qatar":"QA","kuwait":"KW","saudi arabia":"SA",
};

export function resolveCountryCodeRough(countryName?: string): string | undefined {
  if (!countryName) return;
  const s = countryName.trim().toLowerCase();
  return NAME_SYNONYM_TO_CC[s];
}

export function resolveCountryFromDisplay(display?: string): {name?: string; code?: string} {
  if (!display) return {};
  // Strip IATA codes like (DEL), symbols, extra whitespace
  const cleaned = display.replace(/\([A-Z]{3}\)/g, " ").replace(/[–—]/g, "-").replace(/\s{2,}/g, " ").trim();
  const tokens = cleaned.split(/[,|-]+/).map(t => t.trim()).filter(Boolean);

  // Look from right to left for a known country word
  for (let i = tokens.length - 1; i >= 0; i--) {
    const guess = tokens[i];
    const code = resolveCountryCodeRough(guess);
    if (code) return { name: capitalizeWords(guess), code };
  }
  // Handle common short forms in airport-only entries (e.g., "New Delhi (DEL)")
  const last = tokens[tokens.length-1] || "";
  const c2 = resolveCountryCodeRough(last);
  if (c2) return { name: capitalizeWords(last), code: c2 };

  // Give up gently
  return {};
}

const capitalizeWords = (s: string) => s.replace(/\b[a-z]/g, m => m.toUpperCase());

/* ------------------- Providers ------------------- */

export const href = {
  // Core maps & info (global)
  gmaps: (city: string, q?: string) =>
    `https://www.google.com/maps/search/${encodeURIComponent(((q ? q + " " : "") + city).trim())}`,
  tripadvisor: (q: string, city: string) =>
    `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q || city)}`,
  lonelyplanet: (city: string) =>
    `https://www.lonelyplanet.com/search?q=${encodeURIComponent(city)}`,
  timeout: (city: string) =>
    `https://www.timeout.com/search?query=${encodeURIComponent(city)}`,
  wiki: (city: string) =>
    `https://en.wikipedia.org/wiki/${encodeURIComponent(city.replace(/\s+/g, "_"))}`,
  wikivoyage: (city: string) =>
    `https://en.wikivoyage.org/wiki/${encodeURIComponent(city.replace(/\s+/g, "_"))}`,
  xe: (city: string) =>
    `https://www.xe.com/currencyconverter/?search=${encodeURIComponent(city)}`,
  weather: (city: string) =>
    `https://www.google.com/search?q=${encodeURIComponent("weather " + city)}`,
  pharmacies: (city: string) =>
    `https://www.google.com/maps/search/${encodeURIComponent("pharmacies " + city)}`,
  cars: (city: string) =>
    `https://www.google.com/search?q=${encodeURIComponent("car rental " + city)}`,

  // Dining / reservations (global-ish)
  yelp: (q: string, city: string) =>
    `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=${encodeURIComponent(city)}`,
  opentable: (city: string) =>
    `https://www.opentable.com/s?term=${encodeURIComponent(city)}`,
  michelin: (city: string) =>
    `https://guide.michelin.com/en/search?q=&city=${encodeURIComponent(city)}`,

  // Regional maps & dining
  baiduMap: (city: string) => `https://map.baidu.com/search/${encodeURIComponent(city)}`,
  dianping: (city: string) => `https://www.dianping.com/search/keyword/0/0_${encodeURIComponent(city)}`,
  tabelog: (city: string) => `https://tabelog.com/en/rstLst/?sa=${encodeURIComponent(city)}`,
  naverMap: (city: string) => `https://map.naver.com/p/search/${encodeURIComponent(city)}`,
  kakaoMap: (city: string) => `https://map.kakao.com/?q=${encodeURIComponent(city)}`,
  mangoPlate: (city: string) => `https://www.mangoplate.com/search/${encodeURIComponent(city)}`,
  zomato: (city: string) => `https://www.zomato.com/search?place_name=${encodeURIComponent(city)}`,
  eazydiner: (city: string) => `https://www.eazydiner.com/${encodeURIComponent(city)}`,
  openrice: (city: string) => `https://www.openrice.com/en/hongkong/restaurants?what=&where=${encodeURIComponent(city)}`,
  thefork: (city: string) => `https://www.thefork.com/search/?city=${encodeURIComponent(city)}`,
  quandoo: (city: string) => `https://www.quandoo.com/en/find?query=${encodeURIComponent(city)}`,

  // Advisories
  usStateDept: () => `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`,
  ukFCDO: (countryName?: string) =>
    `https://www.gov.uk/foreign-travel-advice${countryName ? "/" + encodeURIComponent(countryName.toLowerCase().replace(/\s+/g,"-")) : ""}`,
  caTravel: (countryName?: string) =>
    `https://travel.gc.ca/destinations${countryName ? "/" + encodeURIComponent(countryName.toLowerCase().replace(/\s+/g,"-")) : ""}`,
  auSmartraveller: (countryName?: string) =>
    `https://www.smartraveller.gov.au/destinations${countryName ? "/" + encodeURIComponent(countryName.toLowerCase().replace(/\s+/g,"-")) : ""}`,
};

export type Provider = { label: string; url: string; id: string };

const dedupe = (arr: Provider[]) => {
  const seen = new Set<string>();
  return arr.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
};

/* ------------------- Availability rules -------------------
   We *hide* weak providers for certain countries and *add* strong regionals.
   Examples:
   - IN: hide Yelp/OpenTable/Michelin (spotty), add Zomato + EazyDiner.
   - CN: add Baidu/Dianping; (keep Google Maps, but users may prefer Baidu).
   - JP: add Tabelog.
   - KR: add MangoPlate (+ Naver/Kakao maps in Explore extras).
   - HK/SG/MY/TH/PH/VN: add OpenRice.
   - EU/GB/AU: add TheFork/Quandoo.
*/
const RESERVATION_STRONG: (cc: string) => Provider[] = (cc) => {
  const regionals: Provider[] = [];
  const continent = countryToContinent[cc];

  // EU / GB / AU
  if (continent === "EU" || cc === "GB") {
    regionals.push({ id:"thefork", label:"TheFork", url:href.thefork("{CITY}") });
    regionals.push({ id:"quandoo", label:"Quandoo", url:href.quandoo("{CITY}") });
  }
  if (cc === "AU") {
    regionals.push({ id:"thefork", label:"TheFork", url:href.thefork("{CITY}") });
  }
  // SEA / HK / SG
  if (["HK","SG","MY","TH","PH","VN"].includes(cc)) {
    regionals.push({ id:"openrice", label:"OpenRice", url:href.openrice("{CITY}") });
  }
  // JP / KR / CN / IN / GCC
  if (cc === "JP") regionals.push({ id:"tabelog", label:"Tabelog", url:href.tabelog("{CITY}") });
  if (cc === "KR") regionals.push({ id:"mangoplate", label:"MangoPlate", url:href.mangoPlate("{CITY}") });
  if (cc === "CN") regionals.push({ id:"dianping", label:"Dianping", url:href.dianping("{CITY}") });
  if (["IN","AE","SA","QA","KW"].includes(cc)) {
    regionals.push({ id:"zomato", label:"Zomato", url:href.zomato("{CITY}") });
    if (cc === "IN") regionals.push({ id:"eazydiner", label:"EazyDiner", url:href.eazydiner("{CITY}") });
  }
  return regionals;
};

const HIDE_GLOBAL_IN_COUNTRY: Record<string, {yelp?:boolean; opentable?:boolean; michelin?:boolean}> = {
  IN: { yelp: true, opentable: true, michelin: true },
  CN: { yelp: true, opentable: true }, // Michelin has some CN cities, still often not helpful for casual trips
  JP: { yelp: true, opentable: true },
  KR: { yelp: true, opentable: true },
  HK: { yelp: true }, SG: { yelp: true },
  MY: { yelp: true }, TH: { yelp: true }, PH: { yelp: true }, VN: { yelp: true },
  AE: { yelp: true }, SA: { yelp: true }, QA: { yelp: true }, KW: { yelp: true },
};

function applyCity(url: string, city: string) { return url.replace("{CITY}", city); }

/* ------------------- Public builders ------------------- */

export function exploreSet(city: string, countryCode?: string): Provider[] {
  const cc = (countryCode || "").toUpperCase();
  const list: Provider[] = [
    { id: "gmaps", label: "Google Maps", url: href.gmaps(city, "top attractions") },
    { id: "tripadvisor", label: "Tripadvisor", url: href.tripadvisor("top attractions", city) },
    { id: "lonelyplanet", label: "Lonely Planet", url: href.lonelyplanet(city) },
    { id: "timeout", label: "Time Out", url: href.timeout(city) },
  ];
  // CN primary local map; KR extras
  if (cc === "CN") list.unshift({ id: "baidu", label: "Baidu Maps", url: href.baiduMap(city) });
  if (cc === "KR") {
    list.push({ id:"naver", label:"Naver Map", url:href.naverMap(city) });
    list.push({ id:"kakao", label:"Kakao Map", url:href.kakaoMap(city) });
  }
  return dedupe(list);
}

export function savorSet(city: string, countryCode?: string): Provider[] {
  const cc = (countryCode || "").toUpperCase();
  const base: Provider[] = [];

  const hide = HIDE_GLOBAL_IN_COUNTRY[cc] || {};
  // Global-ish (conditionally included)
  if (!hide.yelp) base.push({ id: "yelp", label: "Yelp", url: href.yelp("restaurants", city) });
  if (!hide.opentable) base.push({ id: "opentable", label: "OpenTable", url: href.opentable(city) });
  if (!hide.michelin) base.push({ id: "michelin", label: "Michelin", url: href.michelin(city) });

  // Regionals
  const extras = RESERVATION_STRONG(cc).map(p => ({ ...p, url: applyCity(p.url, city) }));

  // Always include a Google Maps food query for safety
  const mapsFood: Provider = { id: "gmaps", label: "Google Maps", url: href.gmaps(city, "best restaurants") };

  return dedupe([...extras, ...base, mapsFood]);
}

export function miscSet(city: string, countryName?: string, countryCode?: string): Provider[] {
  const cc = (countryCode || "").toUpperCase();
  const list: Provider[] = [
    { id: "wikivoyage", label: "Wikivoyage", url: href.wikivoyage(city) },
    { id: "wikipedia", label: "Wikipedia", url: href.wiki(city) },
    { id: "xe", label: "XE currency", url: href.xe(city) },
    { id: "weather", label: "Weather", url: href.weather(city) },
    { id: "pharmacies", label: "Google Maps (Pharmacies)", url: href.pharmacies(city) },
    { id: "cars", label: "Search cars", url: href.cars(city) },
    { id: "us", label: "US State Dept", url: href.usStateDept() },
    { id: "uk", label: "UK FCDO", url: href.ukFCDO(countryName) },
    { id: "ca", label: "Canada Travel", url: href.caTravel(countryName) },
    { id: "au", label: "Australia Smartraveller", url: href.auSmartraveller(countryName) },
  ];
  if (cc === "CN") {
    list.unshift({ id: "baidu", label: "Baidu Maps", url: href.baiduMap(city) });
  }
  return dedupe(list);
}
