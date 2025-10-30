// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  // Fail fast in dev; on Vercel ensure Environment Variables are set
  // NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Avoid throwing during build; just log so pages still build.
  // eslint-disable-next-line no-console
  console.warn('Supabase env missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function getBrowserSupabase() {
  return createBrowserClient(url, anon, {
    // Use the SSR helper’s browser cookie methods.
    // Do NOT pass a custom "lifetime" — it is not a valid field and breaks types.
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined as any;
        const match = document.cookie
          ?.split('; ')
          ?.find((c) => c.startsWith(`${name}=`));
        return match ? decodeURIComponent(match.split('=')[1]) : undefined;
      },
      set(name: string, value: string, options?: {
        domain?: string;
        path?: string;
        maxAge?: number;
        expires?: Date;
        sameSite?: 'lax' | 'strict' | 'none';
        secure?: boolean;
      }) {
        if (typeof document === 'undefined') return;
        let cookie = `${name}=${encodeURIComponent(value)}; Path=${options?.path ?? '/'}`;
        if (options?.domain) cookie += `; Domain=${options.domain}`;
        if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
        if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
        if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
        if (options?.secure) cookie += `; Secure`;
        document.cookie = cookie;
      },
      remove(name: string, options?: { domain?: string; path?: string }) {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; Max-Age=0; Path=${options?.path ?? '/'}${
          options?.domain ? `; Domain=${options.domain}` : ''
        }`;
      },
    },
  });
}
