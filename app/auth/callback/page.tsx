"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;            // ✅ must be a number or false
export const fetchCache = "force-no-store";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseClient";

function CallbackInner() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const run = async () => {
      try {
        const code = search.get("code");
        const next = search.get("next") || "/";

        if (!code) {
          router.replace("/login");
          return;
        }

        const sb = createSupabaseBrowser();
        await sb.auth.exchangeCodeForSession(code);

        router.replace(next);
      } catch (e) {
        console.error("Auth callback error:", e);
        router.replace("/login");
      }
    };
    run();
  }, [search, router]);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold mb-1">Signing you in…</h1>
      <p className="text-sm opacity-70">Please wait while we complete authentication.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-8 text-center">Preparing sign-in…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
