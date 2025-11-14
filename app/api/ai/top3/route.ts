// app/api/ai/top3/route.ts
import { NextResponse } from "next/server";
import { runChat } from "@/lib/aiClient";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { results } = await req.json();

  // Safeguard
  const truncated = (results || []).slice(0, 20); // keep token usage sane

  const prompt = `
You are picking exactly 3 options from this list of trip results.
Each result has id, price_usd (or similar), duration_minutes, and possibly a hotel.

Pick:
1. Best overall
2. Best budget
3. Best comfort

RULES:
- Always output STRICT JSON that can be parsed.
- Do not include any comments or extra text outside JSON.
- Make sure "id" you reference exists in the input results.

Return JSON:
{
  "best_overall": { "id": "<candidate.id>", "reason": "..." },
  "best_budget": { "id": "<candidate.id>", "reason": "..." },
  "best_comfort": { "id": "<candidate.id>", "reason": "..." }
}

Results: ${JSON.stringify(truncated, null, 2)}
  `.trim();

  try {
    const raw = await runChat(prompt);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw }; // fallback if AI didn't give valid JSON
    }

    return NextResponse.json({ ok: true, top3: parsed });
  } catch (err: any) {
    console.error("AI top3 error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "AI error" },
      { status: 500 }
    );
  }
}
