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
        // This ensures the fragment is consumed and session stored
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
        <p className="mt-4 text-sm text-gray-500">
          If this page doesn’t redirect you automatically,{" "}
          <button
            className="rounded-lg bg-sky-600 px-3 py-1 text-white hover:bg-sky-700"
            onClick={() => (window.location.href = "/")}
          >
            click here
          </button>
          .
        </p>
      </div>
    </main>
  );
}
