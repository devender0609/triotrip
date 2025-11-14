// lib/aiClient.ts
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const AI_ENABLED_FLAG =
  process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_AI_ENABLED === "1";

if (!apiKey) {
  console.warn("⚠️ OPENAI_API_KEY is not set. AI features will be disabled.");
}
if (!AI_ENABLED_FLAG) {
  console.warn("ℹ️ AI is disabled via NEXT_PUBLIC_AI_ENABLED.");
}

export async function runChat(prompt: string, systemMessage?: string) {
  // Global kill switch
  if (!AI_ENABLED_FLAG) {
    throw new Error("AI is disabled right now. Please use the normal search.");
  }

  if (!apiKey) {
    throw new Error(
      "AI is not configured. Please set OPENAI_API_KEY on the server."
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            systemMessage ||
            "You are an expert travel planning assistant. Always output valid JSON when asked.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    return content;
  } catch (err: any) {
    // Quota / rate limit
    if (err?.status === 429 || err?.code === "rate_limit_exceeded") {
      throw new Error(
        "Our AI copilot hit its usage limit for now. Please try again later, or use the normal search."
      );
    }
    console.error("OpenAI error:", err);
    throw new Error("AI request failed. Please try again.");
  }
}