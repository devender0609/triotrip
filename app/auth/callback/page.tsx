"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const supabase = getSupabaseBrowser();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Causes fragment to be parsed and session to persist
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (alive) {
          const ret = sessionStorage.getItem("triptrio:returnTo") || "/";
          setMsg("Signed in! Redirecting…");
          window.location.replace(ret);
        }
      } catch (e: any) {
        if (alive) setMsg(e?.message ?? "Could not complete sign-in.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Authentication</h1>
        <p className="text-gray-700">{msg}</p>
      </div>
    </main>
  );
}
