"use client";

import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error("Supabase env not set");
  }

  _client = createBrowserClient(url, anon, {
    // Use modern cookies API (no custom get/set/remove needed)
    cookieOptions: {
      name: "sb-access-token",
      lifetime: 60 * 60 * 24 * 7, // 7d
      domain: undefined,
      path: "/",
      sameSite: "lax",
    },
  });

  return _client;
}

// Optional singleton for simple imports: `import { supabase } from '@/lib/supabaseClient'`
export const supabase = getBrowserSupabase();
