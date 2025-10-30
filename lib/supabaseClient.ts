"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Primary export */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(url, anon, {
    cookies: {
      get(name: string) {
        if (typeof document === "undefined") return undefined;
        const match = document.cookie
          ?.split("; ")
          ?.find((c) => c.startsWith(`${name}=`));
        return match?.split("=")[1];
      },
    },
  });
}

/** Back-compat alias for existing imports elsewhere */
export const getBrowserSupabase = createSupabaseBrowser;
