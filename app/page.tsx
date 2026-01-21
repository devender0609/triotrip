"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type PriceBasis = "flightOnly" | "tripBundle";
type SortKey = "best" | "cheapest" | "fastest";

type FlightSeg = {
  from: string;
  to: string;
  depart_time: string;
  arrive_time: string;
  duration_minutes?: number;
};

type Hotel = {
  name: string;
  star?: number;
  city?: string;
  price_converted?: number;
  currency?: string;
  imageUrl?: string;
  deeplinks?: { booking?: boolean; hotels?: boolean; expedia?: boolean };
};

type Candidate = {
  id: string;
  currency?: string;
  hotelWarning?: string | null;
  sortBasis?: string;

  flight?: {
    carrier_name?: string;
    cabin?: Cabin | string;
    stops?: number;
    refundable?: boolean;
    greener?: boolean;
    price_usd?: number;
    duration_minutes?: number;
    segments_out?: FlightSeg[];
    segments_in?: FlightSeg[];
    deeplinks?: {
      airline?: { name?: string; url?: string };
    };
  };

  deeplinks?: {
    airline?: { name?: string; url?: string };
  };

  hotelCheckIn?: string;
  hotelCheckOut?: string;

  passengers?: number;
  passengersAdults?: number;
  passengersChildren?: number;
  passengersChildrenAges?: number[];

  hotels?: Hotel[];
  hotel?: Hotel;

  flight_total?: number;
  hotel_total?: number;
  total_cost?: number;
  display_total?: number;
};

type SearchResponse = {
  results: Candidate[];
  hotelWarning?: string | null;
  sortBasis?: string;
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function money(n: unknown, currency = "USD") {
  const v = typeof n === "number" && Number.isFinite(n) ? n : null;
  if (v === null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${v.toFixed(0)} ${currency}`;
  }
}

function fmtDateTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function sumDur(segs?: FlightSeg[]) {
  if (!segs || !Array.isArray(segs)) return 0;
  return segs.reduce((acc, s) => acc + (typeof s?.duration_minutes === "number" ? s.duration_minutes : 0), 0);
}

function stopsLabel(stops?: number) {
  if (stops === undefined || stops === null) return "—";
  if (stops === 0) return "Non-stop";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

/** Lightweight AirportField (no strict prop contract, avoids TS mismatch). */
function AirportField({
  value,
  onChange,
  placeholder = "City, airport or code",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("manual");

  // Manual search form
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [returnDate, setReturnDate] = useState("");

  const [passengersAdults, setPassengersAdults] = useState(1);
  const [passengersChildren, setPassengersChildren] = useState(0);
  const [passengersInfants, setPassengersInfants] = useState(0);

  const passengers = useMemo(() => passengersAdults + passengersChildren + passengersInfants, [
    passengersAdults,
    passengersChildren,
    passengersInfants,
  ]);

  const [cabin, setCabin] = useState<Cabin>("ECONOMY");
  const [includeHotel, setIncludeHotel] = useState(false);
  const [maxStops, setMaxStops] = useState<number>(2);
  const [sortKey, setSortKey] = useState<SortKey>("best");
  const [priceBasis, setPriceBasis] = useState<PriceBasis>("flightOnly");

  // Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resp, setResp] = useState<SearchResponse | null>(null);

  // Compare
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const toggleCompare = (id: string) => {
    setComparedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  async function runSearch() {
    setError(null);
    setResp(null);
    setComparedIds([]);

    const body = {
      origin,
      destination,
      departDate,
      roundTrip,
      returnDate: roundTrip ? returnDate : undefined,
      passengers,
      passengersAdults,
      passengersChildren,
      passengersInfants,
      cabin,
      includeHotel,
      maxStops,
      sort: sortKey,
      priceBasis,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Search failed (${res.status}). ${t}`);
      }

      const data = (await res.json()) as SearchResponse;
      setResp(data);
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setOrigin("");
    setDestination("");
    setDepartDate("");
    setReturnDate("");
    setRoundTrip(true);
    setPassengersAdults(1);
    setPassengersChildren(0);
    setPassengersInfants(0);
    setCabin("ECONOMY");
    setIncludeHotel(false);
    setMaxStops(2);
    setSortKey("best");
    setPriceBasis("flightOnly");
    setResp(null);
    setError(null);
    setComparedIds([]);
  }

  const results = resp?.results ?? [];
  const currency = (results?.[0]?.currency || "USD") as string;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
      {/* Tabs */}
      <div className="mb-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            You can switch tabs anytime — results stay separate for AI and Manual modes.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={[
              "rounded-full border px-4 py-3 text-sm font-semibold transition",
              activeTab === "ai"
                ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white",
            ].join(" ")}
          >
            ✨ AI Trip Planning
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={[
              "rounded-full border px-4 py-3 text-sm font-semibold transition",
              activeTab === "manual"
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white",
            ].join(" ")}
          >
            🔎 Manual Search
          </button>
        </div>
      </div>

      {activeTab === "ai" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-semibold">AI Trip Planning</div>
          <div className="mt-2 text-sm text-slate-600">
            (Keeping this page build-stable. Your AI panels can be re-wired after manual search is stable.)
          </div>
        </div>
      ) : (
        <>
          {/* Manual Search Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg font-semibold">🔎 Manual Search</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">From</label>
                <AirportField value={origin} onChange={setOrigin} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">To</label>
                <AirportField value={destination} onChange={setDestination} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">Departure date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-800">Return date</label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={roundTrip}
                      onChange={(e) => setRoundTrip(e.target.checked)}
                    />
                    Round-trip
                  </label>
                </div>

                <input
                  type="date"
                  disabled={!roundTrip}
                  className={[
                    "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2",
                    roundTrip ? "border-slate-200 bg-white focus:ring-slate-200" : "border-slate-100 bg-slate-50 text-slate-400",
                  ].join(" ")}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">Adults</label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={passengersAdults}
                    onChange={(e) => setPassengersAdults(clampInt(Number(e.target.value || 1), 1, 9))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">Children</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={passengersChildren}
                    onChange={(e) => setPassengersChildren(clampInt(Number(e.target.value || 0), 0, 9))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">Infants</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={passengersInfants}
                    onChange={(e) => setPassengersInfants(clampInt(Number(e.target.value || 0), 0, 9))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-800">Cabin</label>
                <select
                  value={cabin}
                  onChange={(e) => setCabin(e.target.value as Cabin)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                </select>
              </div>

              {/* Controls row */}
              <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={includeHotel}
                    onChange={(e) => setIncludeHotel(e.target.checked)}
                  />
                  Include hotel
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Max stops</span>
                  <select
                    value={maxStops}
                    onChange={(e) => setMaxStops(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value={0}>Non-stop only</option>
                    <option value={1}>Up to 1 stop</option>
                    <option value={2}>Up to 2 stops</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Price basis</span>
                  <select
                    value={priceBasis}
                    onChange={(e) => setPriceBasis(e.target.value as PriceBasis)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="flightOnly">Flight only</option>
                    <option value="tripBundle">Trip bundle</option>
                  </select>
                </div>

                {/* Keep sort internal for server logic if you want, but not required for UI */}
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <option value="best">Best</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="fastest">Fastest</option>
                </select>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={runSearch}
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Searching…" : "Search"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {resp && (
            <div className="mt-6">
              {!!resp.hotelWarning && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {resp.hotelWarning}
                </div>
              )}

              <div className="mb-3 text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{results.length}</span> options
                {comparedIds.length > 0 && (
                  <>
                    {" "}
                    • <span className="font-semibold text-slate-900">{comparedIds.length}</span> selected to compare
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {results.map((c, idx) => {
                  const airlineName = c.flight?.carrier_name || c.flight?.deeplinks?.airline?.name || c.deeplinks?.airline?.name || "Airline";
                  const flightStops = c.flight?.stops;
                  const outSegs = c.flight?.segments_out || [];
                  const inSegs = c.flight?.segments_in || [];
                  const duration =
                    typeof c.flight?.duration_minutes === "number"
                      ? c.flight.duration_minutes
                      : sumDur(outSegs) + sumDur(inSegs);

                  const flightTotal = c.flight_total ?? c.flight?.price_usd ?? c.display_total ?? 0;
                  const hotelTotal = c.hotel_total ?? (includeHotel ? c.hotel?.price_converted : 0) ?? 0;
                  const total = c.total_cost ?? (flightTotal + (hotelTotal || 0));

                  const mainHotel = c.hotel || (c.hotels && c.hotels[0]) || null;

                  return (
                    <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold tracking-widest text-slate-500">
                            OPTION {idx + 1}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-slate-900">{airlineName}</div>
                            <div className="text-sm text-slate-600">• {stopsLabel(flightStops)}</div>
                            {duration ? <div className="text-sm text-slate-600">• {Math.round(duration)} min</div> : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={comparedIds.includes(c.id)}
                              onChange={() => toggleCompare(c.id)}
                            />
                            Compare
                          </label>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-500">TOTAL FOR {passengers} TRAVELER{passengers === 1 ? "" : "S"}</div>
                            <div className="text-lg font-extrabold text-slate-900">{money(total, currency)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Hotel bundle (only if includeHotel and hotels exist) */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">🏨 Hotel bundle</div>
                            <div className="text-xs text-slate-600">
                              {c.hotelCheckIn && c.hotelCheckOut ? `${c.hotelCheckIn} → ${c.hotelCheckOut}` : ""}
                            </div>
                          </div>

                          {includeHotel && (c.hotels?.length || mainHotel) ? (
                            <div className="space-y-2">
                              {(c.hotels || (mainHotel ? [mainHotel] : [])).slice(0, 3).map((h, i) => (
                                <div
                                  key={`${c.id}-h-${i}`}
                                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                                >
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {h.name}{" "}
                                      {typeof h.star === "number" ? (
                                        <span className="text-amber-500">
                                          {"★".repeat(Math.max(0, Math.min(5, Math.round(h.star))))}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="text-xs text-slate-600">{h.city || destination || "Destination"}</div>
                                  </div>
                                  <div className="text-sm font-extrabold text-slate-900">
                                    {money(h.price_converted, h.currency || currency)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">
                              {includeHotel ? "No hotel picks returned for this option." : "Enable “Include hotel” to bundle hotels."}
                            </div>
                          )}
                        </div>

                        {/* Flight details */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">✈️ Flight details</div>
                            <div className="text-xs text-slate-600">
                              Cabin {String(c.flight?.cabin || cabin)} • {stopsLabel(flightStops)}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="mb-1 text-xs font-semibold tracking-widest text-slate-500">OUTBOUND</div>
                              {outSegs.length ? (
                                outSegs.map((s, i) => (
                                  <div key={`${c.id}-out-${i}`} className="text-sm text-slate-800">
                                    <span className="font-semibold">
                                      {s.from} → {s.to}
                                    </span>{" "}
                                    <span className="text-slate-600">
                                      • Dep {fmtDateTime(s.depart_time)} • Arr {fmtDateTime(s.arrive_time)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-slate-600">No outbound segments returned.</div>
                              )}
                            </div>

                            {roundTrip && (
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="mb-1 text-xs font-semibold tracking-widest text-slate-500">RETURN</div>
                                {inSegs.length ? (
                                  inSegs.map((s, i) => (
                                    <div key={`${c.id}-in-${i}`} className="text-sm text-slate-800">
                                      <span className="font-semibold">
                                        {s.from} → {s.to}
                                      </span>{" "}
                                      <span className="text-slate-600">
                                        • Dep {fmtDateTime(s.depart_time)} • Arr {fmtDateTime(s.arrive_time)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-sm text-slate-600">No return segments returned.</div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm text-slate-700">
                                Flight total: <span className="font-extrabold text-slate-900">{money(flightTotal, currency)}</span>
                                {includeHotel ? (
                                  <>
                                    {" "}
                                    • Hotel:{" "}
                                    <span className="font-extrabold text-slate-900">{money(hotelTotal, currency)}</span>
                                  </>
                                ) : null}
                              </div>

                              {(() => {
                                const link = c.flight?.deeplinks?.airline?.url || c.deeplinks?.airline?.url;
                                if (!link) return null;
                                return (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                  >
                                    Airline site
                                  </a>
                                );
                              })()}
                            </div>

                            <div className="text-xs text-slate-500">
                              Prices and availability are examples only and may change at booking.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* IMPORTANT: intentionally NO extra hotel list below cards */}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
