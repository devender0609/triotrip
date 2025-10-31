"use client";

import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

// Keep one browser client for the whole app
let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!_client) {
    // NOTE: don't pass cookieOptions/lifetime here — that caused your previous type errors.
    _client = createBrowserClient(url, anon, { isSingleton: true });
  }
  return _client;
}

export type { SupabaseClient };
