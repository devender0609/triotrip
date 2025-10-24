'use client';
import React from 'react';
import { type Pkg } from '@/lib/api';
import { airlineNameFromCode } from '@/lib/search';
import { expediaHotelUrl, hotelsDotComUrl } from '@/lib/deeplinks';

export default function ResultCard({
  pkg,
  googleFlightsUrl,
  hotelNights
}: {
  pkg: Pkg;
  googleFlightsUrl?: string;
  hotelNights?: number;
}) {
  const hasHotel = !!pkg.hotel;

  // --- flight helpers (names + elegant layover) ---
  const segs = pkg.flight?.segments || [];
  const layovers = segs.length > 1 ? segs.slice(0, -1) : [];
  const carrier = pkg.flight?.carrier || segs[0]?.carrier;
  const carrierName = airlineNameFromCode(carrier) || carrier || 'Flight';

  // --- hotel price per night (with guarded fallbacks) ---
  let perNight: number|undefined;
  const h = pkg.hotel;
  if (h) {
    if (typeof h.pricePerNight === 'number') perNight = h.pricePerNight;
    else if (typeof h.nightly === 'number') perNight = h.nightly;
    else if (typeof h.rate === 'number') perNight = h.rate;
    else if (typeof h.total === 'number' && hotelNights && hotelNights > 0) {
      perNight = Math.round((h.total / hotelNights) * 100) / 100;
    }
  }

  return (
    <article className="rounded-xl ring-1 ring-slate-200 bg-white/90 p-3 md:p-4">
      {/* header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">
          {pkg.type === 'flight' ? carrierName : (hasHotel ? `${carrierName} + Hotel` : carrierName)}
        </div>

        {/* booking links (pre-filled upstream) */}
        <div className="flex items-center gap-2">
          {googleFlightsUrl && (
            <a className="btn" href={googleFlightsUrl} target="_blank" rel="noreferrer">Google Flights</a>
          )}
          {pkg.links?.skyscanner && (
            <a className="btn" href={pkg.links.skyscanner} target="_blank" rel="noreferrer">Skyscanner</a>
          )}
          {pkg.links?.american && (
            <a className="btn" href={pkg.links.american} target="_blank" rel="noreferrer">American</a>
          )}
        </div>
      </div>

      {/* flight details */}
      {pkg.flight && (
        <div className="mt-2 space-y-2">
          {segs.map((s, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{s.from} → {s.to}</span>
              <span className="opacity-70"> &nbsp; {s.departTime} – {s.arriveTime}</span>
            </div>
          ))}
          {layovers.length > 0 && (
            <div className="mt-1">
              {layovers.map((s, i) => {
                const next = segs[i+1];
                const layoverMins = next && s
                  ? Math.max(0, (new Date(`1970-01-01T${next.departTime}:00Z`).getTime() - new Date(`1970-01-01T${s.arriveTime}:00Z`).getTime())/60000)
                  : undefined;
                return (
                  <div key={i} className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ring-slate-300 bg-slate-50">
                    <span className="opacity-70">Layover</span>
                    <span className="font-medium">{s.to}</span>
                    {layoverMins !== undefined && <span className="opacity-70">• {Math.floor(layoverMins/60)}h {Math.round(layoverMins%60)}m</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* hotel details */}
      {hasHotel && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-3">
          <div>
            <div className="text-sm font-semibold">{h!.name}</div>
            <div className="text-xs opacity-70">{h!.city}{h!.stars ? ` • ${h!.stars}★` : ''}</div>
          </div>
          <div className="text-right">
            {perNight !== undefined && (
              <div className="text-sm font-semibold">${perNight.toLocaleString()}/night</div>
            )}
            <div className="flex justify-end gap-2 mt-1">
              {h!.links?.booking && (
                <a className="btn" href={h!.links.booking} target="_blank" rel="noreferrer">Booking.com</a>
              )}
              <a className="btn" href={expediaHotelUrl(h!, hotelNights)} target="_blank" rel="noreferrer">Expedia</a>
              <a className="btn" href={hotelsDotComUrl(h!, hotelNights)} target="_blank" rel="noreferrer">Hotels</a>
              {h!.links?.map && (
                <a className="btn" href={h!.links.map} target="_blank" rel="noreferrer">Map</a>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
