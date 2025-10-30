"use client";

export const revalidate = false;            // ✅ avoid static export for auth
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    // Build an absolute redirect back to our /auth/callback
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_BASE ??
           process.env.NEXT_PUBLIC_WEB_SERVER_BASE ??
           "").replace(/\/+$/, "");
    return origin ? `${origin}/auth/callback` : "/auth/callback";
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setBusy(true);
      setErr(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            // Ask for a refresh token for longer sessions
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message ?? "Unable to start Google sign-in.");
      setBusy(false);
    }
  }, [supabase, redirectTo]);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-lg space-y-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(26,26,46,.85), rgba(10,10,22,.85))",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="opacity-75 text-sm">
            Sign in to save trips, compare flights, and keep your preferences.
          </p>
        </header>

        {err && (
          <div className="text-sm rounded-md p-3"
               style={{ background: "rgba(255, 99, 99, .12)", border: "1px solid rgba(255,99,99,.35)" }}>
            {err}
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={busy}
          className="w-full rounded-xl py-3 font-medium transition
                     hover:opacity-95 active:opacity-90
                     focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            background:
              "linear-gradient(90deg, rgb(99,102,241), rgb(217,70,239))",
          }}
        >
          {busy ? "Connecting…" : "Continue with Google"}
        </button>

        <div className="text-xs opacity-70">
          Trouble signing in?{" "}
          <button className="underline" onClick={() => router.push("/")}>
            Go home
          </button>{" "}
          and try again.
        </div>
      </div>
    </main>
  );
}
