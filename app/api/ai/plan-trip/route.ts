import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";

export const dynamic = "force-dynamic";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type PlanRequest = {
  query: string;
};

export async function POST(req: Request) {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI trip planner is disabled. You can still use the normal search.",
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as PlanRequest;
    const query = (body.query || "").trim();

    if (!query) {
      return NextResponse.json(
        { ok: false, error: "query is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Use AI ONLY to parse the free-text into structured search + planning
    const prompt = `
You are an expert travel planner. The user gives a short free-text description of a trip.

User query:
"${query}"

Step 1: Infer structured search parameters:
- origin: IATA origin code, e.g. "AUS"
- destination: IATA destination code, e.g. "LAS"
- departDate: departure date as "YYYY-MM-DD"
- returnDate: return date as "YYYY-MM-DD" or "" if one-way
- roundTrip: true or false
- adults: number
- children: number
- infants: number
- cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
- includeHotel: true or false
- currency: ISO currency, e.g. "USD"

Step 2: Build PLANNING information:
- top3:
  - best_overall: { "title": "...", "reason": "..." }
  - best_budget: { "title": "...", "reason": "..." }
  - best_comfort: { "title": "...", "reason": "..." }
- itinerary: array of days like
  { "title": "Day 1 — Arrival", "activities": ["...", "..."] }
- hotels: array of options like
  { "name": "Hotel X", "area": "Downtown/Beach/etc", "approx": "USD 180/night", "vibe": "party / romantic / family-friendly", "summary": "1–2 sentences" }

Return ONE JSON object ONLY in this exact structure:

{
  "search": {
    "origin": "AUS",
    "destination": "LAS",
    "departDate": "2025-01-10",
    "returnDate": "2025-01-15",
    "roundTrip": true,
    "adults": 2,
    "children": 0,
    "infants": 0,
    "cabin": "ECONOMY",
    "includeHotel": true,
    "currency": "USD"
  },
  "planning": {
    "top3": {
      "best_overall": { "title": "...", "reason": "..." },
      "best_budget": { "title": "...", "reason": "..." },
      "best_comfort": { "title": "...", "reason": "..." }
    },
    "itinerary": [
      { "title": "Day 1 — Arrival", "activities": ["...", "..."] }
    ],
    "hotels": [
      { "name": "Hotel X", "area": "Downtown", "approx": "USD 180/night", "vibe": "romantic", "summary": "..." }
    ]
  }
}
    `.trim();

    const raw = await runChat(prompt);

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("plan-trip parse error:", e, raw);
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI could not parse the trip description. Please be clearer with origin, destination, and dates.",
        },
        { status: 400 }
      );
    }

    const search = parsed?.search || {};
    const planning = parsed?.planning || {};

    const origin = search.origin;
    const destination = search.destination;
    const departDate = search.departDate;
    const returnDate = search.returnDate || "";
    const roundTrip = !!search.roundTrip;
    const adults = search.adults || 1;
    const children = search.children || 0;
    const infants = search.infants || 0;
    const cabin = search.cabin || "ECONOMY";
    const currency = search.currency || "USD";

    if (!origin || !destination || !departDate) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI could not confidently infer origin, destination, and departure date. Please specify clear airports and dates.",
        },
        { status: 400 }
      );
    }

    // Build the exact same search body that manual /api/search uses
    const searchBody = {
      origin,
      destination,
      departDate,
      returnDate,
      roundTrip,
      passengersAdults: adults,
      passengersChildren: children,
      passengersInfants: infants,
      cabin,
      includeHotel: !!search.includeHotel,
      currency,
    };

    // 2️⃣ Call your existing /api/search (same logic as manual search)
    const searchUrl = new URL("/api/search", req.url);

    const searchResp = await fetch(searchUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchBody),
    });

    if (!searchResp.ok) {
      const text = await searchResp.text();
      console.error("Search API error", searchResp.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: `Search API error ${searchResp.status}`,
        },
        { status: 500 }
      );
    }

    const searchResult = await searchResp.json();

    // 3️⃣ Return to frontend: same results structure as manual search + AI planning
    return NextResponse.json({
      ok: true,
      searchParams: searchBody,
      planning,
      searchResult, // has .results[] in same shape as manual
    });
  } catch (err: any) {
    console.error("AI plan-trip error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "AI plan-trip error",
      },
      { status: 500 }
    );
  }
}
