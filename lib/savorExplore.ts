// lib/savorExplore.ts
// Region-aware providers + robust country resolution (text or IATA) + availability rules.

export type CC = "AF"|"AS"|"EU"|"NA"|"OC"|"SA"|"AN";

const countryToContinent: Record<string, CC> = {
  US:"NA", CA:"NA", MX:"NA",
  BR:"SA", AR:"SA", CL:"SA", PE:"SA", CO:"SA",
  GB:"EU", IE:"EU", FR:"EU", DE:"EU", IT:"EU", ES:"EU", PT:"EU", NL:"EU", BE:"EU", CH:"EU", AT:"EU",
  SE:"EU", NO:"EU", DK:"EU", FI:"EU", IS:"EU", CZ:"EU", PL:"EU", GR:"EU", RO:"EU", HU:"EU", TR:"EU",
  AU:"OC", NZ:"OC",
  JP:"AS", KR:"AS", CN:"AS", IN:"AS", AE:"AS", SG:"AS", HK:"AS", TH:"AS", MY:"AS", PH:"AS", VN:"AS", ID:"AS", QA:"AS", KW:"AS", SA:"AS",
  ZA:"AF", EG:"AF",
};

// Minimal IATA→country for India + common cases (extend as needed)
const IATA_TO_CC: Record<string, string> = {
  DEL:"IN", BOM:"IN", BLR:"IN", MAA:"IN", HYD:"IN", CCU:"IN", GOI:"IN", PNQ:"IN", AMD:"IN",
  COK:"IN", TRV:"IN", IXC:"IN", JAI:"IN", LKO:"IN", PAT:"IN", NAG:"IN", VNS:"IN",
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

export function resolveCountryFromDisplay(display?: string): {name?: string; code?: string} {
  if (!display) return {};
  const cleaned = display.replace(/\([A-Z]{3}\)/g, " ").replace(/[–—]/g, "-").replace(/\s{2,}/g, " ").trim();
  const tokens = cleaned.split(/[,|-]+/).map(t => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const guess = tokens[i].toLowerCase();
    const code = NAME_SYNONYM_TO_CC[guess];
    if (code) return { name: capitalize(tokens[i]), code };
  }
  return {};
}

export function resolveCountryFromIATA(iata?: string): {name?: string; code?: string} {
  if (!iata) return {};
  const code = IATA_TO_CC[iata.toUpperCase()];
  if (!code) return {};
  return { name: codeToName(code), code };
}

export function codeToName(code: string): string {
  const map: Record<string,string> = {
    US:"United States", GB:"United Kingdom", IN:"India", CN:"China", JP:"Japan", KR:"South Korea",
    AE:"United Arab Emirates", SG:"Singapore", HK:"Hong Kong", FR:"France", DE:"Germany", IT:"Italy",
    ES:"Spain", PT:"Portugal", IE:"Ireland", NL:"Netherlands", BE:"Belgium", CH:"Switzerland", AT:"Austria",
    CZ:"Czechia", PL:"Poland", GR:"Greece", RO:"Romania", HU:"Hungary", TR:"Turkey",
    SE:"Sweden", NO:"Norway", DK:"Denmark", FI:"Finland", IS:"Iceland",
    AU:"Australia", NZ:"New Zealand",
    BR:"Brazil", AR:"Argentina", CL:"Chile", PE:"Peru", CO:"Colombia",
    ZA:"South Africa", EG:"Egypt", TH:"Thailand", MY:"Malaysia", PH:"Philippines", VN:"Vietnam", ID:"Indonesia",
    QA:"Qatar", KW:"Kuwait", SA:"Saudi Arabia", MX:"Mexico", CA:"Canada"
  };
  return map[code] || code;
}

const capitalize = (s:string) => s.replace(/\b[a-z]/g, m => m.toUpperCase());

/* ---------- HREF builders ---------- */
export const href = {
  gmaps: (city: string, q?: string) => `https://www.google.com/maps/search/${encodeURIComponent(((q ? q + " " : "") + city).trim())}`,
  tripadvisor: (q: string, city: string) => `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q || city)}`,
  lonelyplanet: (city: string) => `https://www.lonelyplanet.com/search?q=${encodeURIComponent(city)}`,
  timeout: (city: string) => `https://www.timeout.com/search?query=${encodeURIComponent(city)}`,
  wiki: (city: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(city.replace(/\s+/g, "_"))}`,
  wikivoyage: (city: string) => `https://en.wikivoyage.org/wiki/${encodeURIComponent(city.replace(/\s+/g, "_"))}`,
  xe: (city: string) => `https://www.xe.com/currencyconverter/?search=${encodeURIComponent(city)}`,
  weather: (city: string) => `https://www.google.com/search?q=${encodeURIComponent("weather " + city)}`,
  pharmacies: (city: string) => `https://www.google.com/maps/search/${encodeURIComponent("pharmacies " + city)}`,
  cars: (city: string) => `https://www.google.com/search?q=${encodeURIComponent("car rental " + city)}`,
  yelp: (q: string, city: string) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=${encodeURIComponent(city)}`,
  opentable: (city: string) => `https://www.opentable.com/s?term=${encodeURIComponent(city)}`,
  michelin: (city: string) => `https://guide.michelin.com/en/search?q=&city=${encodeURIComponent(city)}`,
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
  usStateDept: () => `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`,
  ukFCDO: (countryName?: string) => `https://www.gov.uk/foreign-travel-advice${countryName ? "/" + encodeURIComponent(countryName.toLowerCase().replace(/\s+/g,"-")) : ""}`,
  caTravel: (countryName?: string) => `https://travel.gc.ca/destinations${countryName ? "/" + encodeURIComponent(countryName.toLowerCase().replace(/\s+/g,"-")) : ""}`,
  auSmartraveller: (countryName?: string) => `https://www.smartraveller.gov.au/destinations${countryName ? "/" + encodeURIComponent(countryName.toLowerCase().replace(/\s+/g,"-")) : ""}`,
};

export type Provider = { label: string; url: string; id: string };
const dedupe = (arr: Provider[]) => { const s = new Set<string>(); return arr.filter(p => (s.has(p.id) ? false : (s.add(p.id), true))); };

/* ---------- Availability rules ---------- */
const HIDE_GLOBAL_IN_COUNTRY: Record<string, {yelp?:boolean; opentable?:boolean; michelin?:boolean}> = {
  IN: { yelp: true, opentable: true, michelin: true },
  CN: { yelp: true, opentable: true },
  JP: { yelp: true, opentable: true },
  KR: { yelp: true, opentable: true },
  HK: { yelp: true }, SG: { yelp: true },
  MY: { yelp: true }, TH: { yelp: true }, PH: { yelp: true }, VN: { yelp: true },
  AE: { yelp: true }, SA: { yelp: true }, QA: { yelp: true }, KW: { yelp: true },
};

const RESERVATION_STRONG = (cc: string): Provider[] => {
  const regionals: Provider[] = [];
  const cont = countryToContinent[cc];

  if (cont === "EU" || cc === "GB") {
    regionals.push({ id:"thefork", label:"TheFork", url:href.thefork("{CITY}") });
    regionals.push({ id:"quandoo", label:"Quandoo", url:href.quandoo("{CITY}") });
  }
  if (cc === "AU") regionals.push({ id:"thefork", label:"TheFork", url:href.thefork("{CITY}") });
  if (["HK","SG","MY","TH","PH","VN"].includes(cc)) regionals.push({ id:"openrice", label:"OpenRice", url:href.openrice("{CITY}") });
  if (cc === "JP") regionals.push({ id:"tabelog", label:"Tabelog", url:href.tabelog("{CITY}") });
  if (cc === "KR") regionals.push({ id:"mangoplate", label:"MangoPlate", url:href.mangoPlate("{CITY}") });
  if (cc === "CN") regionals.push({ id:"dianping", label:"Dianping", url:href.dianping("{CITY}") });
  if (["IN","AE","SA","QA","KW"].includes(cc)) {
    regionals.push({ id:"zomato", label:"Zomato", url:href.zomato("{CITY}") });
    if (cc === "IN") regionals.push({ id:"eazydiner", label:"EazyDiner", url:href.eazydiner("{CITY}") });
  }
  return regionals;
};

const applyCity = (u:string, city:string) => u.replace("{CITY}", city);

/* ---------- Public sets ---------- */
export function exploreSet(city: string, countryCode?: string): Provider[] {
  const cc = (countryCode || "").toUpperCase();
  const list: Provider[] = [
    { id: "gmaps", label: "Google Maps", url: href.gmaps(city, "top attractions") },
    { id: "tripadvisor", label: "Tripadvisor", url: href.tripadvisor("top attractions", city) },
    { id: "lonelyplanet", label: "Lonely Planet", url: href.lonelyplanet(city) },
    { id: "timeout", label: "Time Out", url: href.timeout(city) },
    { id: "wikivoyage", label: "Wikivoyage", url: href.wikivoyage(city) },
    { id: "wikipedia", label: "Wikipedia", url: href.wiki(city) },
  ];
  if (cc === "CN") list.unshift({ id: "baidu", label: "Baidu Maps", url: href.baiduMap(city) });
  if (cc === "KR") { list.push({ id:"naver", label:"Naver Map", url:href.naverMap(city) }); list.push({ id:"kakao", label:"Kakao Map", url:href.kakaoMap(city) }); }
  return dedupe(list);
}

export function savorSet(city: string, countryCode?: string): Provider[] {
  const cc = (countryCode || "").toUpperCase();
  const hide = HIDE_GLOBAL_IN_COUNTRY[cc] || {};
  const base: Provider[] = [];
  if (!hide.yelp) base.push({ id: "yelp", label: "Yelp", url: href.yelp("restaurants", city) });
  if (!hide.opentable) base.push({ id: "opentable", label: "OpenTable", url: href.opentable(city) });
  if (!hide.michelin) base.push({ id: "michelin", label: "Michelin", url: href.michelin(city) });
  const extras = RESERVATION_STRONG(cc).map(p => ({ ...p, url: applyCity(p.url, city) }));
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
  if (cc === "CN") list.unshift({ id: "baidu", label: "Baidu Maps", url: href.baiduMap(city) });
  return dedupe(list);
}

/* ---------- Helpers you’ll use from page.tsx ---------- */
export function robustCountryFrom(destDisplay?: string, destIata?: string): { name?: string; code?: string } {
  const byText = resolveCountryFromDisplay(destDisplay);
  if (byText.code) return byText;
  return resolveCountryFromIATA(destIata);
}
