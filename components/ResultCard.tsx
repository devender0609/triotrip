/* components/ResultCard.tsx */
"use client";

import React, { useMemo } from "react";

/** ====== Lightweight helpers (no external deps) ====== **/
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
function fmtTime(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
function fmtDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtDur(mins?: number) {
  if (!mins && mins !== 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}
function airlineName(code?: string) {
  if (!code) return "";
  const map: Record<string, string> = {
    AA: "American Airlines",
    UA: "United",
    DL: "Delta",
    WN: "Southwest",
    B6: "JetBlue",
    AS: "Alaska",
    AC: "Air Canada",
    AF: "Air France",
    BA: "British Airways",
    EK: "Emirates",
    QR: "Qatar Airways",
    SQ: "Singapore Airlines",
  };
  return map[code] || code;
}

type Segment = {
  depTime?: string; // ISO
  arrTime?: string; // ISO
  dep?: string;     // IATA
  arr?: string;     // IATA
  carrier?: string; // AA, UA, etc
  flightNo?: string;
  durationMins?: number;
};

type Leg = {
  segments?: Segment[];
  durationMins?: number;
  stops?: number;
};

type Flight = {
  outbound?: Leg;
  return?: Leg;
  price?: number;
  currency?: string;
  deeplink?: string; // TrioTrip / provider booking link
};

type Hotel = {
  id?: string;
  name?: string;
  stars?: number;
  priceNight?: number;
  priceTotal?: number;
  currency?: string;
  links?: {
    booking?: string;
    expedia?: string;
    hotels?: string;
    map?: string;
  };
  imageUrl?: string;
  address?: string;
};

type Pkg = {
  id?: string;
  title?: string;
  total?: number;
  currency?: string;
  pax?: number;
  flights?: Flight;
  hotels?: Hotel[];
  tags?: string[];
};

type Props = {
  pkg: Pkg;
  index: number;
  /** Optional flags from the page (kept loose so we don’t break your TS) */
  pax?: number;
  showHotel?: boolean;
  hotelNights?: number;
  showAllHotels?: boolean;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: () => void;
};

/** ====== Small UI atoms (inline styles keep it scoped) ====== **/
const cardShell: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  background: "#fff",
};

const flightBox: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fafafa",
  padding: 12,
};

const segmentRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 1fr auto",
  gap: 12,
  alignItems: "center",
  border: "1px solid #eef2f7",
  borderRadius: 10,
  background: "#fff",
  padding: "10px 12px",
};

const segmentAirline: React.CSSProperties = {
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const segmentMeta: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const timeBlock: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  fontVariantNumeric: "tabular-nums",
};

const layoverChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  background:
    "linear-gradient(90deg, rgba(59,130,246,.14) 0%, rgba(236,72,153,.14) 100%)",
  border: "1px dashed rgba(99,102,241,.4)",
  color: "#334155",
  margin: "8px 0",
  fontSize: 12,
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 8,
};

const boxTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: ".02em",
};

const priceBadge: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: "#0f172a",
};

/** Layover element shown between segments */
function Layover({ prev, next }: { prev?: Segment; next?: Segment }) {
  if (!prev || !next || !prev.arrTime || !next.depTime) return null;
  const prevArr = new Date(prev.arrTime);
  const nextDep = new Date(next.depTime);
  if (Number.isNaN(prevArr.getTime()) || Number.isNaN(nextDep.getTime()))
    return null;

  const mins = Math.max(
    0,
    Math.round((nextDep.getTime() - prevArr.getTime()) / 60000)
  );
  const airport = prev.arr || next.dep || "—";
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <span style={layoverChip}>
        <span>Layover</span>
        <strong>{fmtDur(mins)}</strong>
        <span style={{ opacity: 0.7 }}>@ {airport}</span>
      </span>
    </div>
  );
}

/** Render a single segment row */
function SegmentBox({ s }: { s: Segment }) {
  const code = s.carrier || "";
  const name = airlineName(code);
  return (
    <div style={segmentRow}>
      <div style={segmentAirline}>
        {name || code}
        {s.flightNo ? ` · ${code}${s.flightNo}` : ""}
      </div>
      <div style={timeBlock}>
        <div style={{ fontWeight: 600 }}>
          {fmtTime(s.depTime)} {s.dep} → {fmtTime(s.arrTime)} {s.arr}
        </div>
        <div style={segmentMeta}>
          Duration {fmtDur(s.durationMins)}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#475569", textAlign: "right" }}>
        {fmtDate(s.depTime)}
      </div>
    </div>
  );
}

/** Render a whole leg (Outbound or Return) with segments + layovers elegantly */
function LegBox({
  label,
  leg,
}: {
  label: "Outbound" | "Return";
  leg?: Leg;
}) {
  const segs = leg?.segments || [];
  return (
    <div style={flightBox}>
      <div style={headerRow}>
        <div style={boxTitle}>{label}</div>
        <div style={segmentMeta}>
          {segs.length ? `${segs.length - 1} stop${segs.length > 2 ? "s" : segs.length === 1 ? "" : ""}` : "—"}
          {leg?.durationMins ? ` · ${fmtDur(leg.durationMins)}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segs.map((s, i) => (
          <React.Fragment key={`${label}-seg-${i}`}>
            <SegmentBox s={s} />
            {i < segs.length - 1 && (
              <Layover prev={segs[i]} next={segs[i + 1]} />
            )}
          </React.Fragment>
        ))}
        {!segs.length && (
          <div style={{ ...segmentMeta, textAlign: "center", padding: 8 }}>
            No segments
          </div>
        )}
      </div>
    </div>
  );
}

/** Hotel line (kept simple; we don’t change your existing hotel logic) */
function HotelLine({ h }: { h: Hotel }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
        border: "1px solid #eef2f7",
        borderRadius: 10,
        background: "#fff",
        padding: "10px 12px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {h.name || "Hotel"}
          {h.stars ? ` · ${"★".repeat(Math.min(5, Math.max(1, h.stars)))}` : ""}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {h.address || ""}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        {typeof h.priceNight === "number" ? (
          <div style={{ fontWeight: 700 }}>
            {(h.currency || "$")}{h.priceNight.toFixed(0)} <span style={{ fontWeight: 400, color: "#64748b" }}>/night</span>
          </div>
        ) : null}
        {typeof h.priceTotal === "number" ? (
          <div style={{ fontSize: 12, color: "#475569" }}>
            Total {(h.currency || "$")}{h.priceTotal.toFixed(0)}
          </div>
        ) : null}
        {/* Booking links (kept as-is if present) */}
        <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {h.links?.booking && (
            <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">Booking.com</a>
          )}
          {h.links?.expedia && (
            <a className="btn" href={h.links.expedia} target="_blank" rel="noreferrer">Expedia</a>
          )}
          {h.links?.hotels && (
            <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">Hotels.com</a>
          )}
          {h.links?.map && (
            <a className="btn" href={h.links.map} target="_blank" rel="noreferrer">Map</a>
          )}
        </div>
      </div>
    </div>
  );
}

/** ====== Main Result Card ====== **/
export default function ResultCard(props: Props) {
  const { pkg, index } = props;

  const totalStr = useMemo(() => {
    if (!pkg?.total) return "";
    const cur = pkg.currency || "$";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(pkg.total);
    } catch {
      return `${cur}${pkg.total.toFixed?.(0) ?? pkg.total}`;
    }
  }, [pkg]);

  return (
    <section style={{ ...cardShell, marginBottom: 16 }}>
      {/* Header: title + total & action buttons */}
      <div style={{ ...headerRow, marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>
          {pkg.title || `Option ${index + 1}`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalStr && <span style={priceBadge}>{totalStr}</span>}
          {/* Save / Compare hooks kept intact if parent passes handlers */}
          {typeof props.onToggleCompare === "function" && (
            <button
              className="btn"
              onClick={() => props.onToggleCompare?.(pkg.id || `pkg-${index}`)}
              aria-label="Compare this result"
            >
              + Compare
            </button>
          )}
          <button
            className="btn"
            onClick={() => props.onSavedChangeGlobal?.()}
            aria-label="Save this result"
          >
            Save
          </button>
        </div>
      </div>

      {/* Flights block */}
      {pkg.flights && (
        <div style={{ display: "grid", gap: 12 }}>
          <LegBox label="Outbound" leg={pkg.flights.outbound} />

          {/* TrioTrip / provider deep link (kept) */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {pkg.flights.deeplink && (
              <a
                className="btn"
                href={pkg.flights.deeplink}
                target="_blank"
                rel="noreferrer"
                aria-label="Book flight on TrioTrip"
              >
                Book on TrioTrip ✈️
              </a>
            )}
          </div>

          <LegBox label="Return" leg={pkg.flights.return} />
        </div>
      )}

      {/* Hotels block (only if present/visible) */}
      {!!(props.showHotel ?? true) && Array.isArray(pkg.hotels) && pkg.hotels.length > 0 && (
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          <div style={boxTitle}>Hotels</div>
          {pkg.hotels.map((h, i) => (
            <HotelLine key={h.id || `h-${i}`} h={h} />
          ))}
        </div>
      )}
    </section>
  );
}
