"use client";
import React from "react";

type Props = {
  pkg: any;
  index: number;
  // props page.tsx passes — keep for compatibility
  currency?: string;
  pax?: number;

  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
};

const fmtTime = (v?: string | number | Date) => {
  if (!v) return "";
  const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
  if (isNaN(d.getTime())) return String(v);
  const hh = d.getHours() % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, "0");
  const am = d.getHours() < 12 ? "AM" : "PM";
  return `${hh}:${mm} ${am}`;
};

const fmtDur = (mins?: number) => {
  if (!mins && mins !== 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

function getSegments(pkg: any, which: "outbound" | "return" | "inbound"): any[] {
  const paths: (string | string[])[] = [
    `${which}Segments`,
    which === "return" ? "returnSegments" : "",
    [which, "segments"],
    [which === "return" ? "inbound" : which, "segments"],
    ["segments", which],
    ["itinerary", which, "segments"],
    ["trip", which, "segments"],
    ["legs", which],
  ].filter(Boolean) as (string | string[])[];

  for (const p of paths) {
    const val = Array.isArray(p) ? p.reduce((a: any, k) => (a ? a[k] : undefined), pkg) : pkg?.[p];
    if (Array.isArray(val) && val.length) return val;
  }
  if (pkg?.origin && pkg?.dest && (pkg?.depart || pkg?.departure)) {
    return [
      {
        origin: pkg.origin,
        dest: pkg.dest,
        depart: pkg.depart ?? pkg.departure,
        arrive: pkg.arrive ?? pkg.arrival,
        durationMin: pkg.durationMin ?? pkg.durationMinutes,
      },
    ];
  }
  return [];
}

type Seg = {
  origin?: string;
  dest?: string;
  depart?: string | number | Date;
  arrival?: string | number | Date;
  arrive?: string | number | Date;
  durationMin?: number;
  durationMinutes?: number;
  carrier?: string;
};

const LayoverPill: React.FC<{ at?: string; nextDepart?: string | number | Date }> = ({
  at,
  nextDepart,
}) => {
  if (!at && !nextDepart) return null;
  return (
    <div
      className="layover-pill"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px dashed #cbd5e1",
        borderRadius: 12,
        padding: "6px 10px",
        background: "rgba(0,0,0,0.02)",
      }}
    >
      <span style={{ fontSize: 14 }}>🕑</span>
      <span style={{ fontSize: 14 }}>
        Layover {at ? (<><span>in</span> <b>{at}</b></>) : null}
        {nextDepart ? (<> • <span>Next departs at</span> <b>{fmtTime(nextDepart)}</b></>) : null}
      </span>
    </div>
  );
};

const LegRow: React.FC<{ seg: Seg }> = ({ seg }) => {
  const depart = seg.depart ?? (seg as any).departure;
  const arrive = seg.arrive ?? seg.arrival;
  const dur = seg.durationMin ?? (seg as any).durationMinutes;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 600 }}>
        {seg.origin} → {seg.dest}
      </div>
      <div style={{ color: "#334155" }}>
        {fmtTime(depart)} — {fmtTime(arrive)}
      </div>
      {dur != null && (
        <div style={{ color: "#64748b", fontSize: 13 }}>{fmtDur(dur)}</div>
      )}
    </div>
  );
};

const Box: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
};

const HotelsBlock: React.FC<{ pkg: any; nights: number; showAll: boolean }> = ({
  pkg,
  nights,
  showAll,
}) => {
  const hotels: any[] =
    pkg?.hotels || pkg?.hotelOptions || pkg?.hotel_candidates || pkg?.topHotels || [];
  if (!hotels?.length) return null;

  const list = showAll ? hotels : hotels.slice(0, 3);

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        Hotels ({showAll ? "all" : "top options"})
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {list.map((h, i) => (
          <div
            key={h.id || h.name || i}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr auto",
              alignItems: "center",
              gap: 12,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                width: 120,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                background: "#f1f5f9",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {h.city || h.iata || "IMG"}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{h.name || "Hotel"}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                {h.city || h.iata}
                {nights ? ` • ${nights} night${nights > 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
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
                  Hotels
                </a>
              )}
              {(h.map || h.links?.map) && (
                <a className="btn" href={h.map || h.links?.map} target="_blank" rel="noreferrer">
                  Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ResultCard: React.FC<Props> = ({
  pkg,
  index,
  currency, // kept for compatibility with page.tsx
  pax,       // kept for compatibility with page.tsx
  showHotel,
  hotelNights,
  showAllHotels,
  comparedIds,
  onToggleCompare,
}) => {
  const outbound = getSegments(pkg, "outbound");
  const inbound = getSegments(pkg, "return");

  const id = pkg?.id || `opt-${index + 1}`;
  const isCompared = comparedIds?.includes(id);

  const outboundLayover =
    outbound.length > 1
      ? { at: outbound[0]?.dest, next: outbound[1]?.depart ?? (outbound[1] as any)?.departure }
      : null;

  const inboundLayover =
    inbound.length > 1
      ? { at: inbound[0]?.dest, next: inbound[1]?.depart ?? (inbound[1] as any)?.departure }
      : null;

  return (
    <section
      className="result-card"
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
        boxShadow: "0 1px 0 rgba(15,23,42,0.02)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {`Option ${index + 1} • ${pkg?.routeLabel || `${pkg?.origin || ""} — ${pkg?.dest || ""}`}`}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {pkg?.deeplinks?.gflights && (
            <a className="btn" href={pkg.deeplinks.gflights} target="_blank" rel="noreferrer">
              Google Flights
            </a>
          )}
          {pkg?.deeplinks?.skyscanner && (
            <a className="btn" href={pkg.deeplinks.skyscanner} target="_blank" rel="noreferrer">
              Skyscanner
            </a>
          )}
          {pkg?.deeplinks?.airline && (
            <a className="btn" href={pkg.deeplinks.airline} target="_blank" rel="noreferrer">
              Airline
            </a>
          )}
          <button
            className={`btn ${isCompared ? "btn-contrast" : ""}`}
            onClick={() => onToggleCompare(id)}
            aria-pressed={isCompared}
            aria-label="Compare this option"
          >
            {isCompared ? "✓ In Compare" : "+ Compare"}
          </button>
        </div>
      </div>

      {/* Outbound / Return boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Box title="Outbound">
          {outbound.length ? (
            <>
              <LegRow seg={outbound[0]} />
              {outboundLayover && (
                <div style={{ marginBottom: 12 }}>
                  <LayoverPill at={outboundLayover.at} nextDepart={outboundLayover.next} />
                </div>
              )}
              {outbound.slice(1).map((s, i) => (
                <LegRow key={i} seg={s} />
              ))}
            </>
          ) : (
            <div style={{ color: "#64748b" }}>No outbound details</div>
          )}
        </Box>

        <Box title="Return">
          {inbound.length ? (
            <>
              <LegRow seg={inbound[0]} />
              {inboundLayover && (
                <div style={{ marginBottom: 12 }}>
                  <LayoverPill at={inboundLayover.at} nextDepart={inboundLayover.next} />
                </div>
              )}
              {inbound.slice(1).map((s, i) => (
                <LegRow key={i} seg={s} />
              ))}
            </>
          ) : (
            <div style={{ color: "#64748b" }}>No return details</div>
          )}
        </Box>
      </div>

      {showHotel ? (
        <HotelsBlock pkg={pkg} nights={hotelNights} showAll={showAllHotels} />
      ) : null}
    </section>
  );
};

export default ResultCard;
