import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";

export const dynamic = "force-dynamic";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type PlanRequest = {
  query: string;
};

type SearchParams = {
  origin: string;                  // IATA code, e.g. "AUS"
  destination: string;             // IATA code, e.g. "BOS"
  departDate: string;              // YYYY-MM-DD
  returnDate?: string | null;      // YYYY-MM-DD or null if one-way
  roundTrip: boolean;

  passengersAdults: number;
  passengersChildren: number;
  passengersInfants: number;
  passengersChildrenAges: number[];

  cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

  includeHotel: boolean;
  hotelCheckIn?: string | null;    // YYYY-MM-DD
  hotelCheckOut?: string | null;   // YYYY-MM-DD
  minHotelStar?: number | null;
  minBudget?: number | null;
  maxBudget?: number | null;

  currency: string;
  maxStops: 0 | 1 | 2;
};

type PlanningPayload = {
  top3?: {
    best_overall?: { title?: string; reason?: string };
    best_budget?: { title?: string; reason?: string };
    best_comfort?: { title?: string; reason?: string };
  };
  hotels?: any[];
  itinerary?: any[];
};

function tryParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    // try to salvage JSON inside extra text
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const snippet = raw.slice(first, last + 1);
      return JSON.parse(snippet);
    }
    throw new Error("AI returned invalid JSON");
  }
}

export async function POST(req: Request) {
  try {
    if (!AI_ENABLED) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI trip planning is disabled. Set NEXT_PUBLIC_AI_ENABLED=true to enable.",
        },
        { status: 400 }
      );
    }

    const body = (await req.json()) as PlanRequest;
    const query = body?.query?.trim();
    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please describe your trip in one sentence.",
        },
        { status: 400 }
      );
    }

    const systemMessage = `
You are a trip-planning assistant for a web app called TrioTrip.

Your job:
1. Read the user's one-sentence trip idea.
2. Infer structured search parameters for flights (and hotels if needed).
3. Draft a simple plan (top picks, hotel suggestions, and a per-day itinerary).

You MUST respond with pure JSON and NOTHING else.

JSON SCHEMA (single object):

{
  "searchParams": {
    "origin": "AUS",
    "destination": "BOS",
    "departDate": "2025-11-30",
    "returnDate": "2025-12-05",
    "roundTrip": true,

    "passengersAdults": 1,
    "passengersChildren": 0,
    "passengersInfants": 0,
    "passengersChildrenAges": [],

    "cabin": "ECONOMY",            // ECONOMY | PREMIUM_ECONOMY | BUSINESS | FIRST

    "includeHotel": true,
    "hotelCheckIn": "2025-11-30",
    "hotelCheckOut": "2025-12-05",
    "minHotelStar": 0,
    "minBudget": null,             // number or null
    "maxBudget": null,             // number or null

    "currency": "USD",
    "maxStops": 2                  // 0 = nonstop, 1 = up to 1 stop, 2 = allow >1 stop
  },
  "planning": {
    "top3": {
      "best_overall": { "title": "Austin → Boston, 4 nights", "reason": "Balanced price and schedule." },
      "best_budget": { "title": "Cheapest times around the requested dates", "reason": "Lowest total cost." },
      "best_comfort": { "title": "Nonstop morning departure", "reason": "Shortest travel time." }
    },
    "hotels": [
      {
        "name": "Example Hotel",
        "area": "Downtown Boston",
        "approx": "$180–220 per night",
        "vibe": "Walkable, near public transit."
      }
    ],
    "itinerary": [
      {
        "title": "Day 1 – Arrival & Harbor Walk",
        "summary": "Arrive, check in, explore the waterfront and a casual dinner.",
        "label": "arrival",
        "items": [
          { "time": "Morning", "text": "Flight from Austin to Boston." },
          { "time": "Afternoon", "text": "Check in and walk around the harbor." },
          { "time": "Evening", "text": "Dinner at a casual seafood place." }
        ]
      }
    ]
  }
}

Guidelines:
- If user doesn't mention one-way, assume roundTrip = true and choose reasonable dates.
- Parse dates into ISO format (YYYY-MM-DD).
- If user mentions "no hotel" or similar, set includeHotel=false.
- If they mention budget, map that to minBudget / maxBudget and maybe minHotelStar.
- If children are mentioned, set passengersChildren and passengersChildrenAges.
- Use IATA airport codes for origin and destination when obvious (e.g. Austin → AUS, Boston → BOS).
`;

    const userPrompt = `User trip description: """${query}"""`;

    // Ask OpenAI for structured plan
    const raw = await runChat(userPrompt, systemMessage);
    const parsed = tryParseJson(String(raw || "{}"));

    const sp = (parsed?.searchParams || {}) as Partial<SearchParams>;
    const planning = (parsed?.planning || {}) as PlanningPayload;

    const origin = sp.origin?.toUpperCase();
    const destination = sp.destination?.toUpperCase();
    const departDate = sp.departDate;
    const returnDate =
      sp.roundTrip === false ? null : sp.returnDate || null;
    const roundTrip = !!sp.roundTrip;

    const passengersAdults = sp.passengersAdults ?? 1;
    const passengersChildren = sp.passengersChildren ?? 0;
    const passengersInfants = sp.passengersInfants ?? 0;
    const passengersChildrenAges = Array.isArray(sp.passengersChildrenAges)
      ? sp.passengersChildrenAges.map((n) => Number(n) || 8)
      : [];

    const cabin =
      sp.cabin && ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"].includes(sp.cabin)
        ? sp.cabin
        : "ECONOMY";

    const includeHotel = !!sp.includeHotel;
    const hotelCheckIn = includeHotel ? sp.hotelCheckIn || departDate : null;
    const hotelCheckOut =
      includeHotel && (returnDate || sp.hotelCheckOut)
        ? sp.hotelCheckOut || returnDate
        : null;

    const minHotelStar =
      typeof sp.minHotelStar === "number" ? sp.minHotelStar : 0;
    const minBudget =
      typeof sp.minBudget === "number" ? sp.minBudget : null;
    const maxBudget =
      typeof sp.maxBudget === "number" ? sp.maxBudget : null;

    const currency = sp.currency || "USD";
    const maxStops =
      sp.maxStops === 0 || sp.maxStops === 1 || sp.maxStops === 2
        ? sp.maxStops
        : 2;

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

    const searchParams: SearchParams = {
      origin,
      destination,
      departDate,
      returnDate,
      roundTrip,
      passengersAdults,
      passengersChildren,
      passengersInfants,
      passengersChildrenAges,
      cabin,
      includeHotel,
      hotelCheckIn,
      hotelCheckOut,
      minHotelStar,
      minBudget,
      maxBudget,
      currency,
      maxStops,
    };

    // Call your normal /api/search so results match Manual Search exactly
    const searchUrl = new URL("/api/search", req.url);
    let searchResult: any = { results: [] };

    try {
      const resp = await fetch(searchUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // NOTE: api/search expects this exact shape
        body: JSON.stringify({
          origin: searchParams.origin,
          destination: searchParams.destination,
          departDate: searchParams.departDate,
          returnDate: searchParams.roundTrip ? searchParams.returnDate : undefined,
          roundTrip: searchParams.roundTrip,
          passengersAdults: searchParams.passengersAdults,
          passengersChildren: searchParams.passengersChildren,
          passengersChildrenAges: searchParams.passengersChildrenAges,
          passengersInfants: searchParams.passengersInfants,
          cabin: searchParams.cabin,
          includeHotel: searchParams.includeHotel,
          hotelCheckIn: searchParams.hotelCheckIn || undefined,
          hotelCheckOut: searchParams.hotelCheckOut || undefined,
          minHotelStar: searchParams.minHotelStar,
          minBudget: searchParams.minBudget ?? undefined,
          maxBudget: searchParams.maxBudget ?? undefined,
          currency: searchParams.currency,
          maxStops: searchParams.maxStops,
        }),
      });

      if (resp.ok) {
        searchResult = await resp.json();
      } else {
        const txt = await resp.text().catch(() => "");
        console.error(
          "AI plan-trip: /api/search failed",
          resp.status,
          txt
        );
      }
    } catch (e) {
      console.error("AI plan-trip: error calling /api/search", e);
    }

    return NextResponse.json({
      ok: true,
      searchParams,
      planning,
      searchResult, // has .results[] in same shape as manual search
    });
  } catch (err: any) {
    console.error("AI plan-trip route error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unexpected error in AI trip planner.",
      },
      { status: 500 }
    );
  }
}
