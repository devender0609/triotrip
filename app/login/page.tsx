"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const sb = createSupabaseBrowser();

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_BASE || ""}/auth/callback`;

  const signInWithGoogle = async () => {
    setBusy(true);
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      console.error(error);
      setBusy(false);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) {
      console.error(error);
      return;
    }
    alert("Check your email for a sign-in link.");
  };

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold mb-6">Login</h1>

      <button
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full rounded-lg border px-4 py-2 mb-6 hover:bg-black/5"
      >
        {busy ? "Opening Google…" : "Sign in with Google"}
      </button>

      <div className="text-sm opacity-60 mb-2">or</div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg border px-4 py-2 hover:bg-black/5"
        >
          Send magic link
        </button>
      </form>

      <p className="mt-6 text-xs opacity-60">
        You’ll be redirected to <code>/auth/callback</code> after authentication.
      </p>

      <button
        className="mt-6 text-sm underline"
        onClick={() => router.push("/")}
      >
        ← Back to home
      </button>
    </div>
  );
}
