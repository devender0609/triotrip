// lib/supabaseClient.ts
'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helpful runtime checks (will surface a clear message instead of a generic “Network error”)
if (!url) {
  // eslint-disable-next-line no-console
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}
if (!anon) {
  // eslint-disable-next-line no-console
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Browser-side Supabase client.
 * Do NOT use the service key here—only the public anon key.
 * The auth callback page will use this instance to exchange the PKCE code for a session.
 */
export const supabase = createClient(url || '', anon || '', {
  auth: {
    persistSession: true,
    detectSessionInUrl: true, // required for PKCE
    flowType: 'pkce',
  },
});
