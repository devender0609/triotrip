// app/api/ai/plan-trip/route.ts
import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";
import { searchTrips } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body as { query: string };

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // 1) Ask AI to convert free text → structured search payload
    const system = `
You convert natural language trip requests into a strict JSON object:
{
  "origin": "AUS",
  "destination": "CDG",
  "depart": "2025-04-05",
  "returnDate": "2025-04-10",
  "travelers": 2,
  "mode": "best",
  "budgetMax": 2000
}
Only output valid JSON, no comments, no extra text.
`.trim();

    const raw = await runChat(query, system);

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "AI parsing error", raw },
        { status: 500 }
      );
    }

    // 2) Call your existing search API (lib/search.ts)
    const searchResult = await searchTrips(payload);

    // 3) Ask AI to plan a human-friendly itinerary + explanations
    const planningPrompt = `
User query: ${query}
Search payload: ${JSON.stringify(payload, null, 2)}
Search result (truncated to first 5 options): ${JSON.stringify(searchResult.results.slice(0, 5), null, 2)}

Using this info, do:
1. Choose the 3 best bundles (cheapest, fastest, and best-overall).
2. Create a day-by-day itinerary.
3. Give a short explanation of why each of the 3 options is good.

Reply as JSON:
{
  "top3": [...],
  "itinerary": [...],
  "notes": "string"
}
`.trim();

    const planningRaw = await runChat(planningPrompt);
    let planning: any;
    try {
      planning = JSON.parse(planningRaw);
    } catch {
      planning = { raw: planningRaw };
    }

    return NextResponse.json({
      ok: true,
      payload,
      searchResult,
      planning,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
