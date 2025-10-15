# Savor & Explore Provider Pack

This pack gives you production-ready data + code to show **reliable, applicable links** for **Explore** (things to do) and **Savor** (restaurants) per **country/city**, with global fallbacks.

## Files

- `data/providers.json` — Registry of providers, coverage (GLOBAL or `supported_regions` by ISO code), and link templates.
- `lib/savorExplore.ts` — Helper to select the right providers and build deep links for a given country/city.
- `components/SavorExploreLinks.tsx` — Drop-in React component that renders the curated links.

## Quick Start (Next.js)

1. Copy the `data`, `lib`, and `components` folders into your project (or merge into existing locations).
2. Import and render the component where appropriate:

```tsx
import SavorExploreLinks from "@/components/SavorExploreLinks";

export default function Example({ countryCode, countryName, city }: { countryCode?: string; countryName?: string; city?: string; }) {
  return (
    <div className="grid gap-6">
      <SavorExploreLinks category="explore" countryCode={countryCode} countryName={countryName} city={city} limit={4} />
      <SavorExploreLinks category="savor"   countryCode={countryCode} countryName={countryName} city={city} when={new Date().toISOString()} limit={4} />
    </div>
  );
}
```

## How it works

- **Coverage logic**: A provider is included if it is `GLOBAL` or explicitly lists the country’s ISO code in `supported_regions`.
- **Ranking**: Regional providers are ranked before global ones.
- **Dedup**: We dedupe by base domain so you don’t show two links to the same site.
- **Deep links**: Templates use `{PLACE}` (city or country) and optionally `{DATE_TIME}` (ISO) for reservations.

## Extending

- Add official tourism boards (explore) per country by appending entries to `providers.json` with `supported_regions: ["XX"]` and a `link_template` that uses `{PLACE}`.
- Add more local champions per country/region as you learn what users prefer.
- If you have analytics, add a `score` field and adjust ranking in `pickSites`.

## Notes

- Provider coverage evolves; you can periodically run link health checks in the background and hide providers that error out.
- If you don’t have the ISO code, pass `countryName` and a subset of common aliases resolves automatically (edit in `savorExplore.ts`).

Enjoy!
