// lib/savorExplore.ts
export const countryToContinent: Record<string, "AF"|"AS"|"EU"|"NA"|"OC"|"SA"|"AN"> = {
  US: "NA", CA: "NA", MX: "NA", BR: "SA", AR: "SA",
  GB: "EU", FR: "EU", DE: "EU", IT: "EU", ES: "EU", IE: "EU", NL: "EU", BE: "EU", PT: "EU", SE: "EU", NO: "EU", DK: "EU", FI: "EU", IS: "EU",
  AU: "OC", NZ: "OC",
  JP: "AS", KR: "AS", CN: "AS", IN: "AS", AE: "AS", SG: "AS", HK: "AS", TH: "AS", MY: "AS", PH: "AS", VN: "AS",
};

export const href = {
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

  // Dining / reservations (global)
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
  mangoPlate: (city: string) => `https://www.mangoplate.com/search/${encodeURIComponent(city)}`,
  zomato: (city: string) => `https://www.zomato.com/search?place_name=${encodeURIComponent(city)}`,
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

type Provider = { label: string; url: string; id: string };
const dedupe = (arr: Provider[]) => {
  const seen = new Set<string>();
  return arr.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
};

export function exploreSet(city: string, countryCode?: string): Provider[] {
  const list: Provider[] = [
    { id: "gmaps", label: "Google Maps", url: href.gmaps(city, "top attractions") },
    { id: "tripadvisor", label: "Tripadvisor", url: href.tripadvisor("top attractions", city) },
    { id: "lonelyplanet", label: "Lonely Planet", url: href.lonelyplanet(city) },
    { id: "timeout", label: "Time Out", url: href.timeout(city) },
  ];
  if (countryCode?.toUpperCase() === "CN") {
    list.unshift({ id: "baidu", label: "Baidu Maps", url: href.baiduMap(city) });
  }
  return dedupe(list);
}

export function savorSet(city: string, countryCode?: string): Provider[] {
  const cc = countryCode?.toUpperCase();
  const base: Provider[] = [
    { id: "gmaps", label: "Google Maps", url: href.gmaps(city, "best restaurants") },
    { id: "opentable", label: "OpenTable", url: href.opentable(city) },
    { id: "michelin", label: "Michelin", url: href.michelin(city) },
  ];
  const regional: Provider[] = [];

  if (cc === "CN") regional.push({ id: "dianping", label: "Dianping", url: href.dianping(city) });
  if (cc === "JP") regional.push({ id: "tabelog", label: "Tabelog", url: href.tabelog(city) });
  if (cc === "KR") regional.push({ id: "mangoplate", label: "MangoPlate", url: href.mangoPlate(city) });
  if (["HK","SG","MY","TH","PH","VN"].includes(cc || "")) regional.push({ id: "openrice", label: "OpenRice", url: href.openrice(city) });
  if (["IN","AE","SA","QA","KW"].includes(cc || "")) regional.push({ id: "zomato", label: "Zomato", url: href.zomato(city) });

  const continent = countryToContinent[cc || ""] || "";
  if (continent === "EU" || cc === "GB") regional.push({ id: "thefork", label: "TheFork", url: href.thefork(city) }, { id: "quandoo", label: "Quandoo", url: href.quandoo(city) });
  if (cc === "AU") regional.push({ id: "thefork", label: "TheFork", url: href.thefork(city) });

  if (!["CN","JP","KR"].includes(cc || "")) {
    base.push({ id: "yelp", label: "Yelp", url: href.yelp("restaurants", city) });
  }

  return dedupe([...regional, ...base]);
}

export function miscSet(city: string, countryName?: string, countryCode?: string): Provider[] {
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
  if (countryCode?.toUpperCase() === "CN") {
    list.unshift({ id: "baidu", label: "Baidu Maps", url: href.baiduMap(city) });
  }
  return dedupe(list);
}
