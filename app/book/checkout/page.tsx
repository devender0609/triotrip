// app/book/checkout/page.tsx
"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type OfferInfo = { total_amount: string; total_currency: string };

type Pax = {
  title: "mr" | "mrs" | "ms";
  given_name: string;
  family_name: string;
  born_on: string; // YYYY-MM-DD
  gender: "m" | "f" | "x";
  type: "adult" | "child" | "infant";
};

function toInt(v: string | null, d = 0) {
  const n = parseInt(String(v || ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : d;
}

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const flightId = params.get("flightId") || "";

  // pax breakdown coming from the ResultCard link
  const nAdults = Math.max(1, toInt(params.get("adults"), 1));
  const nChildren = Math.max(0, toInt(params.get("children"), 0));
  const nInfants = Math.max(0, toInt(params.get("infants"), 0));
  const childrenAgesParam = (params.get("childrenAges") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Math.max(0, Math.min(17, parseInt(s, 10))));

  const [offer, setOffer] = useState<OfferInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // build default passengers
  const [passengers, setPassengers] = useState<Pax[]>(() => {
    const list: Pax[] = [];
    for (let i = 0; i < nAdults; i++) {
      list.push({
        title: "mr",
        given_name: "",
        family_name: "",
        born_on: "",
        gender: "m",
        type: "adult",
      });
    }
    for (let i = 0; i < nChildren; i++) {
      list.push({
        title: "ms",
        given_name: "",
        family_name: "",
        born_on: "",
        gender: "x",
        type: "child",
      });
    }
    for (let i = 0; i < nInfants; i++) {
      list.push({
        title: "ms",
        given_name: "",
        family_name: "",
        born_on: "",
        gender: "x",
        type: "infant",
      });
    }
    return list;
  });

  useEffect(() => {
    (async () => {
      if (!flightId) {
        setOffer(null);
        return;
      }
      try {
        setErr(null);
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"}/duffel/offer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offer_id: flightId }),
          }
        );
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json();
        setOffer({
          total_amount: j.total_amount,
          total_currency: j.total_currency,
        });
      } catch (e: any) {
        setErr(e?.message || "Could not fetch offer");
      }
    })();
  }, [flightId]);

  const allValid = useMemo(() => {
    if (!email || !flightId) return false;
    return passengers.every((p) => p.given_name && p.family_name && p.born_on);
  }, [email, passengers, flightId]);

  async function placeOrder() {
    try {
      setLoading(true);
      setErr(null);

      // Duffel expects passengers with type and names/dob
      const body = {
        offer_id: flightId,
        contact: { email, phone_number: phone },
        passengers: passengers.map(({ title, given_name, family_name, born_on, gender, type }) => ({
          title,
          given_name,
          family_name,
          born_on,
          gender,
          type, // adult/child/infant
        })),
      };

      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"}/duffel/order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
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

  return (
    <main style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => (history.length > 1 ? history.back() : router.push("/"))}
          style={{ border: "1px solid #e2e8f0", borderRadius: 8, height: 36, padding: "0 10px", background: "#fff", cursor: "pointer" }}
        >
          ← Back
        </button>
        <Link href="/" style={{ marginLeft: "auto", textDecoration: "none", fontWeight: 900, color: "#0ea5e9" }}>
          TrioTrip Home
        </Link>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontWeight: 900 }}>Checkout</h1>
        <p style={{ color: "#475569", marginTop: 0 }}>
          Enter passenger and contact details. Your order will be created in Duffel (sandbox).
        </p>

        {offer && (
          <div style={{ marginBottom: 12, fontWeight: 800 }}>
            Total: {offer.total_amount} {offer.total_currency}
          </div>
        )}
        {err && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</div>}

        {/* Contact */}
        <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <legend style={{ fontWeight: 800 }}>Contact</legend>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
            />
            <input
              placeholder="Phone (+1…)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
            />
          </div>
        </fieldset>

        {/* Passengers */}
        <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <legend style={{ fontWeight: 800 }}>Passengers</legend>

          <div style={{ display: "grid", gap: 12 }}>
            {passengers.map((p, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                  {p.type.charAt(0).toUpperCase() + p.type.slice(1)} {idx + 1}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 8 }}>
                  <select
                    value={p.title}
                    onChange={(e) =>
                      setPassengers((prev) => {
                        const copy = prev.slice();
                        (copy[idx] as Pax).title = e.target.value as Pax["title"];
                        return copy;
                      })
                    }
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
                  >
                    <option value="mr">Mr</option>
                    <option value="mrs">Mrs</option>
                    <option value="ms">Ms</option>
                  </select>
                  <input
                    placeholder="First name"
                    value={p.given_name}
                    onChange={(e) =>
                      setPassengers((prev) => {
                        const copy = prev.slice();
                        (copy[idx] as Pax).given_name = e.target.value;
                        return copy;
                      })
                    }
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
                  />
                  <input
                    placeholder="Last name"
                    value={p.family_name}
                    onChange={(e) =>
                      setPassengers((prev) => {
                        const copy = prev.slice();
                        (copy[idx] as Pax).family_name = e.target.value;
                        return copy;
                      })
                    }
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <input
                    type="date"
                    value={p.born_on}
                    onChange={(e) =>
                      setPassengers((prev) => {
                        const copy = prev.slice();
                        (copy[idx] as Pax).born_on = e.target.value;
                        return copy;
                      })
                    }
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
                  />
                  <select
                    value={p.gender}
                    onChange={(e) =>
                      setPassengers((prev) => {
                        const copy = prev.slice();
                        (copy[idx] as Pax).gender = e.target.value as Pax["gender"];
                        return copy;
                      })
                    }
                    style={{ height: 38, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px" }}
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                    <option value="x">Unspecified</option>
                  </select>
                </div>
                {p.type === "child" && childrenAgesParam[idx - nAdults] != null && (
                  <div style={{ marginTop: 6, color: "#475569" }}>
                    Age at travel: {childrenAgesParam[idx - nAdults]} years
                  </div>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <button
          onClick={placeOrder}
          disabled={!allValid || loading}
          style={{
            height: 44,
            padding: "0 16px",
            border: "none",
            borderRadius: 10,
            fontWeight: 900,
            color: "#fff",
            background: "linear-gradient(90deg,#06b6d4,#0ea5e9)",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
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
      <CheckoutInner />
    </Suspense>
  );
}
