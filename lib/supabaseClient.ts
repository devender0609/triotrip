"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Factory for a browser Supabase client.
 * We keep it as a function so the latest env gets picked up and
 * so tests/SSR don't create stray singletons.
 */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  // Let the SDK handle cookies automatically; no custom shim.
  return createBrowserClient(url, anon);
}

/**
 * Back-compat default instance for places that import { supabase }.
 * (e.g., app/auth/callback/page.tsx from older iterations)
 */
export const supabase = createSupabaseBrowser();

// Optional old alias some parts of your repo used before.
export const getBrowserSupabase = createSupabaseBrowser;
