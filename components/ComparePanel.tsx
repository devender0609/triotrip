"use client";
import React from "react";

function money(v?: number, c = "USD") {
  if (v == null || !Number.isFinite(v)) return "—";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(v); }
  catch { return `${c} ${v.toFixed(0)}`; }
}
const sumMin = (segs: any[] = []) => segs.reduce((t, s) => t + (Number(s?.duration_minutes) || 0), 0);

export default function ComparePanel({
  items, currency, onClose, onRemove,
}: {
  items: any[]; currency: string; onClose: () => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="compare-overlay" role="dialog" aria-modal>
      <div className="compare-panel">
        <div className="compare-head">
          <strong>Compare ({items.length}/3)</strong>
          <button className="ghost" onClick={onClose}>Close</button>
        </div>

        <div className="compare-grid">
          {items.length === 0 ? (
            <div className="msg msg--warn">Click <b>🆚 Compare</b>, then click any 1–3 result cards to add them here.</div>
          ) : (
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Route / Dates</th>
                  <th>Stops</th>
                  <th>Outbound</th>
                  <th>Return</th>
                  <th>Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => {
                  const out = p.flight?.segments_out || p.flight?.segments || [];
                  const ret = p.returnFlight?.segments || p.flight?.segments_in || [];
                  const price =
                    p.total_cost ?? p.flight_total ??
                    p.flight?.price_usd_converted ?? p.flight?.price_usd ?? null;

                  const id = p.id || `pkg-${i}`;
                  const from = out[0]?.from || p.origin;
                  const to = (out[out.length - 1]?.to) || p.destination;

                  return (
                    <tr key={id}>
                      <td><span className="compare-badge">#{i + 1}</span></td>
                      <td>{from} → {to} {p.departDate}{p.returnDate ? ` • ↩ ${p.returnDate}` : ""}</td>
                      <td>{typeof p.maxStops === "number" ? (p.maxStops === 0 ? "Nonstop" : `${p.maxStops}+`) : "—"}</td>
                      <td>{out.length} seg • {Math.round(sumMin(out) / 60)}h</td>
                      <td>{ret.length ? `${ret.length} seg • ${Math.round(sumMin(ret) / 60)}h` : "—"}</td>
                      <td>{money(price ?? undefined, currency)}</td>
                      <td className="right">
                        <button className="segbtn" onClick={() => onRemove(id)}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
