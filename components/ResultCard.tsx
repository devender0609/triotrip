/* eslint-disable react/jsx-key */
import React from "react";

/**
 * Props expected by <ResultCard /> as used from app/page.tsx.
 * NOTE: Only the "currency" key is new (optional) to fix page.tsx compile error.
 */
type Props = {
  pkg: any;
  index: number;
  currency?: string;
  pax?: number;

  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean;

  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
};

/* ------------------------------------------------------------
   Small helpers – keep everything internal so we don’t depend
   on other files. These are defensive against partial data.
-------------------------------------------------------------*/

function fmtTime(s?: string | number | Date) {
  if (!s) return "";
  const d = new Date(s);
  // If it isn’t a valid date, just echo
  if (isNaN(+d)) return String(s);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDur(min?: number | string) {
  if (min == null || min === "") return "";
  const m = typeof min === "string" ? parseInt(min, 10) : min;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function Airline({ name }: { name?: string }) {
  return <div style={{ fontWeight: 600 }}>{name || "—"}</div>;
}

type Leg = {
  from?: string;
  to?: string;
  depart?: string;
  arrive?: string;
  durationMin?: number;
  airline?: string;
  flightNo?: string;
};

type Layover = {
  at?: string; // airport code
  minutes?: number;
  nextDeparts?: string;
};

function FlightLegRow({ leg }: { leg: Leg }) {
  return (
    <div className="tt-leg-row">
      <div className="tt-leg-route">
        <div>{(leg.from || "").toUpperCase()} → {(leg.to || "").toUpperCase()}</div>
        <div className="tt-leg-time">
          {fmtTime(leg.depart)} — {fmtTime(leg.arrive)}
        </div>
      </div>
      <div className="tt-leg-meta">
        <Airline name={leg.airline} />
        <div className="tt-leg-duration">{fmtDur(leg.durationMin)}</div>
      </div>
    </div>
  );
}

function LayoverChip({ lay }: { lay?: Layover }) {
  if (!lay || (!lay.at && !lay.minutes && !lay.nextDeparts)) return null;
  const mins = lay.minutes ?? 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const pretty = mins ? ` (${h}h ${m}m)` : "";
  return (
    <div className="tt-layover-chip" role="note" aria-label="Layover">
      <span style={{ marginRight: 8 }}>⏱️ Layover in</span>
      <strong style={{ marginRight: 8 }}>{(lay.at || "").toUpperCase()}</strong>
      {lay.nextDeparts && (
        <>
          <span style={{ opacity: 0.8, marginRight: 6 }}>Next departs at</span>
          <strong>{fmtTime(lay.nextDeparts)}</strong>
        </>
      )}
      {pretty && <span style={{ marginLeft: 6, opacity: 0.75 }}>{pretty}</span>}
    </div>
  );
}

/* ------------------------------------------------------------
   Main card
-------------------------------------------------------------*/

export default function ResultCard({
  pkg,
  index,
  currency, // optional – used if present
  pax,
  showHotel,
  hotelNights,
  showAllHotels,
  comparedIds,
  onToggleCompare,
  onSavedChangeGlobal,
}: Props) {
  // Defensive extraction with sensible fallbacks so we don’t crash if shape differs
  const price = pkg?.price ?? pkg?.totalPrice ?? "";
  const priceLabel =
    price && currency ? `${new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(price))}` : (price || "");

  const carrier = pkg?.carrier || pkg?.airline || "";
  const origin = (pkg?.origin || pkg?.from || "").toUpperCase?.() || "";
  const dest = (pkg?.destination || pkg?.to || "").toUpperCase?.() || "";

  const outbound: Leg[] = pkg?.outbound?.legs || pkg?.outbound || pkg?.outboundSegments || [];
  const outLay: Layover | undefined = pkg?.outbound?.layover || pkg?.outLayover;

  const inbound: Leg[] = pkg?.return?.legs || pkg?.return || pkg?.returnSegments || [];
  const inLay: Layover | undefined = pkg?.return?.layover || pkg?.inLayover;

  const hotels: any[] = Array.isArray(pkg?.hotels) ? pkg.hotels : [];

  const id = pkg?.id || `${origin}-${dest}-${index}`;

  const inCompare = comparedIds?.includes(id);

  return (
    <section className="result-card fancy-card" aria-label={`Result ${index + 1}`}>
      {/* Header line */}
      <div className="tt-result-head">
        <div className="tt-route-title">
          <strong>Option {index + 1}</strong> • {origin} — {dest}
        </div>

        <div className="tt-head-actions">
          {priceLabel && (
            <span className="tt-price-pill" title={`${pax ? `${pax} pax • ` : ""}${currency || ""}`}>
              💵 {priceLabel}
            </span>
          )}

          {/* Example provider buttons – keep generic to avoid external deps */}
          {pkg?.links?.google && (
            <a className="tt-link-pill" href={pkg.links.google} target="_blank" rel="noreferrer">
              Google Flights
            </a>
          )}
          {pkg?.links?.skyscanner && (
            <a className="tt-link-pill" href={pkg.links.skyscanner} target="_blank" rel="noreferrer">
              Skyscanner
            </a>
          )}
          {pkg?.links?.airline && (
            <a className="tt-link-pill" href={pkg.links.airline} target="_blank" rel="noreferrer">
              Airline
            </a>
          )}

          <button
            type="button"
            className={`tt-compare-pill ${inCompare ? "is-in" : ""}`}
            onClick={() => onToggleCompare?.(id)}
          >
            {inCompare ? "🆚 In Compare" : "＋ Compare"}
          </button>
        </div>
      </div>

      {/* Flights */}
      <div className="tt-flight-section">
        {/* OUTBOUND BOX */}
        <div className="tt-flight-box" aria-label="Outbound flights">
          <div className="tt-flight-box-title">Outbound</div>
          {outbound?.length ? (
            outbound.map((leg, i) => (
              <React.Fragment key={`out-${i}-${leg.from}-${leg.to}-${leg.depart}`}>
                {i === 0 && <Airline name={carrier || leg.airline} />}
                <FlightLegRow leg={leg} />
              </React.Fragment>
            ))
          ) : (
            <div className="tt-empty">No outbound details</div>
          )}
        </div>

        {/* LAYOVER CHIP BETWEEN OUTBOUND AND RETURN */}
        <div className="tt-layover-center">
          <LayoverChip lay={outLay} />
        </div>

        {/* RETURN BOX */}
        <div className="tt-flight-box" aria-label="Return flights">
          <div className="tt-flight-box-title">Return</div>
          {inbound?.length ? (
            inbound.map((leg, i) => (
              <React.Fragment key={`in-${i}-${leg.from}-${leg.to}-${leg.depart}`}>
                {i === 0 && <Airline name={carrier || leg.airline} />}
                <FlightLegRow leg={leg} />
              </React.Fragment>
            ))
          ) : (
            <div className="tt-empty">No return details</div>
          )}
        </div>

        {/* Bottom layover (if present for the return side) */}
        <div className="tt-layover-center">
          <LayoverChip lay={inLay} />
        </div>
      </div>

      {/* Hotels */}
      {showHotel && (
        <div className="tt-hotels">
          <div className="tt-hotels-title">
            Hotels {showAllHotels ? "(all)" : "(top options)"} {hotelNights ? `• ${hotelNights} night${hotelNights > 1 ? "s" : ""}` : ""}
          </div>

          {hotels?.length ? (
            <div className="tt-hotels-list">
              {hotels.map((h, i) => (
                <article className="tt-hotel-item" key={`h-${i}-${h?.name || i}`}>
                  <div className="tt-hotel-thumb">
                    {/* simple defensive thumb */}
                    <img
                      src={h?.image || "/logo.png"}
                      alt={h?.name || "Hotel"}
                      onError={(e: any) => (e.currentTarget.src = "/logo.png")}
                    />
                  </div>

                  <div className="tt-hotel-body">
                    <div className="tt-hotel-name">{h?.name || "Hotel"}</div>
                    <div className="tt-hotel-city">{(h?.city || dest || "").toUpperCase()}</div>
                  </div>

                  <div className="tt-hotel-links">
                    {h?.links?.booking && (
                      <a className="tt-link-pill" href={h.links.booking} target="_blank" rel="noreferrer">
                        Booking.com
                      </a>
                    )}
                    {h?.links?.expedia && (
                      <a className="tt-link-pill" href={h.links.expedia} target="_blank" rel="noreferrer">
                        Expedia
                      </a>
                    )}
                    {h?.links?.hotels && (
                      <a className="tt-link-pill" href={h.links.hotels} target="_blank" rel="noreferrer">
                        Hotels
                      </a>
                    )}
                    {h?.links?.map && (
                      <a className="tt-link-pill" href={h.links.map} target="_blank" rel="noreferrer">
                        Map
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="tt-empty">No hotels for this option.</div>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------
   Light, component-scoped styles (classNames also referenced
   in your globals can continue to style as before).
   These are minimal to create the “two boxes + center chip”
   layout without changing your global scale/typography.
-------------------------------------------------------------*/

const css = `
.result-card.fancy-card {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(250,252,255,0.9), rgba(245,247,250,0.9));
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  margin-bottom: 16px;
}

.tt-result-head{
  display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;
  margin-bottom: 10px;
}
.tt-route-title{ font-weight:700; }
.tt-head-actions{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.tt-price-pill, .tt-link-pill, .tt-compare-pill{
  display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:10px;
  border:1px solid rgba(0,0,0,0.08); background:#fff; font-weight:600;
}
.tt-compare-pill.is-in{ background:#fff7e6; border-color:#ffd591; }

.tt-flight-section{
  display:grid; grid-template-columns: 1fr auto 1fr; gap:12px; align-items:start;
  padding:10px; border-radius:12px; background:linear-gradient(180deg,#f7fbff 0%, #f6f8fb 100%);
  border: 1px solid rgba(0,0,0,0.06);
}
.tt-flight-box{
  border:1px solid rgba(0,0,0,0.06); background:#fff; border-radius:12px; padding:12px;
  min-height: 120px;
}
.tt-flight-box-title{ font-weight:700; margin-bottom:8px; }

.tt-layover-center{ display:flex; align-items:center; justify-content:center; }
.tt-layover-chip{
  border:1px dashed rgba(0,0,0,0.2); background:#fff; border-radius:999px; padding:6px 12px;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.02);
  white-space:nowrap;
}

.tt-leg-row{
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 0; border-bottom:1px dashed rgba(0,0,0,0.06);
}
.tt-leg-row:last-child{ border-bottom:none; }
.tt-leg-route{ display:flex; flex-direction:column; gap:2px; }
.tt-leg-time{ opacity:0.8; }
.tt-leg-meta{ display:flex; align-items:center; gap:12px; }

.tt-empty{ opacity:0.6; padding:6px 0; }

.tt-hotels{ margin-top:12px; }
.tt-hotels-title{ font-weight:700; margin: 8px 4px 10px; }
.tt-hotels-list{ display:flex; flex-direction:column; gap:10px; }
.tt-hotel-item{
  display:grid; grid-template-columns: 128px 1fr auto; gap:12px;
  border:1px solid rgba(0,0,0,0.06); background:#fff; border-radius:12px; padding:10px;
}
.tt-hotel-thumb img{ width:128px; height:88px; object-fit:cover; border-radius:10px; }
.tt-hotel-name{ font-weight:700; }
.tt-hotel-city{ opacity:0.75; margin-top:4px; }
.tt-hotel-links{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
`;

// inject once
if (typeof document !== "undefined" && !document.getElementById("resultcard-inline-css")) {
  const style = document.createElement("style");
  style.id = "resultcard-inline-css";
  style.textContent = css;
  document.head.appendChild(style);
}
