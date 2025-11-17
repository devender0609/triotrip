import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

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

    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing trip description." },
        { status: 400 }
      );
    }

    // 1) Ask AI to parse the sentence into structured search + planning
    const prompt = `
You are an assistant helping to plan trips.

User sentence:
"${query}"

1) Extract a SEARCH object with:
- origin (IATA code, e.g. AUS, SFO, LHR)
- destination (IATA code)
- departDate (YYYY-MM-DD)
- returnDate (YYYY-MM-DD) or null
- roundTrip (true/false)
- adults, children, infants
- cabin (ECONOMY | PREMIUM_ECONOMY | BUSINESS | FIRST)
- includeHotel (true/false)
- currency (e.g. USD)

2) Optionally propose PLANNING:
- top3: best_overall, best_budget, best_comfort (each with title + reason)
- itinerary: array of days with title + activities[]
- hotels: array of options with name, area, approx (price), vibe (short description)

Return ONLY valid JSON like:
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
      { "title": "Day 1", "activities": ["...","..."] }
    ],
    "hotels": [
      { "name": "Hotel X", "area": "Downtown", "approx": "USD 180/night", "vibe": "..." }
    ]
  }
}
    `.trim();

    const raw = await runChat(prompt);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("AI parse error", e, raw);
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI could not parse your request. Please try again with clear origin, destination, and dates.",
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
            "AI could not confidently infer origin, destination, and departure date from your sentence. Please be more specific.",
        },
        { status: 400 }
      );
    }

    // 2) Call YOUR existing /api/search (same logic as manual search)
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

    // Build absolute URL to /api/search based on current request
    const url = new URL("/api/search", req.url);
    const searchResp = await fetch(url.toString(), {
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

    return NextResponse.json({
      ok: true,
      searchParams: searchBody,
      planning,
      searchResult, // this has `.results` like manual search
    });
  } catch (err: any) {
    console.error("AI plan-trip route error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error in AI trip planner.",
      },
      { status: 500 }
    );
  }
}
