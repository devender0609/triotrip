"use client";

import React from "react";

/**
 * Very tolerant types so we can read whatever the search API gives us.
 * We normalize into a simple Segment[] for outbound/return rendering.
 */
type RawSegment = {
  from?: string;            // IATA (e.g., AUS)
  to?: string;              // IATA (e.g., CLT)
  depart?: string;          // ISO or display (we'll format defensively)
  arrive?: string;          // ISO or display
  depTime?: string;         // alt names
  arrTime?: string;
  departTime?: string;
  arrivalTime?: string;
  airline?: string;         // "AA"
  airlineCode?: string;     // "AA"
  airlineName?: string;     // "American Airlines"
  durationMinutes?: number;
};

type PkgLike = {
  id?: string;
  price?: number | string;
  currency?: string;
  /**
   * Different shapes we’ve seen—pick the first that exists.
   * Each should be an array of segments in flight order.
   */
  outbound?: RawSegment[];
  inbound?: RawSegment[];
  return?: RawSegment[];
  outboundSegments?: RawSegment[];
  returnSegments?: RawSegment[];
  legs?: { type?: "outbound" | "return"; segments?: RawSegment[] }[];
  /**
   * Optional hotel chunk – left untouched; this component focuses on flights.
   */
  hotels?: any[];
  /**
   * Prebuilt booking links (if present). We keep them exactly as you have.
   */
  links?: {
    googleFlights?: string;
    skyscanner?: string;
    airline?: string;
    meta?: Record<string, string>;
  };
  // Route/date chips for header (if present)
  from?: string;
  to?: string;
  departDate?: string;
  returnDate?: string;
};

type Props = {
  pkg: PkgLike;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
};

function fmtTime(t?: string) {
  if (!t) return "";
  // If already pretty (contains AM/PM or colon with spaces), return as-is
  if (/[AP]M\b/.test(t) || /\d{1,2}:\d{2}/.test(t)) return t;
  // Try to parse ISO
  try {
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch {}
  return t;
}

function airlineLabel(seg: RawSegment) {
  const code = seg.airline || seg.airlineCode || "";
  const name = seg.airlineName || "";
  if (name && code) return `${name} (${code})`;
  if (name) return name;
  if (code) return code;
  return ""; // unknown
}

function normalizeSegments(pkg: PkgLike, which: "outbound" | "return"): RawSegment[] {
  // 1) direct properties
  if (which === "outbound") {
    if (Array.isArray(pkg.outbound)) return pkg.outbound;
    if (Array.isArray(pkg.outboundSegments)) return pkg.outboundSegments;
    if (Array.isArray(pkg.legs)) {
      const leg = pkg.legs.find(l => (l.type || "").toLowerCase() === "outbound");
      if (leg?.segments) return leg.segments;
    }
  } else {
    if (Array.isArray(pkg.inbound)) return pkg.inbound;
    if (Array.isArray(pkg.return)) return pkg.return;
    if (Array.isArray(pkg.returnSegments)) return pkg.returnSegments;
    if (Array.isArray(pkg.legs)) {
      const leg = pkg.legs.find(l => (l.type || "").toLowerCase() === "return");
      if (leg?.segments) return leg.segments;
    }
  }
  // Fallback: nothing
  return [];
}

function SegmentRow({ seg }: { seg: RawSegment }) {
  const from = seg.from || "";
  const to = seg.to || "";
  const dep = fmtTime(seg.depart || seg.depTime || seg.departTime);
  const arr = fmtTime(seg.arrive || seg.arrTime || seg.arrivalTime);
  const airline = airlineLabel(seg);

  return (
    <div className="tt-seg">
      <div className="tt-seg-route">
        <span className="tt-iata">{from}</span>
        <span className="tt-arrow">→</span>
        <span className="tt-iata">{to}</span>
        {airline && <span className="tt-airline"> • {airline}</span>}
      </div>
      <div className="tt-seg-time">
        {dep && arr ? (
          <span>{dep} — {arr}</span>
        ) : (
          <span>{dep || arr}</span>
        )}
      </div>
    </div>
  );
}

function LayoverPill({ nextDepart, cityCode }: { nextDepart?: string; cityCode?: string }) {
  const nd = fmtTime(nextDepart);
  return (
    <div className="tt-layover">
      <span className="tt-dot" />
      <span>Layover in</span>
      <strong>{cityCode || "—"}</strong>
      <span>• Next departs at</span>
      <strong>{nd || "—"}</strong>
    </div>
  );
}

export default function ResultCard(props: Props) {
  const { pkg, index } = props;

  const outSegs = normalizeSegments(pkg, "outbound");
  const retSegs = normalizeSegments(pkg, "return");

  // header helpers
  const route = `${pkg.from || outSegs[0]?.from || "—"}–${pkg.to || outSegs[outSegs.length - 1]?.to || "—"}`;
  const depDate = pkg.departDate || "";
  const retDate = pkg.returnDate || "";
  const price =
    typeof pkg.price === "number"
      ? pkg.price.toLocaleString(undefined, { style: "currency", currency: (pkg.currency || "USD") as any })
      : pkg.price || "";

  // Build pills row (keep your existing links if present)
  const gf = pkg.links?.googleFlights;
  const sky = pkg.links?.skyscanner;
  const airline = pkg.links?.airline;

  return (
    <div className="tt-card">
      <div className="tt-card-head">
        <div className="tt-title">
          <span className="tt-option">Option {index + 1}</span>
          <span className="tt-dot">•</span>
          <span className="tt-route">{route}</span>
          {depDate && retDate && (
            <>
              <span className="tt-dot">•</span>
              <span className="tt-dates">{depDate}</span>
              <span className="tt-arrow-small">➜</span>
              <span className="tt-dates">{retDate}</span>
            </>
          )}
        </div>

        <div className="tt-pills">
          {price && <span className="tt-price-pill">💵 {price}</span>}
          <a className="tt-pill" href="#" onClick={(e) => e.preventDefault()}>TrioTrip</a>
          {gf && <a className="tt-pill" href={gf} target="_blank" rel="noreferrer">Google Flights</a>}
          {sky && <a className="tt-pill" href={sky} target="_blank" rel="noreferrer">Skyscanner</a>}
          {airline && <a className="tt-pill" href={airline} target="_blank" rel="noreferrer">Airline</a>}
        </div>
      </div>

      {/* Outbound */}
      {outSegs.length > 0 && (
        <div className="tt-leg">
          <div className="tt-leg-title">Outbound</div>
          <div className="tt-leg-body">
            {outSegs.map((seg, i) => (
              <React.Fragment key={`ob-${i}`}>
                <SegmentRow seg={seg} />
                {i < outSegs.length - 1 && (
                  <LayoverPill
                    cityCode={seg.to}
                    nextDepart={outSegs[i + 1]?.depart || outSegs[i + 1]?.depTime || outSegs[i + 1]?.departTime}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Return */}
      {retSegs.length > 0 && (
        <div className="tt-leg">
          <div className="tt-leg-title">Return</div>
          <div className="tt-leg-body">
            {retSegs.map((seg, i) => (
              <React.Fragment key={`rt-${i}`}>
                <SegmentRow seg={seg} />
                {i < retSegs.length - 1 && (
                  <LayoverPill
                    cityCode={seg.to}
                    nextDepart={retSegs[i + 1]?.depart || retSegs[i + 1]?.depTime || retSegs[i + 1]?.departTime}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- lightweight styles to match your screenshot ---------- */
declare global {
  interface Document {}
}
