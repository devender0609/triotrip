import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";

export const dynamic = "force-dynamic";

const AI_ENABLED =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

export async function POST(req: Request) {
  if (!AI_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI trip planner is currently disabled. Please use the normal search.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { query } = body as { query: string };

    if (!query || !query.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing query" },
        { status: 400 }
      );
    }

    // 1) Convert free text to structured search payload
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
        { ok: false, error: "AI parsing error", raw },
        { status: 500 }
      );
    }

    // TODO: replace this with your real search helper if you have one
    // For now assume you call /api/search from frontend, or implement a server-side call here.

    const planningPrompt = `
User query: ${query}
Search payload: ${JSON.stringify(payload, null, 2)}

You don't know real-time prices here. Just propose a structure for:
- 3 named trip options (top 3),
- a day-by-day itinerary for one of them,
- a short note.

Return JSON:
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
      planning,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
