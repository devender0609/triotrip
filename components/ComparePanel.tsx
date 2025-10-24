"use client";

import React from "react";

type Props = {
  items: any[]; // packages already filtered by caller
  currency: string;
  onClose: () => void;
  onRemove: (id: string) => void;
};

export default function ComparePanel({ items, currency, onClose, onRemove }: Props) {
  if (!items?.length) return null;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 10,
        zIndex: 40,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 14,
        padding: 10,
        boxShadow: "0 10px 30px rgba(2,8,23,0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <strong>Compare ({items.length})</strong>
        <button
          onClick={onClose}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            padding: "6px 10px",
            fontWeight: 700,
          }}
        >
          Close
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(260px, 1fr)",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {items.map((p, i) => (
          <div
            key={String(p.id ?? i)}
            style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, background: "#fff" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong>Option {i + 1}</strong>
              <button
                onClick={() => onRemove(String(p.id ?? i))}
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", padding: "2px 8px" }}
                title="Remove from compare"
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              {p.origin} → {p.destination}
              {p.returnDate ? " (round)" : " (one-way)"}
            </div>
            <div style={{ fontWeight: 800, marginTop: 4 }}>
              {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
                p.total_cost || p.flight_total || 0
              )}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Pax {(p.passengersAdults ?? 1) + (p.passengersChildren ?? 0) + (p.passengersInfants ?? 0)} ·{" "}
              {(p.cabin || "ECONOMY").replace("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}