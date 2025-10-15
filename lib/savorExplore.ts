// lib/savorExplore.ts
type Provider = {
  id: string;
  name: string;
  categories: ("explore"|"savor")[];
  global?: boolean;
  supported_countries?: "GLOBAL";
  supported_regions?: string[]; // ISO alpha-2 codes
  link_template: string; // expect tokens: {PLACE}, optional {DATE_TIME}
  notes?: string;
};

export type Category = "explore" | "savor";

export type PickOptions = {
  countryCode?: string;   // ISO alpha-2 (preferred)
  countryName?: string;   // if you don't have code
  city?: string;
  when?: string;          // optional ISO datetime for reservations
  limit?: number;         // max providers
};

// Simple country aliases -> ISO codes
const COUNTRY_ALIASES: Record<string, string> = {
  "United States": "US",
  "USA": "US",
  "United Kingdom": "UK",
  "South Korea": "KR",
  "North Korea": "KP",
  "UAE": "AE",
  "Emirates": "AE",
  "Hong Kong": "HK",
  "Czech Republic": "CZ",
  "Türkiye": "TR",
  "Turkey": "TR",
};

// Utility: resolve country code if possible
function resolveCountryCode(opts: PickOptions): string | undefined {
  let code = (opts.countryCode || "").toUpperCase().trim();
  if (code) return code;
  const nm = (opts.countryName || "").trim();
  if (!nm) return undefined;
  return COUNTRY_ALIASES[nm] || undefined;
}

// Load providers statically (bundled at build time)
import providersJson from "../data/providers.json";
const PROVIDERS: Provider[] = providersJson as unknown as Provider[];

function providerApplies(p: Provider, countryCode?: string): boolean {
  if (p.global || p.supported_countries === "GLOBAL") return true;
  if (!countryCode) return false;
  if (Array.isArray(p.supported_regions)) {
    return p.supported_regions.includes(countryCode);
  }
  return false;
}

function buildLink(tpl: string, place: string, when?: string): string {
  const encodedPlace = encodeURIComponent(place);
  let url = tpl.replace("{PLACE}", encodedPlace);
  if (tpl.includes("{DATE_TIME}")) {
    url = url.replace("{DATE_TIME}", encodeURIComponent(when || new Date().toISOString()));
  }
  return url;
}

export function pickSites(category: Category, opts: PickOptions): { id: string; name: string; url: string; }[] {
  const code = resolveCountryCode(opts);
  const place = (opts.city || opts.countryName || code || "").trim();
  const when = opts.when;
  const limit = Math.max(1, Math.min(6, opts.limit ?? 4));

  const matches = PROVIDERS
    .filter(p => p.categories.includes(category))
    .filter(p => providerApplies(p, code));

  // Rank: simple rule — prefer regional (non-global) providers first, then global
  const ranked = matches.sort((a, b) => {
    const aRegional = !!a.supported_regions;
    const bRegional = !!b.supported_regions;
    if (aRegional !== bRegional) return aRegional ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  // Build URLs and dedupe by base domain
  const out: { id:string; name:string; url:string; domain:string }[] = [];
  for (const p of ranked) {
    const url = buildLink(p.link_template, place, when);
    // domain dedupe
    try {
      const u = new URL(url);
      const domain = u.hostname.replace(/^www\./, "");
      if (!out.find(x => x.domain === domain)) {
        out.push({ id: p.id, name: p.name, url, domain });
      }
    } catch {
      // fallback: keep
      out.push({ id: p.id, name: p.name, url, domain: p.id });
    }
    if (out.length >= limit) break;
  }

  return out.map(({id,name,url}) => ({id,name,url}));
}
