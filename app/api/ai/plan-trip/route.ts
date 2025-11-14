import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";
import { amadeusGet } from "@/lib/amadeusClient";

export const dynamic = "force-dynamic";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type PlanRequest = {
  query: string;
};

function parseIsoDurationToMinutes(dur: string | undefined): number {
  if (!dur || !dur.startsWith("PT")) return 0;
  let hours = 0;
  let minutes = 0;
  const hMatch = dur.match(/(\d+)H/);
  if (hMatch) hours = parseInt(hMatch[1], 10);
  const mMatch = dur.match(/(\d+)M/);
  if (mMatch) minutes = parseInt(mMatch[1], 10);
  return hours * 60 + minutes;
}

export async function POST(req: Request) {
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

  try {
    const body = (await req.json()) as PlanRequest;
    const query = (body.query || "").trim();

    if (!query) {
      return NextResponse.json(
        { ok: false, error: "query is required" },
        { status: 400 }
      );
    }

    // 1) Ask AI to understand the sentence & build itinerary, top3, and hotel recs.
    const prompt = `
You are an expert travel planner. The user gives a short free-text description of a trip.

User query:
"${query}"

Infer structured search parameters, then outline a suggested itinerary, 3 high-level plan options, and hotel suggestions.
Return ONE JSON object ONLY in this exact shape:

{
  "search": {
    "origin": "IATA origin code, e.g. AUS",
    "destination": "IATA destination code, e.g. LAS",
    "departDate": "YYYY-MM-DD",
    "returnDate": "YYYY-MM-DD or empty string if one-way",
    "roundTrip": true,
    "adults": 1,
    "children": 0,
    "infants": 0,
    "cabin": "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST",
    "includeHotel": true,
    "currency": "USD"
  },
  "planning": {
    "top3": {
      "best_overall": {
        "title": "short title",
        "reason": "1–2 sentence explanation"
      },
      "best_budget": {
        "title": "short title",
        "reason": "1–2 sentence explanation"
      },
      "best_comfort": {
        "title": "short title",
        "reason": "1–2 sentence explanation"
      }
    },
    "itinerary": [
      {
        "day": 1,
        "date": "YYYY-MM-DD or empty string if unknown",
        "activities": [
          "bullet-style activity for morning",
          "activity afternoon",
          "activity evening"
        ]
      }
    ],
    "hotels": [
      {
        "name": "Hotel or area name tailored to this trip",
        "area": "Neighborhood or general location (e.g. 'near the Strip', 'Seminyak beach side')",
        "approx_price_per_night": 180,
        "currency": "USD",
        "vibe": "short phrase like 'party', 'romantic', 'family-friendly'",
        "why": "1–2 sentences explaining why this hotel/area fits the trip"
      }
    ]
  }
}

Rules:
- If the user clearly gives dates (like "Jan 10–15 2026"), convert them to ISO (2026-01-10 and 2026-01-15).
- If return date is not given, set "roundTrip": false and "returnDate": "".
- If cabin is not specified, default to "ECONOMY".
- If currency not specified, default to "USD".
- Hotels must be appropriate for the destination, budget level, and any preferences (family, nightlife, etc.).
- Always output valid JSON only, with no comments or markdown.
`.trim();

    const raw = await runChat(prompt);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("plan-trip parse error:", e, raw);
      return NextResponse.json(
        { ok: false, error: "AI could not parse the trip description." },
        { status: 500 }
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

    // 2) Call Amadeus to get real flight offers (same base as manual search).
    const params: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departDate,
      adults,
      max: 20,
      currencyCode: currency,
      travelClass: cabin,
    };
    if (roundTrip && returnDate) {
      params.returnDate = returnDate;
    }

    const json: any = await amadeusGet("/v2/shopping/flight-offers", params);
    const offers: any[] = json.data || [];

    const results = offers.slice(0, 10).map((offer, idx) => {
      const priceTotal = Number(offer.price?.total || 0);
      const itineraries = offer.itineraries || [];

      const outItin = itineraries[0] || {};
      const retItin = itineraries[1] || null;

      const segmentsOut = (outItin.segments || []).map((s: any) => ({
        from: s.departure?.iataCode,
        to: s.arrival?.iataCode,
        departureTime: s.departure?.at,
        arrivalTime: s.arrival?.at,
        carrierCode: s.carrierCode,
        flightNumber: s.number,
        duration_minutes: parseIsoDurationToMinutes(s.duration),
      }));

      const segmentsReturn = retItin
        ? (retItin.segments || []).map((s: any) => ({
            from: s.departure?.iataCode,
            to: s.arrival?.iataCode,
            departureTime: s.departure?.at,
            arrivalTime: s.arrival?.at,
            carrierCode: s.carrierCode,
            flightNumber: s.number,
            duration_minutes: parseIsoDurationToMinutes(s.duration),
          }))
        : [];

      const mainCarrier =
        segmentsOut[0]?.carrierCode || offer.validatingAirlineCodes?.[0];

      const flight = {
        price_usd: priceTotal,
        currency,
        mainCarrier,
        segments_out: segmentsOut,
        segments_return: segmentsReturn,
      };

      const pkg = {
        id: offer.id || `ai-amadeus-${idx}`,
        flight,
        flight_total: priceTotal,
        hotel_total: 0,
        total_cost: priceTotal,
        provider: "amadeus",
      };

      return pkg;
    });

    return NextResponse.json({
      ok: true,
      searchParams: {
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
      },
      planning,
      searchResult: { results },
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
