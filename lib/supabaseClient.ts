// lib/supabaseClient.ts
// Works in both Client components (browser) and on the server if needed.

import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton for browser usage
let _browser: ReturnType<typeof createSupabaseJsClient> | null = null;

export function supabaseBrowser() {
  if (!_browser) {
    _browser = createSupabaseJsClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _browser;
}

// Optional: server helper (route handlers, RSC) if you need it later.
export function supabaseServer(opts: {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}) {
  return createServerClient(url, anon, {
    cookies: {
      get: opts.get,
      set: opts.set,
      remove: opts.remove,
    },
  });
}
