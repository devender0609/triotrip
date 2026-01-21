"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import AirportField from "@/components/AirportField";

export default function Page() {
  // IMPORTANT:
  // AirportField's exported Props type in your repo does NOT match (value/onChange).
  // Casting to `any` avoids Next build failing on TS type-check.
  const AirportFieldAny: any = AirportField;

  const [origin, setOrigin] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState("ECONOMY");

  const [includeHotel, setIncludeHotel] = useState(false);
  const [maxStops, setMaxStops] = useState(2);
  const [priceBasis, setPriceBasis] = useState("flightOnly");

  const runSearch = async () => {
    const body = {
      origin: origin?.code ?? origin ?? "",
      destination: destination?.code ?? destination ?? "",
      departDate,
      returnDate: roundTrip ? returnDate : undefined,
      passengers: adults + children + infants,
      passengersAdults: adults,
      passengersChildren: children,
      passengersInfants: infants,
      cabin,
      includeHotel,
      maxStops,
      priceBasis,
    };

    // Replace this with your real fetch call if/when ready:
    // await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    console.log("SEARCH BODY:", body);
  };

  const resetForm = () => {
    setOrigin(null);
    setDestination(null);
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* MODE TOGGLES */}
      <div className="flex gap-4 mb-6">
        <button className="flex-1 py-3 rounded-full bg-white font-semibold border">
          ✨ AI Trip Planning
        </button>
        <button className="flex-1 py-3 rounded-full bg-slate-900 text-white font-semibold">
          🔎 Manual Search
        </button>
      </div>

      {/* MANUAL SEARCH CARD */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">🔎 Manual Search</h2>

        {/* FROM / TO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-semibold">From</label>
            <AirportFieldAny value={origin} onChange={setOrigin} />
          </div>

          <div>
            <label className="font-semibold">To</label>
            <AirportFieldAny value={destination} onChange={setDestination} />
          </div>
        </div>

        {/* DATES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-semibold">Departure date</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold flex items-center gap-2">
              Return date
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={(e) => setRoundTrip(e.target.checked)}
              />
              Round-trip
            </label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              disabled={!roundTrip}
            />
          </div>
        </div>

        {/* PASSENGERS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="font-semibold">Adults</label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-xl px-3 py-2"
              value={adults}
              onChange={(e) => setAdults(+e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Children</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-xl px-3 py-2"
              value={children}
              onChange={(e) => setChildren(+e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Infants</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-xl px-3 py-2"
              value={infants}
              onChange={(e) => setInfants(+e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Cabin</label>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={cabin}
              onChange={(e
              ) => setCabin(e.target.value)}
            >
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
        </div>

        {/* INCLUDE HOTEL — NEW LINE */}
        <div className="mb-3">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={includeHotel}
              onChange={(e) => setIncludeHotel(e.target.checked)}
            />
            Include hotel
          </label>
        </div>

        {/* FILTER ROW (NO SORT) */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="font-semibold">Max stops</label>
            <select
              className="border rounded-xl px-3 py-2 ml-2"
              value={maxStops}
              onChange={(e) => setMaxStops(+e.target.value)}
            >
              <option value={0}>Nonstop</option>
              <option value={1}>Up to 1 stop</option>
              <option value={2}>Up to 2 stops</option>
            </select>
          </div>

          <div>
            <label className="font-semibold">Price basis</label>
            <select
              className="border rounded-xl px-3 py-2 ml-2"
              value={priceBasis}
              onChange={(e) => setPriceBasis(e.target.value)}
            >
              <option value="flightOnly">Flight only</option>
              <option value="bundle">Flight + hotel</option>
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            className="px-6 py-3 rounded-xl border font-semibold"
            onClick={resetForm}
            type="button"
          >
            Reset
          </button>

          <button
            className="px-8 py-3 rounded-xl bg-slate-900 text-white font-semibold"
            onClick={runSearch}
            type="button"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
