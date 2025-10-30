"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const run = async () => {
      try {
        const code = params.get("code");
        const next = params.get("next") || "/";

        if (!code) {
          // No code? Go back to login
          router.replace("/login");
          return;
        }

        const sb = createSupabaseBrowser();
        // Exchange OAuth code for a session in the browser
        await sb.auth.exchangeCodeForSession(code);

        // All set—send them onward
        router.replace(next);
      } catch (err) {
        console.error("Auth callback error:", err);
        router.replace("/login");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold mb-2">Signing you in…</h1>
      <p className="text-sm opacity-70">
        Please wait while we complete authentication.
      </p>
    </div>
  );
}
