"use client";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_BASE || ""}/auth/callback`,
      },
    });
    if (error) alert(error.message);
    else alert("Check your email for a magic link!");
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_BASE || ""}/auth/callback`,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Sign in</h1>

      <form onSubmit={signInWithEmail} style={{ display: "grid", gap: 12 }}>
        <label>
          <div>Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>
        <button type="submit">Send Magic Link</button>
      </form>

      <div style={{ margin: "16px 0", textAlign: "center" }}>— or —</div>

      <button onClick={signInWithGoogle}>Continue with Google</button>
    </div>
  );
}
