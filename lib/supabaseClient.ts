'use client';

import { createBrowserClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Safe browser-only cookie helpers required by @supabase/ssr.
 * NOTE: Do NOT pass cookieOptions.lifetime — it's not a valid option in current typings.
 */
const cookieMethods = {
  get(name: string) {
    if (typeof document === 'undefined') return undefined as unknown as string;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : undefined;
  },
  set(
    name: string,
    value: string,
    options?: Omit<CookieOptionsWithName, 'name'>
  ) {
    if (typeof document === 'undefined') return;
    let cookie = `${name}=${encodeURIComponent(value)}; Path=${options?.path ?? '/'}`;

    if (options?.domain) cookie += `; Domain=${options.domain}`;
    if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
    if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
    if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
    if (options?.secure) cookie += `; Secure`;

    document.cookie = cookie;
  },
  remove(name: string, options?: Omit<CookieOptionsWithName, 'name'>) {
    if (typeof document === 'undefined') return;
    const path = options?.path ?? '/';
    const domain = options?.domain ? `; Domain=${options.domain}` : '';
    document.cookie = `${name}=; Path=${path}${domain}; Max-Age=0`;
  },
};

/**
 * Singleton browser Supabase client
 */
export function getBrowserSupabase() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Surface a clear error in dev; in prod this will just no-op gracefully.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  }

  browserClient = createBrowserClient(url ?? '', anon ?? '', {
    // Provide cookie methods (no cookieOptions with lifetime!)
    cookies: cookieMethods,
  });

  return browserClient;
}

// Convenience export used by many files
export const supabase = getBrowserSupabase();
