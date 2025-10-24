"use client";
import React from "react";

type Segment = {
  from: string;
  to: string;
  departTime?: string; // "06:00 AM"
  arriveTime?: string; // "07:45 AM"
  durationText?: string; // "1h 45m"
  airline?: string; // "American"
  layoverNextDepart?: string; // "08:50 AM"
  layoverMins?: number; // 65
};

type Hotel = {
  id?: string;
  name: string;
  city?: string;
  img?: string;
  price?: number; // total
  priceNightly?: number; // nightly
  stars?: number;
  links?: {
    booking?: string;
    expedia?: string;
    hotels?: string;
    map?: string;
  };
};

type Pkg = {
  id?: string;
  routeText?: string; // "AUS – DEL"
  outboundDate?: string; // "2025-10-29"
  returnDate?: string; // "2025-11-05"
  carrier?: string; // "American"
  price?: number;
  currency?: string;
  links?: {
    googleFlights?: string;
    skyscanner?: string;
    airline?: string;
  };
  // flight detail
  outbound?: Segment[];
  inbound?: Segment[];
  // hotels
  hotels?: Hotel[];
};

type Props = {
  pkg: Pkg;
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full border border-slate-300/70 text-slate-700 text-[13px] font-semibold bg-white hover:bg-slate-50"
      style={{ boxShadow: "0 1px 0 rgba(15, 23, 42, .03)" }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-slate-800 font-semibold text-[15px] mb-2 flex items-center gap-2">
      {children}
    </div>
  );
}

function PriceBadge({ amount, currency }: { amount?: number; currency: string }) {
  if (amount == null) return null;
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[14px] font-bold border border-slate-300/70 bg-white"
      title="Bundle total"
    >
      <span role="img" aria-label="money">💵</span>
      {new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(
        amount
      )}
    </div>
  );
}

function RowTime({ seg }: { seg: Segment }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <div className="text-slate-900">
        <span className="font-medium">{seg.from}</span>
        <span className="mx-2">→</span>
        <span className="font-medium">{seg.to}</span>
      </div>
      <div className="text-slate-600 text-[13px]">
        {seg.departTime} — {seg.arriveTime}
      </div>
      <div className="text-slate-700 text-[13px] font-medium">{seg.durationText}</div>
    </div>
  );
}

function LayoverChip({ seg }: { seg: Segment }) {
  if (!seg.layoverNextDepart && !seg.layoverMins) return null;
  return (
    <div className="mt-2">
      <span
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300/80 bg-white px-3 py-1 text-[12px] text-slate-700"
        title="Layover"
      >
        <span role="img" aria-label="clock">
          🕒
        </span>
        <span className="opacity-80">Layover in</span>
        <span className="font-semibold">{seg.to}</span>
        <span className="opacity-70">• Next departs at</span>
        <span className="font-semibold">{seg.layoverNextDepart}</span>
        {seg.layoverMins != null && (
          <span className="opacity-70">({Math.round(seg.layoverMins)}m)</span>
        )}
      </span>
    </div>
  );
}

export default function ResultCard(props: Props) {
  const {
    pkg,
    index,
    currency,
    showHotel,
    hotelNights,
    showAllHotels,
    comparedIds,
    onToggleCompare,
  } = props;

  const pkgId = pkg.id || `pkg-${index}`;
  const inCompare = comparedIds.includes(pkgId);

  // helpers
  const airline = pkg.carrier || pkg.outbound?.[0]?.airline || "";

  const hotels = Array.isArray(pkg.hotels) ? pkg.hotels : [];
  const hotelList = showHotel
    ? showAllHotels
      ? hotels
      : hotels.slice(0, 3) // Top-3 default
    : [];

  return (
    <div
      className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 overflow-hidden"
      style={{ boxShadow: "0 6px 16px rgba(15, 23, 42, .06)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between p-3 sm:p-4 border-b border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="flex flex-col gap-1">
          <div className="text-slate-900 font-semibold">
            Option {index + 1} • {pkg.routeText || ""}
          </div>
          <div className="text-slate-600 text-[13px]">
            Outbound <b>{pkg.outboundDate}</b> • Return <b>{pkg.returnDate}</b>
            {airline ? <> • <b>{airline}</b></> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriceBadge amount={pkg.price} currency={pkg.currency || currency || "USD"} />
          {pkg.links?.googleFlights && (
            <a className="btn chip" href={pkg.links.googleFlights} target="_blank" rel="noreferrer">
              Google Flights
            </a>
          )}
          {pkg.links?.skyscanner && (
            <a className="btn chip" href={pkg.links.skyscanner} target="_blank" rel="noreferrer">
              Skyscanner
            </a>
          )}
          {pkg.links?.airline && (
            <a className="btn chip" href={pkg.links.airline} target="_blank" rel="noreferrer">
              Airline
            </a>
          )}
          <button
            className={`btn chip ${inCompare ? "!bg-amber-50 !border-amber-300" : ""}`}
            onClick={() => onToggleCompare(pkgId)}
            aria-pressed={inCompare}
            title="Add to compare"
          >
            {inCompare ? "🟧 In Compare" : "＋ Compare"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col gap-4">

        {/* Flights Block */}
        <div className="rounded-lg border border-slate-200/80 bg-gradient-to-b from-sky-50/40 to-indigo-50/20 p-3 sm:p-4">
          <div className="grid gap-4">
            {/* Outbound */}
            {!!pkg.outbound?.length && (
              <div>
                <SectionTitle>Outbound</SectionTitle>
                <div className="space-y-3">
                  {pkg.outbound.map((seg, i) => (
                    <div key={`ob-${i}`} className="pb-2">
                      {seg.airline && (
                        <div className="text-slate-700 text-[13px] mb-1">{seg.airline}</div>
                      )}
                      <RowTime seg={seg} />
                      {/* Layover chip appears after each leg except the last */}
                      {i < pkg.outbound.length - 1 ? <LayoverChip seg={seg} /> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return */}
            {!!pkg.inbound?.length && (
              <div className="pt-3 border-t border-slate-200/70">
                <SectionTitle>Return</SectionTitle>
                <div className="space-y-3">
                  {pkg.inbound.map((seg, i) => (
                    <div key={`ib-${i}`} className="pb-2">
                      {seg.airline && (
                        <div className="text-slate-700 text-[13px] mb-1">{seg.airline}</div>
                      )}
                      <RowTime seg={seg} />
                      {i < pkg.inbound.length - 1 ? <LayoverChip seg={seg} /> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hotels Block */}
        {showHotel && (
          <div className="rounded-lg border border-slate-200/80 bg-gradient-to-b from-emerald-50/40 to-teal-50/20">
            <div className="p-3 sm:p-4">
              <SectionTitle>Hotels (top options)</SectionTitle>
              <div className="divide-y divide-slate-200/70">
                {hotelList.map((h, i) => (
                  <div key={h.id || `h-${i}`} className="py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
                    <div className="w-[92px] h-[70px] rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70">
                      {h.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.img} alt={h.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{h.name}</div>
                      <div className="text-slate-600 text-[13px]">{h.city || ""}</div>
                      <div className="mt-1 text-[13px] text-slate-700">
                        {h.priceNightly != null ? (
                          <>
                            {new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: currency || "USD",
                            }).format(h.priceNightly)}{" "}
                            / night
                            {hotelNights ? (
                              <>
                                {" "}
                                • ~{" "}
                                {new Intl.NumberFormat(undefined, {
                                  style: "currency",
                                  currency: currency || "USD",
                                }).format(h.priceNightly * Math.max(1, hotelNights))}
                                {" "}total
                              </>
                            ) : null}
                          </>
                        ) : h.price != null ? (
                          <>Total {new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(h.price)}</>
                        ) : (
                          <>Price shown at partner</>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {h.links?.booking && (
                        <a className="btn chip" href={h.links.booking} target="_blank" rel="noreferrer">
                          Booking.com
                        </a>
                      )}
                      {h.links?.expedia && (
                        <a className="btn chip" href={h.links.expedia} target="_blank" rel="noreferrer">
                          Expedia
                        </a>
                      )}
                      {h.links?.hotels && (
                        <a className="btn chip" href={h.links.hotels} target="_blank" rel="noreferrer">
                          Hotels
                        </a>
                      )}
                      {h.links?.map && (
                        <a className="btn chip" href={h.links.map} target="_blank" rel="noreferrer">
                          Map
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {!hotelList.length && (
                  <div className="py-3 text-[13px] text-slate-600">No hotel options for this package.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------
   Lightweight “btn chip” style (keeps working even if global styles vary)
---------- */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // allow style tweaks in this file w/o TS fuss if project has strict JSX typing
      [elemName: string]: any;
    }
  }
}
