// app/api/ai/plan-trip/route.ts
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
    const query = body.query || "";

    if (!query.trim()) {
      return NextResponse.json(
        { ok: false, error: "query is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert travel planner. The user gives a short free-text query describing a trip.
Understand origin, destination, dates, length of stay, budget, and preferences.

User query:
"${query}"

Return a SINGLE JSON object with this shape:

{
  "top3": {
    "best_overall": {
      "title": "short title for the best overall plan",
      "reason": "why this is the best overall"
    },
    "best_budget": {
      "title": "short title for budget plan",
      "reason": "why this is best for saving money"
    },
    "best_comfort": {
      "title": "short title for comfort plan",
      "reason": "why this is most comfortable / relaxed"
    }
  },
  "flights": [
    {
      "label": "short description, e.g. 'Non-stop AUS → LAS, afternoon departure'",
      "from": "IATA origin code like AUS",
      "to": "IATA destination code like LAS",
      "airline": "suggested airline or 'multiple airlines'",
      "approx_price": 1234,
      "currency": "USD",
      "notes": "very short tip such as 'usually cheapest on weekdays'"
    }
  ],
  "hotels": [
    {
      "name": "hotel name",
      "area": "neighborhood / area",
      "approx_price_per_night": 200,
      "currency": "USD",
      "vibe": "short phrase, e.g. 'party / casino' or 'quiet & family friendly'",
      "why": "1 sentence why this fits the trip description"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD if you can infer it, otherwise leave as an empty string",
      "activities": [
        "bullet-style activity line for morning / afternoon / evening"
      ]
    }
  ]
}

Rules:
- Always return valid JSON ONLY, no extra commentary or markdown.
- If you cannot infer exact dates, you can leave "date" as "" but still keep the correct day order.
- Try to align flights & hotels with the itinerary and user preferences (budget vs luxury, nightlife vs quiet, etc.).
`.trim();

    const raw = await runChat(prompt);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw };
    }

    return NextResponse.json({
      ok: true,
      planning: parsed,
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
