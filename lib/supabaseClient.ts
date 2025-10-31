"use client";

/**
 * Browser-only Supabase client with a graceful fallback if @supabase/ssr
 * is not available in the build environment.
 *
 * - Primary: createBrowserClient from @supabase/ssr (best with Next.js App Router)
 * - Fallback: createClient from @supabase/supabase-js
 */

let _client: any | null = null;

function ensureEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return { url, anon };
}

export function getBrowserClient() {
  if (_client) return _client;

  const { url, anon } = ensureEnv();

  try {
    // Prefer the SSR helper if installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createBrowserClient } = require("@supabase/ssr");
    _client = createBrowserClient(url, anon);
    return _client;
  } catch {
    // Fallback to the standard browser client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require("@supabase/supabase-js");
    _client = createClient(url, anon);
    return _client;
  }
}
