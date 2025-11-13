"use client";

type Props = { count: number };

export default function SavedChip({ count }: Props) {
  return (
    <span
      aria-label="Saved counter"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 34,
        padding: "0 12px",
        borderRadius: 999,
        border: "1px solid #e2e8f0",
        background: "#fff",
        fontWeight: 900,
        fontSize: 14,
        color: "#334155",
      }}
    >
      Saved <span style={{ fontWeight: 900 }}>{count}</span>
    </span>
  );
}
