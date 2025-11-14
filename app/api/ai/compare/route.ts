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

For EACH destination, provide:
- approx_cost_level: "$", "$$", "$$$", or "$$$$"
- weather_summary: short description for that month
- best_for: 1 short phrase
- pros: array of 2-4 short bullet-style strings
- cons: array of 2-4 short bullet-style strings
- overall_vibe: 1 short sentence

STRICTLY return JSON ONLY in this format:

[
  {
    "name": "Destination name",
    "approx_cost_level": "$$",
    "weather_summary": "short string",
    "best_for": "short string",
    "pros": ["...", "..."],
    "cons": ["...", "..."],
    "overall_vibe": "short sentence"
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
