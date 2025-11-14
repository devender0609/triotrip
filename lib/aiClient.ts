// lib/aiClient.ts
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ OPENAI_API_KEY is not set. AI features will be disabled.");
}

// Simple wrapper so we can call AI from API routes
export async function runChat(prompt: string, systemMessage?: string) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing – set it in .env.local and Vercel.");
  }

  const client = new OpenAI({ apiKey });

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
}
