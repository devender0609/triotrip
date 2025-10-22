"use client";

import React from "react";

export default function SurveyWidget() {
  return (
    <section
      style={{
        marginTop: 16,
        padding: 12,
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#ffffff",
      }}
    >
      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
        Tell us how we did
      </div>
      <div style={{ color: "#475569", fontSize: 14 }}>
        Thanks for trying TrioTrip! What should we improve?
      </div>
      {/* drop your real widget/embed here later */}
    </section>
  );
}
