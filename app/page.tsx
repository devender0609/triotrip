'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import ExploreSavorTabs, { SubTab } from '@/components/ExploreSavorTabs';
import FiltersBar from '@/components/FiltersBar';
import ResultCard from '@/components/ResultCard';
import { searchTrips, type Pkg } from '@/lib/api';
import { buildGoogleFlightsUrl } from '@/lib/deeplinks';

type Cabin = 'economy'|'premium'|'business'|'first';

function isInternational(originCountry: string|undefined, destCountry: string|undefined) {
  if (!originCountry || !destCountry) return false;
  return originCountry.toLowerCase() !== destCountry.toLowerCase();
}

export default function Page() {
  // --- form state (existing fields preserved) ---
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [originCountry, setOriginCountry] = useState<string>();
  const [destCountry, setDestCountry] = useState<string>();
  const [depart, setDepart] = useState<string>('');     // yyyy-mm-dd
  const [ret, setRet]       = useState<string>('');     // yyyy-mm-dd
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin]   = useState<Cabin>('economy');
  const [stops, setStops]   = useState<'0'|'1'|'2+'|'any'>('any');

  // Hotel-only fields appear only when includeHotel = true
  const [includeHotel, setIncludeHotel] = useState<boolean>(false);
  const [checkIn, setCheckIn]   = useState<string>('');  // yyyy-mm-dd
  const [checkOut, setCheckOut] = useState<string>('');  // yyyy-mm-dd
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [minStars, setMinStars]   = useState<number|undefined>(undefined);

  // Results / UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Pkg[]|null>(null);

  // Discovery tabs: only show after Search; clicking active tab toggles off
  const [activeSubTab, setActiveSubTab] = useState<SubTab|null>(null);

  // View toggles
  const [top3, setTop3] = useState<boolean>(true);   // “Top-3” default
  const [showAll, setShowAll] = useState<boolean>(false);

  // ----- derived -----
  const international = isInternational(originCountry, destCountry);

  // ---- hotel date sanity: hotel dates must be on/after flight dates ----
  useEffect(() => {
    if (!includeHotel) return;

    // check-in cannot be before depart
    if (depart && checkIn && checkIn < depart) {
      setCheckIn(depart);
    }
    // check-out cannot be before next day of check-in (and ≤ return if provided)
    if (checkIn && checkOut && checkOut <= checkIn) {
      // bump to +1 day
      const d = new Date(checkIn);
      d.setDate(d.getDate() + 1);
      setCheckOut(d.toISOString().slice(0,10));
    }
    if (ret && checkOut && checkOut > ret) {
      // clamp to return date (hotel must end on/before flight return)
      setCheckOut(ret);
    }
  }, [includeHotel, depart, ret, checkIn, checkOut]);

  // ---- search handler (unchanged deep links) ----
  async function doSearch() {
    setLoading(true);
    setActiveSubTab(null);           // tabs appear AFTER results
    try {
      const data = await searchTrips({
        origin, dest, depart, ret, adults, cabin, stops,
        hotel: includeHotel
          ? { checkIn, checkOut, minBudget, maxBudget, minStars }
          : undefined,
      });
      setResults(data || []);
      // after successful search, show discovery tabs collapsed
      setActiveSubTab(null);
    } finally {
      setLoading(false);
    }
  }

  // ---- helper to toggle discovery tabs ----
  function toggleSubTab(tab: SubTab) {
    setActiveSubTab(cur => (cur === tab ? null : tab));
  }

  // ---- displayed items respecting Top-3 vs All for hotels ----
  const hotelNights = useMemo(() => {
    if (!includeHotel || !checkIn || !checkOut) return undefined;
    const a = new Date(checkIn); const b = new Date(checkOut);
    return Math.max(1, Math.round((+b - +a) / 86400000));
  }, [includeHotel, checkIn, checkOut]);

  const shownResults = useMemo(() => {
    if (!results) return [];
    // For flight results: show all unless “Top-3” is toggled
    // For hotel results: when “Top-3”, cap to 3 *per star band*; when “All”, allow many.
    if (showAll) return results;

    if (top3) {
      // group by hotel star (if exists); keep first 3 in each group
      const out: Pkg[] = [];
      const starCounts = new Map<number, number>();
      for (const r of results) {
        if (r.hotel?.stars) {
          const s = r.hotel.stars;
          const c = starCounts.get(s) || 0;
          if (c < 3) {
            out.push(r);
            starCounts.set(s, c + 1);
          }
        } else {
          // flight or package without star -> allow up to 3 generic
          if (out.filter(x => !x.hotel?.stars).length < 3) out.push(r);
        }
      }
      return out;
    }

    return results;
  }, [results, top3, showAll]);

  // ---- render ----
  return (
    <main className="container mx-auto px-3 py-4">
      {/* Top brand row unchanged */}
      <header className="flex items-center justify-between mb-4">
        <Link href="/" className="inline-flex items-center gap-2 no-underline">
          <Image src="/logo.png" alt="TrioTrip" width={28} height={28} />
          <span className="text-2xl font-semibold">TrioTrip</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Currency picker stays here */}
          <div className="hidden sm:block"><FiltersBar.Currency /></div>
          <FiltersBar.SavedChip />
          <FiltersBar.AuthBar />
        </div>
      </header>

      {/* Search form */}
      <section className="rounded-xl bg-white/80 shadow-sm ring-1 ring-slate-200 p-3 md:p-4 mb-3">
        <FiltersBar.Origin value={origin} onChange={(v,country)=>{ setOrigin(v); setOriginCountry(country);} } />
        <FiltersBar.Destination value={dest} onChange={(v,country)=>{ setDest(v); setDestCountry(country);} } />

        <FiltersBar.TripDates
          depart={depart}
          ret={ret}
          onChangeDepart={setDepart}
          onChangeReturn={setRet}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <FiltersBar.Cabin value={cabin} onChange={setCabin}/>
          <FiltersBar.Stops value={stops} onChange={setStops}/>
          <FiltersBar.Adults value={adults} onChange={setAdults}/>
        </div>

        {/* Hotel toggle + conditional fields */}
        <div className="mt-4 space-y-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeHotel}
              onChange={(e)=> setIncludeHotel(e.target.checked)}
            />
            <span>Include hotel</span>
          </label>

          {includeHotel && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FiltersBar.CheckIn
                  value={checkIn}
                  onChange={setCheckIn}
                  min={depart || undefined}
                />
                <FiltersBar.CheckOut
                  value={checkOut}
                  onChange={setCheckOut}
                  // min is at least next day of checkIn; also clamp to return if present (handled in effect)
                  min={checkIn || depart || undefined}
                  max={ret || undefined}
                />
                <FiltersBar.MinStars value={minStars} onChange={setMinStars}/>
              </div>

              {/* budget appears ONLY when hotel is selected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FiltersBar.MinBudget value={minBudget} onChange={setMinBudget}/>
                <FiltersBar.MaxBudget value={maxBudget} onChange={setMaxBudget}/>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={doSearch} className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button
            className="btn"
            onClick={()=>{
              // light reset — keep origin/dest but clear results & toggles
              setResults(null);
              setActiveSubTab(null);
              setShowAll(false);
              setTop3(true);
            }}
          >
            Reset
          </button>
        </div>
      </section>

      {/* Mode chips (only after search) */}
      {results && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button className={`chip ${top3 ? 'chip-active' : ''}`} onClick={()=>{ setTop3(true); setShowAll(false); }}>Top-3</button>
          <button className={`chip ${showAll ? 'chip-active' : ''}`} onClick={()=>{ setShowAll(true); setTop3(false); }}>All</button>
          <FiltersBar.PrintBtn />
          <FiltersBar.SavedCount />
        </div>
      )}

      {/* Discovery tabs (appear after Search; each is toggle-able) */}
      {results && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <button className={`tab ${activeSubTab==='explore'?'tab-active':''}`} onClick={()=>toggleSubTab('explore')}>Explore</button>
            <button className={`tab ${activeSubTab==='savor'?'tab-active':''}`} onClick={()=>toggleSubTab('savor')}>Savor</button>
            <button className={`tab ${activeSubTab==='misc'?'tab-active':''}`} onClick={()=>toggleSubTab('misc')}>Miscellaneous</button>
            <button className="tab" onClick={()=>toggleSubTab('compare')}>Compare</button>
          </div>

          {activeSubTab && activeSubTab !== 'compare' && (
            <div className="rounded-xl bg-white/80 ring-1 ring-slate-200 p-3 md:p-4">
              <ExploreSavorTabs
                city={dest}
                originCountry={originCountry}
                destCountry={destCountry}
                active={activeSubTab}
              />
            </div>
          )}
        </div>
      )}

      {/* Results list */}
      <section className="space-y-3">
        {shownResults?.map((pkg, idx) => (
          <ResultCard
            key={pkg.id || `pkg-${idx}`}
            pkg={pkg}
            googleFlightsUrl={buildGoogleFlightsUrl(pkg)}
            hotelNights={hotelNights}
          />
        ))}
        {results && !shownResults?.length && (
          <p className="text-slate-500 text-sm">No results match your filters.</p>
        )}
      </section>
    </main>
  );
}
