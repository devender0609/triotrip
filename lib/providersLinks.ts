export type ProviderCtx = {
  city: string;
  country: string;            // destination ISO-2 (e.g. "US")
  originCountry?: string;     // origin ISO-2 (optional)
  language?: string;          // e.g. "en-US"
  currency?: string;          // e.g. "USD"
  term?: string;              // category term
};

export function isInternational(origin?: string | null, dest?: string | null) {
  return !!origin && !!dest && origin.toUpperCase() !== dest.toUpperCase();
}

export function providerSupported(p: any, city: string, country: string) {
  if (p.global) return true;
  if (Array.isArray(p.cities) && p.cities.includes(city)) return true;
  if (Array.isArray(p.countries) && p.countries.includes(country)) return true;
  if (Array.isArray(p.regions) && p.regions.includes(country)) return true;
  return false;
}

// Prefilled deep-link builders
export const buildUrl = (kind: string, ctx: ProviderCtx) => {
  const q = encodeURIComponent;
  const cityQ = q(ctx.city);
  const termQ = q(ctx.term || "");
  switch (kind) {
    case "maps":        return `https://www.google.com/maps/search/${termQ ? termQ + "+in+" : ""}${cityQ}`;
    case "yelp":        return `https://www.yelp.com/search?find_desc=${termQ}&find_loc=${cityQ}`;
    case "opentable":   return `https://www.opentable.com/s?covers=2&term=${termQ}&currentview=list&metroId=0&geo=city:${cityQ}`;
    case "tripadvisor": return `https://www.tripadvisor.com/Search?q=${q((ctx.term || "") + " " + ctx.city)}`;
    case "timeout":     return `https://www.timeout.com/search?query=${cityQ}`;
    case "zomato":      return `https://www.zomato.com/search?entity_type=city&q=${cityQ}`;
    case "eazydiner":   return `https://www.eazydiner.com/${cityQ}`;
    case "thefork":     return `https://www.thefork.com/search/?search-text=${cityQ}`;
    case "wikivoyage":  return `https://en.wikivoyage.org/wiki/${cityQ}`;
    case "wikipedia":   return `https://en.wikipedia.org/wiki/${cityQ}`;
    case "xe":          return `https://www.xe.com/currencyconverter/`;
    case "state_dept":  return `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/`;
    default:            return "#";
  }
};

// Returns the enabled providers for a given category key
export function providersFor(matrix: any, categoryKey: string, ctx: ProviderCtx) {
  const items = matrix.providers
    .filter((p: any) => Array.isArray(p.categories) && p.categories.includes(categoryKey))
    .filter((p: any) => providerSupported(p, ctx.city, ctx.country));
  // Hard fallback
  if (!items.length) {
    return matrix.providers.filter((p: any) => p.id === "google_maps" || p.id === "tripadvisor");
  }
  return items;
}