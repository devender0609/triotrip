import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function getBrowserSupabase() {
  // No cookieOptions.lifetime here — that triggered the type error earlier.
  return createBrowserClient(url, anon, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined as any;
        const match = document.cookie?.split('; ')?.find(c => c.startsWith(`${name}=`));
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
