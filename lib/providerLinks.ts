export type ProviderCtx = {
  city: string;
  country: string;            // destination ISO-2 (e.g. "US")
  originCountry?: string;     // origin ISO-2 (optional)
  language?: string;          // e.g. "en-US"
  currency?: string;          // e.g. "USD"
  term?: string;              // category term for the provider (e.g., "best restaurants")
};

export function isInternational(origin?: string | null, dest?: string | null) {
  return !!origin && !!dest && origin.toUpperCase() !== dest.toUpperCase();
}

export function providerSupported(p: any, city: string, country: string) {
  if (p.global) return true;
  if (p.supported_countries === "GLOBAL") return true;
  if (Array.isArray(p.cities) && p.cities.includes(city)) return true;
  if (Array.isArray(p.supported_regions) && p.supported_regions.includes(country)) return true;
  return false;
}

// Prefilled deep-link builders (by provider "link" kind)
export const buildUrl = (kind: string, ctx: ProviderCtx) => {
  const q = encodeURIComponent;
  const cityQ = q(ctx.city);
  const termQ = q(ctx.term || "");
  switch (kind) {
    case "maps":        return `https://www.google.com/maps/search/${termQ ? termQ + "+in+" : ""}${cityQ}`;
    case "yelp":        return `https://www.yelp.com/search?find_desc=${termQ}&find_loc=${cityQ}`;
    case "opentable":   return `https://www.opentable.com/s?covers=2&term=${cityQ}&currentview=list&metroId=0`;
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

// Returns providers enabled for a category key (e.g., "savor")
export function providersFor(matrix: any, categoryKey: string, ctx: ProviderCtx) {
  const items = (matrix.providers || [])
    .filter((p: any) => Array.isArray(p.categories) && p.categories.includes(categoryKey))
    .filter((p: any) => providerSupported(p, ctx.city, ctx.country));
  // Fallback to reliable globals
  if (!items.length) {
    return (matrix.providers || []).filter(
      (p: any) => p.id?.includes("google_maps") || p.id === "tripadvisor_things"
    );
  }
  return items;
}
