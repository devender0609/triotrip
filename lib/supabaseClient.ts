"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Primary export used by client components/pages */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // No cookies option — let the SDK handle it
  return createBrowserClient(url, anon);
}

/** Back-compat alias for existing imports */
export const getBrowserSupabase = createSupabaseBrowser;
