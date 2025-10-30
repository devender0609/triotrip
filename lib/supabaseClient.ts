"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Singleton Supabase browser client (uses NEXT_PUBLIC_* envs only). */
let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    // Create a harmless placeholder to avoid crashes during build
    return createBrowserClient("https://example.supabase.co", "invalid") as unknown as SupabaseClient;
  }

  if (_client) return _client;
  _client = createBrowserClient(url, anon) as unknown as SupabaseClient;
  return _client;
}
