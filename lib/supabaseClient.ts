"use client";

import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

/**
 * Returns a singleton Supabase browser client.
 * - Uses only NEXT_PUBLIC_* envs (required on the client).
 * - No custom cookie options (avoids TS overload errors on Vercel).
 */
let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Visible in console for quick diagnosis, but won’t crash render
    console.error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    // Create a harmless dummy to avoid throwing during hydration
    return createBrowserClient("https://example.supabase.co", "invalid");
  }

  if (_client) return _client;
  _client = createBrowserClient(url, anon);
  return _client;
}
