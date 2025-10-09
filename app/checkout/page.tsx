"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const s: Record<string, React.CSSProperties> = {
  page: { margin: "0 auto", maxWidth: 1000, padding: "24px 16px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backBtn: { border: "1px solid #cbd5e1", borderRadius: 12, padding: "8px 12px", background: "#fff", cursor: "pointer" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, boxShadow: "0 6px 18px rgba(2,6,23,.06)" },
  grid2: { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" },
  label: { display: "block", fontSize: 12, color: "#475569", marginBottom: 4 },
  input: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", outline: "none" },
  tabs: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tab: { border: "1px solid #cbd5e1", borderRadius: 12, padding: "8px 12px", background: "#fff", cursor: "pointer", fontWeight: 700 },
  tabActive: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },
  title: { fontWeight: 700, color: "#0f172a", marginBottom: 8 },
  totalRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  confirm: { border: "none", color: "#fff", borderRadius: 12, padding: "10px 16px", fontWeight: 900, background: "linear-gradient(90deg,#06b6d4,#0ea5e9)", cursor: "pointer" },
};

function Field({ label, placeholder, type='text' }:{ label:string; placeholder?:string; type?:string }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} placeholder={placeholder} type={type} />
    </div>
  );
}

function TravelerCard({ index }: { index: number }) {
  return (
    <div style={s.card}>
      <div style={{ ...s.title, marginBottom: 12 }}>Traveler #{index + 1}</div>
      <div style={s.grid2}>
        <div>
          <label style={s.label}>Title</label>
          <select style={s.input as any}>
            <option>Mr</option><option>Ms</option><option>Mrs</option><option>Dr</option>
          </select>
        </div>
        <Field label="First name" placeholder="First name" />
        <Field label="Last name" placeholder="Last name" />
        <Field label="Date of birth" type="date" />
        <div>
          <label style={s.label}>Gender</label>
          <select style={s.input as any}>
            <option>Male</option><option>Female</option><option>Prefer not to say</option>
          </select>
        </div>
        <Field label="Nationality" placeholder="USA" />
      </div>
    </div>
  );
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const airline = params.get("airline") || "Airline";
  const origin = params.get("origin") || "";
  const destination = params.get("destination") || "";
  const pax = Math.max(1, Number(params.get("pax") || params.get("count") || 1));
  const price = Number(params.get("price") || 0);

  const [active, setActive] = useState(0);
  const tabs = Array.from({ length: pax }, (_, i) => i);

  return (
    <main style={s.page}>
      <div style={s.row}>
        <button onClick={() => router.back()} style={s.backBtn}>← Back</button>
        <div style={{ fontSize: 12, color: "#64748b" }}>Secure checkout</div>
      </div>

      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.totalRow}>
          <div style={s.title}>{airline}</div>
          <div style={{ color: "#334155" }}>{origin} → {destination}</div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>${Math.round(price)}</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.tabs}>
          {tabs.map((i) => (
            <button key={i} onClick={() => setActive(i)} style={{ ...s.tab, ...(active===i ? s.tabActive : {}) }}>Traveler {i+1}</button>
          ))}
        </div>

        <TravelerCard index={active} />

        <div style={{ ...s.grid2, marginTop: 16 }}>
          <div style={s.card}>
            <div style={s.title}>Contact details</div>
            <div style={s.grid2}>
              <Field label="Email" placeholder="you@example.com" />
              <Field label="Phone" placeholder="+1 555 000 0000" />
            </div>
          </div>
          <div style={s.card}>
            <div style={s.title}>Payment</div>
            <div style={s.grid2}>
              <Field label="Cardholder" placeholder="Name on card" />
              <Field label="Card number" placeholder="1234 5678 9012 3456" />
              <Field label="Expiry" placeholder="MM/YY" />
              <Field label="CVC" placeholder="123" />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'end', marginTop: 16 }}>
          <button style={s.confirm}>Confirm booking</button>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main style={s.page}>Loading…</main>}>
      <CheckoutContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
