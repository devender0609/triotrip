/* eslint-disable @next/next/no-img-element */
import React from "react";

type AnyRecord = Record<string, any>;

type Props = {
  pkg: AnyRecord;
  index: number;
  currency: string;
  pax: number;
  showHotel: boolean;
  hotelNights: number;
  showAllHotels: boolean; // parent decides "All" (no limit) vs Top-3 capping
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onSavedChangeGlobal: () => void;
};

function fmtTime(t?: string) {
  if (!t) return "";
  // pass-through already formatted times like "08:50 AM"
  if (/\d/.test(t) && (t.includes(":") || /am|pm/i.test(t))) return t;
  try {
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return t;
  }
}
function fmtMoney(x?: number | string, currency = "USD") {
  if (x == null || x === "") return "";
  const n = typeof x === "string" ? Number(x) : x;
  if (!isFinite(n)) return String(x);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(0)}`;
  }
}
function fmtDuration(min?: number) {
  if (min == null) return "";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return (h ? `${h}h ` : "") + (m ? `${m}m` : h ? "" : "0m");
}
function airlineNameFromLeg(leg: AnyRecord) {
  return leg?.airlineName || leg?.marketingAirlineName || leg?.carrierName || leg?.airline || leg?.carrier || "";
}

function LayoverChip({
  airport,
  nextDepart,
  durationMins,
}: {
  airport?: string;
  nextDepart?: string;
  durationMins?: number;
}) {
  const dur = fmtDuration(durationMins);
  return (
    <div className="layover-chip">
      <span className="dot" />
      <span className="label">
        Layover in <b>{airport || "—"}</b>
        {nextDepart ? (
          <>
            {" "}
            · Next departs at <b>{fmtTime(nextDepart)}</b>
          </>
        ) : null}
        {dur ? <> · {dur}</> : null}
      </span>
    </div>
  );
}

export default function ResultCard({
  pkg,
  index,
  currency,
  pax,
  showHotel,
  hotelNights,
  showAllHotels,
  comparedIds,
  onToggleCompare,
  onSavedChangeGlobal,
}: Props) {
  const id: string = pkg?.id || `pkg-${index + 1}`;
  const inCompare = comparedIds?.includes(id);

  const price = pkg?.priceTotal ?? pkg?.price ?? pkg?.totalPrice;

  const originCode =
    pkg?.origin?.code ||
    pkg?.from ||
    (Array.isArray(pkg?.outbound) && pkg.outbound[0]?.from) ||
    pkg?.outbound?.from ||
    pkg?.flights?.outbound?.[0]?.from;

  const destCode =
    pkg?.destination?.code ||
    pkg?.to ||
    (Array.isArray(pkg?.outbound) && pkg.outbound[pkg.outbound.length - 1]?.to) ||
    pkg?.outbound?.to ||
    pkg?.flights?.outbound?.slice?.(-1)?.[0]?.to;

  // Normalize outbound/inbound legs to arrays
  const outbound: AnyRecord[] = Array.isArray(pkg?.outbound)
    ? pkg.outbound
    : pkg?.outbound?.legs || (pkg?.outbound ? [pkg.outbound] : pkg?.flights?.outbound || []);

  const inbound: AnyRecord[] = Array.isArray(pkg?.inbound)
    ? pkg.inbound
    : pkg?.inbound?.legs || (pkg?.inbound ? [pkg.inbound] : pkg?.flights?.inbound || []);

  const legTitle = (leg: AnyRecord) => {
    const name = airlineNameFromLeg(leg);
    const code = leg?.airlineCode || leg?.marketingAirline || leg?.carrierCode;
    return [name, code].filter(Boolean).join(" ");
  };

  const hotels: AnyRecord[] = Array.isArray(pkg?.hotels) ? pkg.hotels : [];
  const hotelCity = pkg?.hotelCity || pkg?.destination?.city || pkg?.toCity || destCode;
  const perNight = (h: AnyRecord) => {
    if (h?.pricePerNight) return h.pricePerNight;
    if (h?.price && hotelNights) {
      const val = Number(h.price) / Math.max(hotelNights, 1);
      return Math.round(val);
    }
    return undefined;
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="route-title">
          <b>Option {index + 1}</b> • {originCode || "—"}–{destCode || "—"}
          {pkg?.departDate && pkg?.returnDate ? (
            <>
              {" "}
              • <span className="date-pill">{pkg.departDate}</span>{" "}
              <span className="arrow">➜</span> <span className="date-pill">{pkg.returnDate}</span>
            </>
          ) : null}
        </div>

        <div className="actions">
          {price != null && <span className="price-pill">{fmtMoney(price, currency)}</span>}

          {pkg?.links?.triotrip && (
            <a className="btn ghost" href={pkg.links.triotrip} target="_blank" rel="noreferrer">
              TrioTrip
            </a>
          )}
          {pkg?.links?.googleFlights && (
            <a className="btn ghost" href={pkg.links.googleFlights} target="_blank" rel="noreferrer">
              Google Flights
            </a>
          )}
          {pkg?.links?.skyscanner && (
            <a className="btn ghost" href={pkg.links.skyscanner} target="_blank" rel="noreferrer">
              Skyscanner
            </a>
          )}
          {pkg?.links?.airline && (
            <a className="btn ghost" href={pkg.links.airline} target="_blank" rel="noreferrer">
              {pkg?.airlineName || "Airline"}
            </a>
          )}

          <button
            className={`btn ${inCompare ? "primary" : "ghost"}`}
            onClick={() => onToggleCompare(id)}
            aria-pressed={inCompare}
          >
            {inCompare ? "Compared" : "＋ Compare"}
          </button>
        </div>
      </div>

      {/* FLIGHTS */}
      {(outbound?.length || inbound?.length) ? (
        <div className="flight-block">
          {outbound?.length ? (
            <section className="flight-section">
              <div className="section-title">Outbound</div>
              {outbound.map((leg, i) => (
                <div key={`out-${i}`} className="leg-row">
                  <div className="leg-main">
                    <div className="leg-route">
                      <b>{leg?.from || "—"}</b> → <b>{leg?.to || "—"}</b>
                    </div>
                    <div className="leg-time">
                      {fmtTime(leg?.depart || leg?.depTime)} — {fmtTime(leg?.arrive || leg?.arrTime)}
                    </div>
                  </div>
                  <div className="leg-meta">
                    <div className="airline">{legTitle(leg)}</div>
                    <div className="duration">{fmtDuration(leg?.durationMins || leg?.duration)}</div>
                  </div>

                  {(leg?.layover || outbound[i + 1]) && (
                    <div className="layover-wrap">
                      <LayoverChip
                        airport={(leg?.layover && leg.layover.airport) || leg?.to}
                        nextDepart={outbound[i + 1]?.depart || outbound[i + 1]?.depTime}
                        durationMins={leg?.layover?.durationMins}
                      />
                    </div>
                  )}
                </div>
              ))}
            </section>
          ) : null}

          {inbound?.length ? (
            <section className="flight-section">
              <div className="section-title">Return</div>
              {inbound.map((leg, i) => (
                <div key={`in-${i}`} className="leg-row">
                  <div className="leg-main">
                    <div className="leg-route">
                      <b>{leg?.from || "—"}</b> → <b>{leg?.to || "—"}</b>
                    </div>
                    <div className="leg-time">
                      {fmtTime(leg?.depart || leg?.depTime)} — {fmtTime(leg?.arrive || leg?.arrTime)}
                    </div>
                  </div>
                  <div className="leg-meta">
                    <div className="airline">{legTitle(leg)}</div>
                    <div className="duration">{fmtDuration(leg?.durationMins || leg?.duration)}</div>
                  </div>

                  {(leg?.layover || inbound[i + 1]) && (
                    <div className="layover-wrap">
                      <LayoverChip
                        airport={(leg?.layover && leg.layover.airport) || leg?.to}
                        nextDepart={inbound[i + 1]?.depart || inbound[i + 1]?.depTime}
                        durationMins={leg?.layover?.durationMins}
                      />
                    </div>
                  )}
                </div>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}

      {/* HOTELS */}
      {showHotel && hotels?.length ? (
        <div className="hotel-block">
          <div className="hotel-title">Hotels (top options)</div>
          {hotels
            .slice(0, showAllHotels ? hotels.length : 9999)
            .map((h, i) => {
              const pn = perNight(h);
              return (
                <div key={`h-${i}`} className="hotel-row">
                  <div className="hotel-left">
                    <img className="hotel-img" src={h?.image || "/logo.png"} alt={h?.name || "Hotel"} />
                    <div className="hotel-info">
                      <div className="hotel-name">{h?.name || "Hotel"}</div>
                      <div className="hotel-city">{h?.city || hotelCity || ""}</div>
                    </div>
                  </div>

                  <div className="hotel-right">
                    {(pn != null || h?.price != null) && (
                      <div className="hotel-price">
                        {pn != null ? (
                          <div className="per-night">
                            {fmtMoney(pn, currency)} <span>/ night</span>
                          </div>
                        ) : null}
                        {h?.price != null ? <div className="total">Total {fmtMoney(h.price, currency)}</div> : null}
                      </div>
                    )}

                    <div className="hotel-ctas">
                      {h?.links?.booking && (
                        <a className="btn" href={h.links.booking} target="_blank" rel="noreferrer">
                          Booking.com
                        </a>
                      )}
                      {h?.links?.expedia && (
                        <a className="btn" href={h.links.expedia} target="_blank" rel="noreferrer">
                          Expedia
                        </a>
                      )}
                      {h?.links?.hotels && (
                        <a className="btn" href={h.links.hotels} target="_blank" rel="noreferrer">
                          Hotels
                        </a>
                      )}
                      {h?.links?.map || h?.map ? (
                        <a className="btn ghost" href={h?.links?.map || h.map} target="_blank" rel="noreferrer">
                          Map
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}