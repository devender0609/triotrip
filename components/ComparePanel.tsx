"use client";
import React from "react";

const fmt = (n?: number | string, cur = "") => {
  if (n == null || n === "") return "—";
  const val = typeof n === "string" ? parseFloat(n) : n;
  try {
    return new Intl.NumberFormat(undefined, { style: cur ? "currency" : "decimal", currency: cur || "USD", maximumFractionDigits: 0 }).format(val);
  } catch { return String(val); }
};

type Lite = {
  id: string;
  price?: { amount?: number | string; currency?: string };
  flight?: { segments?: any[]; total_duration_minutes?: number; stops?: number };
  returnFlight?: { segments?: any[]; total_duration_minutes?: number; stops?: number };
};

export default function ComparePanel({ items }: { items: Lite[] }) {
  if (!items?.length) {
    return (
      <div className="compare-panel">
        <div style={{ color: "#475569" }}>Add results to <b>Compare</b> by clicking the ➕ Compare button on any card.</div>
      </div>
    );
  }

  return (
    <section className="compare-panel">
      <header style={{ fontWeight: 800, marginBottom: 8 }}>🆚 Compare</header>
      <div className="compare-grid">
        {items.map((p) => {
          const price = p.price?.amount;
          const cur = p.price?.currency || "USD";
          const out = p.flight;
          const ret = p.returnFlight;
          const totalMin = (Number(out?.total_duration_minutes)||0) + (Number(ret?.total_duration_minutes)||0);

          return (
            <div key={p.id} className="result-card" style={{ background: "#fff" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                💸 {fmt(price, cur)} &nbsp; • &nbsp; ⏱️ {totalMin ? `${Math.floor(totalMin/60)}h ${totalMin%60}m` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "#334155" }}>
                ✈️ Outbound: {out?.stops == null ? "—" : (out.stops === 0 ? "Nonstop" : `${out.stops} stop${out.stops===1?"":"s"}`)}
                <br/>
                ↩ Return: {ret?.stops == null ? "—" : (ret.stops === 0 ? "Nonstop" : `${ret.stops} stop${ret.stops===1?"":"s"}`)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
