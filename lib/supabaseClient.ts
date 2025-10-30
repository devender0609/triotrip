// lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    console.warn("Supabase envs missing. Check Vercel env vars.");
  }
  return createBrowserClient(url, anon, {
    cookies: {
      get(name: string) {
        return typeof document === "undefined"
          ? undefined
          : (document.cookie
              ?.split("; ")
              ?.find((c) => c.startsWith(`${name}=`))
              ?.split("=")[1]);
      },
    },
  });
}
