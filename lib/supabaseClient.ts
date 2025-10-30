"use client";
import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return createBrowserClient("https://example.supabase.co", "invalid");
  }

  if (_client) return _client;
  _client = createBrowserClient(url, anon);
  return _client;
}
