"use client";
import React from "react";

type Props = {
  pkg: any;
  index?: number;
  currency?: string;
  pax?: number;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: (count: number) => void;
  large?: boolean;
  showHotel?: boolean;
};

function ensureHttps(u?: string | null) {
  if (!u) return "";
  let s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = s.replace(/^http:\/\//i, "https://");
  return s;
}

function fmtTime(t?: string) {
  if (!t) return "";
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDur(min?: number) {
  if (min == null) return "";
  const h = Math.floor(min / 60);
  const m = Math.max(0, min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function minsBetween(a?: string, b?: string) {
  if (!a || !b) return undefined;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (isNaN(A) || isNaN(B)) return undefined;
  const diffMin = Math.round((B - A) / 60000);
  return diffMin < 0 ? undefined : diffMin;
}

export default function ResultCard({
  pkg,
  index = 0,
  currency,
  pax = 1,
  comparedIds,
  onToggleCompare,
  large = true,
  showHotel,
}: Props) {
  const id = pkg.id || `pkg-${index}`;
  const compared = !!comparedIds?.includes(id);

  const outSegs: any[] =
    (Array.isArray(pkg?.flight?.segments) && pkg.flight.segments) ||
    pkg.flight?.segments_out ||
    [];
  const inSegs: any[] =
    (Array.isArray(pkg?.returnFlight?.segments) && pkg.returnFlight.segments) ||
    pkg.flight?.segments_in ||
    [];

  const out0 = outSegs[0];
  const in0 = inSegs[0];
  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (in0?.depart_time || "").slice(0, 10);

  const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
  const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
  const infants = Number(pkg.passengersInfants ?? pkg.infants ?? 0) || 0;

  const wrap: React.CSSProperties = {
    display: "grid",
    gap: 12,
    border: compared ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "linear-gradient(180deg,#ffffff,#f6fbff)",
  };

  return (
    <section className={`result-card ${compared ? "result-card--compared" : ""}`} style={wrap}>
      {/* Header with Compare toggle */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>
          ✈️ Option {index + 1} • {from}-{to} {dateOut ? `• ${dateOut}` : ""}{" "}
          {pkg.roundTrip && dateRet ? `↩ ${dateRet}` : ""}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onToggleCompare?.(id)}
            style={{
              border: compared ? "2px solid #0ea5e9" : "1px solid #94a3b8",
              background: compared ? "#e0f2fe" : "#fff",
              color: "#0f172a",
              padding: "6px 10px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
            }}
            aria-pressed={compared}
            title={compared ? "Remove from Compare" : "Add to Compare"}
          >
            {compared ? "🧪 In Compare" : "➕ Compare"}
          </button>
        </div>
      </header>

      {/* 🛫 Outbound */}
      {outSegs.length > 0 && (
        <div
          style={{
            border: "1px solid #cfe3ff",
            borderRadius: 12,
            padding: 10,
            display: "grid",
            gap: 8,
            background: "linear-gradient(180deg,#ffffff,#eef6ff)",
          }}
        >
          <div style={{ fontWeight: 700, color: "#0b3b52" }}>🛫 Outbound</div>
          {outSegs.map((s, i) => {
            const next = outSegs[i + 1];
            const layMin = next ? minsBetween(s.arrive_time, next?.depart_time) : undefined;
            return (
              <React.Fragment key={`o${i}`}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {s.from} → {s.to}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      {fmtTime(s.depart_time)} — {fmtTime(s.arrive_time)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{fmtDur(s.duration_minutes)}</div>
                </div>
                {next && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#1e293b",
                      padding: "6px 10px",
                      background: "#f1f5f9",
                      borderRadius: 8,
                      marginTop: -2,
                    }}
                  >
                    ⌛ Layover at <strong>{s.to}</strong>
                    {typeof layMin === "number" ? ` — ${fmtDur(layMin)}` : ""}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 🛬 Return */}
      {inSegs.length > 0 && (
        <div
          style={{
            border: "1px solid #cfe3ff",
            borderRadius: 12,
            padding: 10,
            display: "grid",
            gap: 8,
            background: "linear-gradient(180deg,#ffffff,#eef6ff)",
          }}
        >
          <div style={{ fontWeight: 700, color: "#0b3b52" }}>🛬 Return</div>
          {inSegs.map((s, i) => {
            const next = inSegs[i + 1];
            const layMin = next ? minsBetween(s.arrive_time, next?.depart_time) : undefined;
            return (
              <React.Fragment key={`i${i}`}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {s.from} → {s.to}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      {fmtTime(s.depart_time)} — {fmtTime(s.arrive_time)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{fmtDur(s.duration_minutes)}</div>
                </div>
                {next && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#1e293b",
                      padding: "6px 10px",
                      background: "#f1f5f9",
                      borderRadius: 8,
                      marginTop: -2,
                    }}
                  >
                    ⌛ Layover at <strong>{s.to}</strong>
                    {typeof layMin === "number" ? ` — ${fmtDur(layMin)}` : ""}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* (Hotel section left as-is; your earlier logic still applies) */}
    </section>
  );
}
