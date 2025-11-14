// app/api/ai/compare/route.ts
import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";

export const dynamic = "force-dynamic";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

type CompareRequest = {
  destinations: string[];
  month?: string;
  home?: string;
  days?: number;
};

export async function POST(req: Request) {
  if (!AI_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "AI destination comparison is disabled. You can still search destinations normally.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as CompareRequest;

    const destinations = body.destinations || [];
    const month = body.month || "anytime";
    const home = body.home || "your home city";
    const days = body.days || 7;

    if (!destinations.length) {
      return NextResponse.json(
        { ok: false, error: "destinations[] is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are a travel expert. Compare these destinations for a ${days}-day trip in ${month} from ${home}.

Destinations:
${destinations.map((d, i) => `${i + 1}. ${d}`).join("\n")}

For EACH destination, provide a JSON object with:

- name: the destination name
- approx_cost_level: "$", "$$", "$$$", or "$$$$"
- weather_summary: short description for that month
- best_for: 1 short phrase (e.g. "romantic beach trips", "budget backpackers", "family city breaks")
- pros: array of 2–4 short bullet-style strings
- cons: array of 2–4 short bullet-style strings
- overall_vibe: 1 short sentence

PLUS the following **experience fields** that must be relevant to that destination:

- dining_and_local_eats: short paragraph about typical food scene, street food vs fine dining, local specialties
- hotels_and_areas: short paragraph on good areas to stay, typical hotel types (resort, boutique, budget), what each area is good for
- entertainment_and_nightlife: short paragraph about nightlife, shows, bars, clubs, live music, or if it's quiet
- family_friendly: short paragraph about family-friendly aspects, calmer areas, easy walks, etc.
- kids_activities: short paragraph about specific activities for children (parks, attractions, museums, beaches, etc.)
- safety_tips: short paragraph with practical safety advice specific to that place (tourist scams, night areas, transport, etc.)
- currency: local currency code and name, like "THB - Thai Baht"
- typical_daily_budget: short phrase describing rough per-person daily budget (excluding flights), like "Budget: 50–80 USD/day" or "Comfort: 120–180 USD/day"

Also include suggested airports:

- airports: array of 2–4 key airports for that destination
  - role: one of "primary_hub", "cheapest_option", "most_convenient", "busiest_or_happening", "safest_reputation"
  - name: airport name
  - code: IATA code (e.g. "DPS", "BKK", "HNL")
  - reason: very short explanation why this airport fits that role

Some roles can be covered by the same airport if appropriate.

STRICTLY return JSON ONLY in this format (no markdown, no comments):

[
  {
    "name": "Destination name",
    "approx_cost_level": "$$",
    "weather_summary": "short string",
    "best_for": "short string",
    "pros": ["...", "..."],
    "cons": ["...", "..."],
    "overall_vibe": "short sentence",
    "dining_and_local_eats": "short paragraph",
    "hotels_and_areas": "short paragraph",
    "entertainment_and_nightlife": "short paragraph",
    "family_friendly": "short paragraph",
    "kids_activities": "short paragraph",
    "safety_tips": "short paragraph",
    "currency": "e.g. THB - Thai Baht",
    "typical_daily_budget": "short phrase like 'Budget: 60–90 USD/day'",
    "airports": [
      {
        "role": "primary_hub",
        "name": "Example Airport",
        "code": "XXX",
        "reason": "short reason"
      }
    ]
  }
]
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
      comparisons: parsed,
    });
  } catch (err: any) {
    console.error("AI compare error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "AI compare error" },
      { status: 500 }
    );
  }
}
