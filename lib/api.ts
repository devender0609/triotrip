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
    // ignore JSON parse errors; we’ll throw below if needed
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
 * Manual trip search wrapper
 * (optional – you can still call /api/search directly)
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
 * FAVORITES API
 * These are used by app/saved/page.tsx
 */

// Get all saved favorites
export async function listFavorites() {
  return fetchJSON<{
    ok: boolean;
    items: any[];
  }>("/api/favorites", {
    method: "GET",
  });
}

// Remove a favorite by id
export async function removeFavorite(id: string) {
  return fetchJSON<{
    ok: boolean;
  }>("/api/favorites", {
    method: "DELETE",
    body: JSON.stringify({ id }),
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
 * AI Top-3 helper – used to score/summarize a list of results
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
