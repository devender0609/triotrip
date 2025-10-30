"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function CallbackInner() {
  const supabase = getBrowserSupabase();
  const params = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        // Ensure session gets written, then bounce home
        await supabase.auth.getSession();
        if (!canceled) {
          setMsg("Signed in. Redirecting…");
          router.replace("/");
        }
      } catch (e: any) {
        if (!canceled) setMsg(e?.message ?? "Error finalizing sign-in.");
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const error = params.get("error_description") || params.get("error");
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold mb-2">Auth callback</h1>
      <p>{error ? `Error: ${error}` : msg}</p>
    </div>
  );
}

export default function CallbackPage() {
  // Wrap hook usage in Suspense to satisfy Next CSR bailout warning
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-10">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
