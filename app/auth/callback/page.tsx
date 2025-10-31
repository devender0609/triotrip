"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabaseClient";

// Primitives only (no objects)
export const revalidate = false;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const code = sp.get("code");
        if (!code) {
          router.replace("/login");
          return;
        }
        const supabase = getBrowserSupabase();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error", error);
          router.replace("/login?error=auth");
          return;
        }
        router.replace("/");
      } catch (e) {
        console.error(e);
        router.replace("/login?error=auth");
      }
    })();
  }, [sp, router]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Signing you in…</h1>
      <p>Please wait a moment.</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
