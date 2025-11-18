// lib/api.ts

// Generic JSON helper
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init && init.headers),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors; we’ll throw below
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Request to ${url} failed with status ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/**
 * Manual trip search wrapper (if you want to use it instead of fetch("/api/search") directly).
 * Not currently used by app/page.tsx, but safe to keep for components.
 */
export async function searchTrips(payload: any) {
  return fetchJSON<{
    results: any[];
  }>("/api/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * AI trip planner
 * Hits /api/ai/plan-trip and returns:
 *  {
 *    ok: boolean;
 *    searchParams?: any;   // inferred structured params
 *    searchResult?: any;   // { results: [...] } similar to /api/search
 *    planning?: any;       // { top3, hotels, itinerary }
 *    error?: string;
 *  }
 */
export async function aiPlanTrip(query: string) {
  return fetchJSON<{
    ok: boolean;
    searchParams?: any;
    searchResult?: any;
    planning?: any;
    error?: string;
  }>("/api/ai/plan-trip", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

/**
 * AI destination comparison (for AiDestinationCompare component)
 *  {
 *    ok: boolean;
 *    comparisons: [
 *      {
 *        name: string;
 *        approx_cost_level: string;
 *        weather_summary: string;
 *        best_for: string;
 *        pros: string[];
 *        cons: string[];
 *        overall_vibe: string;
 *      }, ...
 *    ]
 *  }
 */
export async function aiCompareDestinations(input: {
  destinations: string[];
  month?: string;
  home?: string;
  days?: number;
}) {
  return fetchJSON<{
    ok: boolean;
    comparisons: {
      name: string;
      approx_cost_level: string;
      weather_summary: string;
      best_for: string;
      pros: string[];
      cons: string[];
      overall_vibe: string;
    }[];
  }>("/api/ai/compare", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * (Optional) AI Top-3 helper – you’re currently calling /api/ai/top3
 * directly from app/page.tsx, but this wrapper is here if you want it.
 */
export async function aiTop3FromResults(results: any[]) {
  return fetchJSON<{
    ok: boolean;
    top3?: {
      best_overall?: { id: string; reason?: string };
      best_budget?: { id: string; reason?: string };
      best_comfort?: { id: string; reason?: string };
    };
    error?: string;
  }>("/api/ai/top3", {
    method: "POST",
    body: JSON.stringify({ results }),
  });
}
