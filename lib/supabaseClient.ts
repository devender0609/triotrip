"use client";

/**
 * Browser-only Supabase client with SSR helper fallback.
 * Exports a stable name: getSupabase()
 */
let _client: any | null = null;

function ensureEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anon };
}

export function getSupabase() {
  if (_client) return _client;
  const { url, anon } = ensureEnv();

  try {
    // Prefer @supabase/ssr if present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createBrowserClient } = require("@supabase/ssr");
    _client = createBrowserClient(url, anon);
  } catch {
    // Fallback to supabase-js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require("@supabase/supabase-js");
    _client = createClient(url, anon);
  }
  return _client;
}
