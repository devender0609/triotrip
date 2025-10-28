"use client";

import React, { useMemo } from "react";

/* ---------- tiny utils ---------- */
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const fmtTime = (d?: string | Date) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};
const fmtDate = (d?: string | Date) => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const fmtDur = (mins?: number) => {
  if (mins === undefined || mins === null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
};
const airlineName = (code?: string) => {
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
};

/* ---------- data types ---------- */
type Segment = {
  dep?: string; // IATA
  arr?: string; // IATA
  depTime?: string; // ISO
  arrTime?: string; // ISO
  carrier?: string; // code
  flightNo?: string;
  durationMins?: number;
};

type Leg = {
  segments?: Segment[];
  durationMins?: number;
};

type Flight = {
  outbound?: Leg;
  return?: Leg;
  price?: number;
  currency?: string;
  deeplink?: string; // TrioTrip link
};

type Hotel = {
  id?: string;
  name?: string;
  stars?: number;
  priceNight?: number;
  priceTotal?: number;
  currency?: string;
  links?: { booking?: string; expedia?: string; hotels?: string; map?: string };
  address?: string;
};

type Pkg = {
  id?: string;
  title?: string;
  total?: number;
  currency?: string;
  pax?: number;
  flights?: Flight;
  // fallbacks we’ll normalize from:
  outbound?: Leg;
  return?: Leg;
  flight?: { legs?: Leg[] };
  segmentsOutbound?: Segment[];
  segmentsReturn?: Segment[];
  deeplink?: string;

  hotels?: Hotel[];
};

type Props = {
  pkg: Pkg;
  index: number;

  // matches page.tsx usage — fixes the build error you saw
  currency?: string;

  pax?: number;
  showHotel?: boolean;
  hotelNights?: number;
  showAllHotels?: boolean;
  comparedIds?: string[];
  onToggleCompare?: (id: string) => void;
  onSavedChangeGlobal?: () => void;
};

/* ---------- styles ---------- */
const shell: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  background: "#fff",
};
const rowHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 10,
};
const priceBadge: React.CSSProperties = { fontWeight: 700, color: "#0f172a" };
const boxTitle: React.CSSProperties = { fontWeight: 700, fontSize: 14 };
const legBox: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fafafa",
  padding: 12,
};
const segRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 1fr auto",
  gap: 12,
  alignItems: "center",
  border: "1px solid #eef2f7",
  borderRadius: 10,
  background: "#fff",
  padding: "10px 12px",
};
const segName: React.CSSProperties = {
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const segMeta: React.CSSProperties = { fontSize: 12, color: "#6b7280" };
const timeCol: React.CSSProperties = {
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

/* ---------- normalizer ---------- */
function normalizeFlights(pkg: Pkg): Flight | undefined {
  // preferred
  if (pkg.flights?.outbound || pkg.flights?.return) return pkg.flights;

  // direct fields
  if (pkg.outbound || pkg.return) {
    return { outbound: pkg.outbound, return: pkg.return, deeplink: pkg.deeplink };
  }

  // flight.legs[0], flight.legs[1]
  if (pkg.flight?.legs && pkg.flight.legs.length) {
    const [outbound, ret] = pkg.flight.legs;
    return {
      outbound,
      return: ret,
      deeplink: pkg.deeplink,
    };
  }

  // segmentsOutbound / segmentsReturn arrays
  if (pkg.segmentsOutbound || pkg.segmentsReturn) {
    return {
      outbound: pkg.segmentsOutbound
        ? { segments: pkg.segmentsOutbound }
        : undefined,
      return: pkg.segmentsReturn ? { segments: pkg.segmentsReturn } : undefined,
      deeplink: pkg.deeplink,
    };
  }

  return undefined;
}

/* ---------- small parts ---------- */
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
        <span>Layover</span> <strong>{fmtDur(mins)}</strong>
        <span style={{ opacity: 0.7 }}>@ {airport}</span>
      </span>
    </div>
  );
}

function SegmentLine({ s }: { s: Segment }) {
  const code = s.carrier || "";
  const name = airlineName(code);
  return (
    <div style={segRow}>
      <div style={segName}>
        {name || code}
        {s.flightNo ? ` · ${code}${s.flightNo}` : ""}
      </div>
      <div style={timeCol}>
        <div style={{ fontWeight: 600 }}>
          {fmtTime(s.depTime)} {s.dep} → {fmtTime(s.arrTime)} {s.arr}
        </div>
        {s.durationMins ? (
          <div style={segMeta}>Duration {fmtDur(s.durationMins)}</div>
        ) : null}
      </div>
      <div style={{ fontSize: 12, color: "#475569", textAlign: "right" }}>
        {fmtDate(s.depTime)}
      </div>
    </div>
  );
}

function LegBox({ label, leg }: { label: "Outbound" | "Return"; leg?: Leg }) {
  const segs = leg?.segments || [];
  const totalDur =
    leg?.durationMins ??
    (segs.length
      ? segs.reduce((m, s) => m + (s.durationMins || 0), 0)
      : undefined);
  const stops =
    segs.length > 1 ? `${segs.length - 1} stop${segs.length - 1 > 1 ? "s" : ""}` : "nonstop";

  return (
    <div style={legBox}>
      <div style={rowHeader}>
        <div style={boxTitle}>{label}</div>
        <div style={segMeta}>
          {stops}
          {totalDur ? ` · ${fmtDur(totalDur)}` : ""}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segs.map((s, i) => (
          <React.Fragment key={`${label}-${i}`}>
            <SegmentLine s={s} />
            {i < segs.length - 1 && <Layover prev={segs[i]} next={segs[i + 1]} />}
          </React.Fragment>
        ))}

        {!segs.length && (
          <div style={{ ...segMeta, textAlign: "center", padding: 8 }}>
            No segments found
          </div>
        )}
      </div>
    </div>
  );
}

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
        <div
          style={{
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {h.name || "Hotel"}
          {h.stars ? ` · ${"★".repeat(Math.min(5, Math.max(1, h.stars)))}` : ""}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{h.address || ""}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        {typeof h.priceNight === "number" ? (
          <div style={{ fontWeight: 700 }}>
            {(h.currency || "$")}
            {h.priceNight.toFixed(0)}{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>/night</span>
          </div>
        ) : null}
        {typeof h.priceTotal === "number" ? (
          <div style={{ fontSize: 12, color: "#475569" }}>
            Total {(h.currency || "$")}
            {h.priceTotal.toFixed(0)}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 6,
            display: "flex",
            gap: 6,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {h.links?.booking && (
            <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">
              Booking.com
            </a>
          )}
          {h.links?.expedia && (
            <a className="btn" href={h.links.expedia} target="_blank" rel="noreferrer">
              Expedia
            </a>
          )}
          {h.links?.hotels && (
            <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">
              Hotels.com
            </a>
          )}
          {h.links?.map && (
            <a className="btn" href={h.links.map} target="_blank" rel="noreferrer">
              Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- component ---------- */
export default function ResultCard(props: Props) {
  const { pkg, index } = props;

  // currency safe-format for total
  const currencyCode = pkg?.currency || props.currency || "USD";
  const totalStr = useMemo(() => {
    if (!pkg?.total && pkg?.total !== 0) return "";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
      }).format(pkg.total as number);
    } catch {
      return `$${pkg.total}`;
    }
  }, [pkg, currencyCode]);

  const flights = normalizeFlights(pkg);

  return (
    <section style={{ ...shell, marginBottom: 16 }}>
      {/* header */}
      <div style={{ ...rowHeader, marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{pkg.title || `Option ${index + 1}`}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalStr && <span style={priceBadge}>{totalStr}</span>}
          {typeof props.onToggleCompare === "function" && (
            <button
              className="btn"
              onClick={() => props.onToggleCompare?.(pkg.id || `pkg-${index}`)}
            >
              + Compare
            </button>
          )}
          <button className="btn" onClick={() => props.onSavedChangeGlobal?.()}>
            Save
          </button>
        </div>
      </div>

      {/* flights */}
      <div style={{ display: "grid", gap: 12 }}>
        <LegBox label="Outbound" leg={flights?.outbound} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {(flights?.deeplink || pkg.deeplink) && (
            <a
              className="btn"
              href={(flights?.deeplink || pkg.deeplink)!}
              target="_blank"
              rel="noreferrer"
            >
              TrioTrip
            </a>
          )}
        </div>

        <LegBox label="Return" leg={flights?.return} />
      </div>

      {/* hotels */}
      {!!(props.showHotel ?? true) &&
        Array.isArray(pkg.hotels) &&
        pkg.hotels.length > 0 && (
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
