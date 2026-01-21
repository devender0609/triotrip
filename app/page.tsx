"use client";

import { useState } from "react";
import AirportField from "@/components/AirportField";

export default function Page() {
  const [roundTrip, setRoundTrip] = useState(true);

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-3">
        <button className="chip">✨ AI Trip Planning</button>
        <button className="chip on">🔎 Manual Search</button>
      </div>

      {/* Search Card */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🔎 Manual Search
        </h2>

        {/* From / To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">From</label>
            <AirportField />
          </div>
          <div>
            <label className="font-semibold">To</label>
            <AirportField />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Departure date</label>
            <input type="date" className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="font-semibold flex items-center gap-2">
              Return date
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={() => setRoundTrip(!roundTrip)}
              />
              <span className="text-sm">Round-trip</span>
            </label>
            <input
              type="date"
              disabled={!roundTrip}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label>Adults</label>
            <input type="number" min={1} defaultValue={1} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label>Children</label>
            <input type="number" min={0} defaultValue={0} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label>Infants</label>
            <input type="number" min={0} defaultValue={0} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label>Cabin</label>
            <select className="w-full border rounded px-2 py-1">
              <option>Economy</option>
              <option>Premium</option>
              <option>Business</option>
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Include hotel
          </label>

          <div>
            <label className="block">Max stops</label>
            <select className="border rounded px-2 py-1">
              <option>Up to 2 stops</option>
              <option>Non-stop only</option>
            </select>
          </div>

          <div>
            <label className="block">Price basis</label>
            <select className="border rounded px-2 py-1">
              <option>Flight only</option>
              <option>Flight + Hotel</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button className="btn">Reset</button>
          <button className="btn btn--primary">Search</button>
        </div>
      </div>
    </div>
  );
}
