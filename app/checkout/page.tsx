"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type OfferInfo = { total_amount: string; total_currency: string };
type Passenger = {
  type: "adult" | "child" | "infant";
  title: "mr" | "mrs" | "ms";
  given_name: string;
  family_name: string;
  born_on: string; // YYYY-MM-DD
  gender: "m" | "f" | "x";
};

function safeInt(v: string | null, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <fieldset
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        background: "#fff",
      }}
    >
      <legend style={{ fontWeight: 800 }}>{title}</legend>
      {children}
    </fieldset>
  );
}

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();

  const flightId = sp.get("flightId") || "";
  const adultsN = Math.max(1, safeInt(sp.get("adults"), 1));
  const childrenN = safeInt(sp.get("children"), 0);
  const infantsN = safeInt(sp.get("infants"), 0);

  const [offer, setOffer] = useState<OfferInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Build passenger form rows based on counts
  const [passengers, setPassengers] = useState<Passenger[]>(() => {
    const rows: Passenger[] = [];
    for (let i = 0; i < adultsN; i++)
      rows.push({ type: "adult", title: "mr", given_name: "", family_name: "", born_on: "", gender: "m" });
    for (let i = 0; i < childrenN; i++)
      rows.push({ type: "child", title: "mr", given_name: "", family_name: "", born_on: "", gender: "m" });
    for (let i = 0; i < infantsN; i++)
      rows.push({ type: "infant", title: "mr", given_name: "", family_name: "", born_on: "", gender: "m" });
    return rows;
  });

  useEffect(() => {
    (async () => {
      if (!flightId) { setOffer(null); return; }
      try {
        setErr(null);
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"}/duffel/offer`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer_id: flightId }) }
        );
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json();
        setOffer({ total_amount: j.total_amount, total_currency: j.total_currency });
      } catch (e: any) {
        setErr(e?.message || "Could not fetch offer");
      }
    })();
  }, [flightId]);

  async function placeOrder() {
    try {
      setLoading(true);
      setErr(null);
      const body = {
        offer_id: flightId,
        contact: { email, phone_number: phone },
        passengers: passengers.map((p) => ({
          title: p.title,
          given_name: p.given_name,
          family_name: p.family_name,
          born_on: p.born_on,
          gender: p.gender,
          type: p.type, // Duffel accepts "adult" / "child" / "infant"
        })),
      };
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"}/duffel/order`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const txt = await r.text();
      if (!r.ok) throw new Error(txt);
      const j = JSON.parse(txt);
      const orderId = j?.data?.id || j?.id || "";
      router.push(`/book/complete?orderId=${encodeURIComponent(orderId)}`);
    } catch (e: any) {
      setErr(e?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  const canBook = !!flightId && !!email && passengers.every(p => p.given_name && p.family_name && p.born_on);

  return (
    <main style={{ maxWidth: 880, margin: "20px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          style={{
            border: "1px solid #e2e8f0", borderRadius: 8, height: 36, lineHeight: "36px",
            padding: "0 10px", background: "#fff", cursor: "pointer"
          }}
        >
          ← Back
        </button>
        <Link href="/" style={{ marginLeft: "auto", textDecoration: "none", fontWeight: 900, color: "#0ea5e9" }}>
          TripTrio Home
        </Link>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontWeight: 900 }}>Checkout</h1>
        <p style={{ color: "#475569", marginTop: 0 }}>
          Enter passenger and contact details. We’ll create the order in Duffel (sandbox).
        </p>

        {offer && <div style={{ marginBottom: 12, fontWeight: 800 }}>Total: {offer.total_amount} {offer.total_currency}</div>}
        {err && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</div>}

        <Section title="Contact">
          <div style={{ display: "grid", gap: 8 }}>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }} />
            <input placeholder="Phone (+1…)" value={phone} onChange={(e) => setPhone(e.target.value)}
              style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }} />
          </div>
        </Section>

        <Section title={`Passengers (${passengers.length})`}>
          <div style={{ display: "grid", gap: 12 }}>
            {passengers.map((p, i) => (
              <div key={i} style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  {p.type === "adult" ? "Adult" : p.type === "child" ? "Child" : "Infant"} #{i + 1}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 8 }}>
                  <select value={p.title}
                    onChange={(e) => {
                      const v = e.target.value as "mr" | "mrs" | "ms";
                      setPassengers((arr) => arr.map((row, k) => (k === i ? { ...row, title: v } : row)));
                    }}
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}>
                    <option value="mr">Mr</option><option value="mrs">Mrs</option><option value="ms">Ms</option>
                  </select>
                  <input placeholder="First name" value={p.given_name}
                    onChange={(e) => setPassengers((arr) => arr.map((row, k) => (k === i ? { ...row, given_name: e.target.value } : row)))}
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }} />
                  <input placeholder="Last name" value={p.family_name}
                    onChange={(e) => setPassengers((arr) => arr.map((row, k) => (k === i ? { ...row, family_name: e.target.value } : row)))}
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input type="date" value={p.born_on}
                    onChange={(e) => setPassengers((arr) => arr.map((row, k) => (k === i ? { ...row, born_on: e.target.value } : row)))}
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }} />
                  <select value={p.gender}
                    onChange={(e) => {
                      const v = e.target.value as "m" | "f" | "x";
                      setPassengers((arr) => arr.map((row, k) => (k === i ? { ...row, gender: v } : row)));
                    }}
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}>
                    <option value="m">Male</option><option value="f">Female</option><option value="x">Unspecified</option>
                  </select>
                </div>
                <hr style={{ border: 0, borderTop: "1px dashed #e2e8f0", margin: "4px 0 0" }} />
              </div>
            ))}
          </div>
        </Section>

        <button
          onClick={placeOrder}
          disabled={loading || !canBook}
          style={{
            height: 44, padding: "0 16px", border: "none", borderRadius: 10, fontWeight: 900,
            color: "#fff", background: "linear-gradient(90deg,#06b6d4,#0ea5e9)",
            opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Booking…" : "Pay (sandbox) & Book"}
        </button>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
