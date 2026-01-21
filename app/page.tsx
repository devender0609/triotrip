export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";

type Segment = {
  from: string;
  to: string;
  depart_time: string;
  arrive_time: string;
  duration_minutes?: number;
};

type Flight = {
  carrier_name?: string;
  cabin?: string;
  stops?: number;
  refundable?: boolean;
  greener?: boolean;
  price_usd?: number;
  duration_minutes?: number;
  segments_out?: Segment[];
  segments_in?: Segment[];
  deeplinks?: { airline?: { name?: string; url?: string } };
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
  flight?: Flight;
  deeplinks?: { airline?: { name?: string; url?: string } };
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  passengers?: number;
  passengersAdults?: number;
  passengersChildren?: number;
  passengersChildrenAges?: number[];
  flight_total?: number;
  hotel_total?: number;
  total_cost?: number;
  display_total?: number;
  hotels?: Hotel[];
  hotel?: Hotel | null;
};

type SearchResponse = {
  results: Candidate[];
  hotelWarning?: string | null;
  sortBasis?: string | null;
};

function sumDur(segs?: Segment[]) {
  if (!Array.isArray(segs)) return 0;
  return segs.reduce((acc, s) => acc + (typeof s.duration_minutes === "number" ? s.duration_minutes : 0), 0);
}

function currencySymbol(code?: string) {
  const c = (code || "USD").toUpperCase();
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  if (c === "INR") return "₹";
  return "";
}

function fmtDateTime(s?: string) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return s;
  }
}

function minsToHm(m?: number) {
  if (typeof m !== "number" || !isFinite(m) || m < 0) return "";
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}m`;
}

function AirportInput({
  label,
  value,
  onChange,
  placeholder = "City, airport or code",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-300 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function Page() {
  const [mode, setMode] = useState<"ai" | "manual">("manual");

  // Manual search state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [cabin, setCabin] = useState("ECONOMY");
  const [includeHotel, setIncludeHotel] = useState(false);
  const [maxStops, setMaxStops] = useState(2);
  const [priceBasis, setPriceBasis] = useState<"flightOnly" | "total">("flightOnly");

  const passengers = useMemo(() => Math.max(1, (adults || 0) + (children || 0) + (infants || 0)), [adults, children, infants]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resp, setResp] = useState<SearchResponse | null>(null);

  async function runManualSearch() {
    setError(null);
    setResp(null);

    if (!origin.trim() || !destination.trim()) {
      setError("Please enter both origin and destination.");
      return;
    }
    if (!departDate) {
      setError("Please select a departure date.");
      return;
    }
    if (roundTrip && !returnDate) {
      setError("Please select a return date (or uncheck Round-trip).");
      return;
    }

    const body = {
      origin: origin.trim(),
      destination: destination.trim(),
      departDate,
      returnDate: roundTrip ? returnDate : undefined,
      roundTrip,
      passengers,
      passengersAdults: adults,
      passengersChildren: children,
      passengersChildrenAges: [],
      passengersInfants: infants,
      cabin,
      includeHotel,
      maxStops,
      priceBasis,
    };

    try {
      setLoading(true);
      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `Search failed (${r.status})`);
      }

      const json = (await r.json()) as SearchResponse;
      setResp(json);
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function resetManual() {
    setOrigin("");
    setDestination("");
    setDepartDate("");
    setReturnDate("");
    setRoundTrip(true);
    setAdults(1);
    setChildren(0);
    setInfants(0);
    setCabin("ECONOMY");
    setIncludeHotel(false);
    setMaxStops(2);
    setPriceBasis("flightOnly");
    setResp(null);
    setError(null);
  }

  const results = resp?.results || [];
  const currency = (results?.[0]?.currency || "USD").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={[
              "rounded-xl px-4 py-3 text-sm font-semibold transition",
              mode === "ai" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100",
            ].join(" ")}
          >
            ✨ AI Trip Planning
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={[
              "rounded-xl px-4 py-3 text-sm font-semibold transition",
              mode === "manual" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100",
            ].join(" ")}
          >
            🔎 Manual Search
          </button>
        </div>
      </div>

      {mode === "ai" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-700">
            AI mode is wired to <code className="rounded bg-slate-100 px-1">/api/ai/top3</code> in your project. If you want,
            I can hook up a simple UI here too — right now I’m leaving this untouched so we don’t break anything else.
          </div>
        </div>
      ) : (
        <>
          {/* Manual search form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900">🔎 Manual Search</span>
              <span className="text-sm text-slate-500">Find flights{includeHotel ? " + hotels" : ""}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AirportInput label="From" value={origin} onChange={setOrigin} />
              <AirportInput label="To" value={destination} onChange={setDestination} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Departure date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">Return date</label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />
                    Round-trip
                  </label>
                </div>
                <input
                  type="date"
                  disabled={!roundTrip}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition disabled:bg-slate-50"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Adults</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value || "1", 10))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Children</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value || "0", 10))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Infants</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={infants}
                  onChange={(e) => setInfants(parseInt(e.target.value || "0", 10))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Cabin</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={cabin}
                  onChange={(e) => setCabin(e.target.value)}
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                </select>
              </div>
            </div>

            {/* Include hotel on its own line */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input type="checkbox" checked={includeHotel} onChange={(e) => setIncludeHotel(e.target.checked)} />
                Include hotel
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Max stops</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={String(maxStops)}
                  onChange={(e) => setMaxStops(parseInt(e.target.value, 10))}
                >
                  <option value="0">Non-stop only</option>
                  <option value="1">Up to 1 stop</option>
                  <option value="2">Up to 2 stops</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Price basis</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={priceBasis}
                  onChange={(e) => setPriceBasis(e.target.value as any)}
                >
                  <option value="flightOnly">Flight only</option>
                  <option value="total">Total (flight + hotel)</option>
                </select>
              </div>

              <div className="flex items-end justify-end gap-3">
                <button
                  type="button"
                  onClick={resetManual}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={runManualSearch}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {resp?.hotelWarning && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {resp.hotelWarning}
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((c, idx) => {
                const airlineName = c.flight?.carrier_name || c.deeplinks?.airline?.name || c.flight?.deeplinks?.airline?.name || "Airline";
                const stops = c.flight?.stops ?? null;
                const duration = c.flight?.duration_minutes ?? (sumDur(c.flight?.segments_out) + sumDur(c.flight?.segments_in));
                const link = c.flight?.deeplinks?.airline?.url || c.deeplinks?.airline?.url;

                const flightPrice = typeof c.flight_total === "number" ? c.flight_total : c.flight?.price_usd;
                const hotelPrice = typeof c.hotel_total === "number" ? c.hotel_total : c.hotel?.price_converted;
                const total = typeof c.total_cost === "number" ? c.total_cost : typeof c.display_total === "number" ? c.display_total : flightPrice;

                const hasHotel = includeHotel && (c.hotel || (Array.isArray(c.hotels) && c.hotels.length > 0));

                return (
                  <div key={c.id || idx} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-extrabold tracking-widest text-slate-500">OPTION {idx + 1}</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {airlineName}
                          {typeof duration === "number" && duration > 0 ? <span className="text-slate-500"> • {minsToHm(duration)}</span> : null}
                          {typeof stops === "number" ? <span className="text-slate-500"> • {stops === 0 ? "Non-stop" : `${stops} stop${stops === 1 ? "" : "s"}`}</span> : null}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          {typeof total === "number" ? `${total.toFixed(0)} ${currency}` : ""}
                        </div>
                        <div className="text-xs text-slate-500">{passengers} traveler{passengers === 1 ? "" : "s"}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                      {/* Hotel bundle */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 text-sm font-bold text-slate-900">🏨 Hotel bundle</div>
                        {!hasHotel ? (
                          <div className="text-sm text-slate-600">Not included for this search.</div>
                        ) : (
                          <div className="space-y-3">
                            {(c.hotels || (c.hotel ? [c.hotel] : [])).filter(Boolean).slice(0, 3).map((h, hi) => (
                              <div key={hi} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">
                                    {h.name}{" "}
                                    {typeof h.star === "number" ? (
                                      <span className="text-amber-500">{"★".repeat(Math.max(0, Math.min(5, h.star)))}</span>
                                    ) : null}
                                  </div>
                                  <div className="text-xs text-slate-500">{h.city || destination || ""}</div>
                                </div>
                                <div className="text-sm font-extrabold text-emerald-600">
                                  {typeof h.price_converted === "number" ? `${currencySymbol(h.currency)}${h.price_converted.toFixed(0)} ${h.currency || currency}` : ""}
                                </div>
                              </div>
                            ))}
                            <div className="text-xs text-slate-500">Prices and availability are examples and may change at booking.</div>
                          </div>
                        )}
                      </div>

                      {/* Flight details */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 text-sm font-bold text-slate-900">✈️ Flight details</div>

                        <div className="space-y-3 text-sm text-slate-700">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="mb-1 text-xs font-extrabold tracking-widest text-slate-500">OUTBOUND</div>
                            {c.flight?.segments_out?.length ? (
                              c.flight.segments_out.map((s, si) => (
                                <div key={si} className="flex items-center justify-between gap-3">
                                  <div className="font-semibold text-slate-900">
                                    {s.from} → {s.to}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Dep {fmtDateTime(s.depart_time)} • Arr {fmtDateTime(s.arrive_time)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-600">Segment details not available.</div>
                            )}
                          </div>

                          {roundTrip && (
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="mb-1 text-xs font-extrabold tracking-widest text-slate-500">RETURN</div>
                              {c.flight?.segments_in?.length ? (
                                c.flight.segments_in.map((s, si) => (
                                  <div key={si} className="flex items-center justify-between gap-3">
                                    <div className="font-semibold text-slate-900">
                                      {s.from} → {s.to}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Dep {fmtDateTime(s.depart_time)} • Arr {fmtDateTime(s.arrive_time)}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-slate-600">Segment details not available.</div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                Airline site
                              </a>
                            ) : null}
                            {typeof flightPrice === "number" ? (
                              <span className="text-xs text-slate-500">Flight: {currencySymbol(currency)}{flightPrice.toFixed(0)} {currency}</span>
                            ) : null}
                            {typeof hotelPrice === "number" && includeHotel ? (
                              <span className="text-xs text-slate-500">Hotel: {currencySymbol(currency)}{hotelPrice.toFixed(0)} {currency}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
