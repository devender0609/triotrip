"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Browser-only singleton */
export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!_client) {
    _client = createClient(url, anon, {
      auth: {
        persistSession: true,
        storageKey: "tt-sb-auth",
        // use localStorage in the browser, nothing on server
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }
  return _client;
}

export type { SupabaseClient };
