"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabaseClient";

// Make this route dynamic; do NOT export `revalidate` here
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const run = async () => {
      try {
        const error = params.get("error_description") || params.get("error");
        if (error) {
          console.error("Auth error:", error);
          router.replace("/login?error=" + encodeURIComponent(error));
          return;
        }

        const code = params.get("code");
        if (!code) {
          // No code in callback; just go home
          router.replace("/");
          return;
        }

        const supabase = getBrowserClient();
        // PKCE exchange for session
        await supabase.auth.exchangeCodeForSession(code);

        // success → home
        router.replace("/");
      } catch (e) {
        console.error("Callback handling failed:", e);
        router.replace("/login?error=callback_failed");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24, fontWeight: 700 }}>
      Signing you in…
    </div>
  );
}
