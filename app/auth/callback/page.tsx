"use client";

export const revalidate = false;            // ✅ app router: no static export here
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState<string>("Exchanging code…");

  useEffect(() => {
    const run = async () => {
      try {
        const code = search.get("code");
        if (!code) {
          setStatus("error");
          setMessage("Missing authorization code.");
          // Send back to login with a friendly message
          setTimeout(() => router.replace("/login?error=missing_code"), 600);
          return;
        }

        const supabase = getBrowserSupabase();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setStatus("error");
          setMessage(error.message || "Could not complete sign-in.");
          setTimeout(
            () => router.replace("/login?error=exchange_failed"),
            900
          );
          return;
        }

        setStatus("ok");
        setMessage("Signed in! Redirecting…");
        setTimeout(() => router.replace("/"), 300);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message ?? "Unexpected error.");
        setTimeout(() => router.replace("/login?error=unexpected"), 900);
      }
    };

    // Run once after mount
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, rgba(26,26,46,.85), rgba(10,10,22,.85))",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <h1 className="text-xl font-semibold mb-2">
          {status === "working" ? "Finishing Sign-In" : "Authentication"}
        </h1>
        <p className="opacity-80">{message}</p>
        <div className="mt-4 text-sm opacity-70">
          If this takes more than a few seconds,{" "}
          <button
            className="underline"
            onClick={() => router.replace("/login")}
          >
            try logging in again
          </button>
          .
        </div>
      </div>
    </main>
  );
}
