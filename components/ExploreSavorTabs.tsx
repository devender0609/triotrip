// components/ExploreSavorTabs.tsx
import React from "react";

type Props = {
  city: string;
  active: "explore" | "savor" | "misc";
};

const labelCity = (city: string) =>
  city && city !== "Destination" ? city : "your destination";

const ExploreSavorTabs: React.FC<Props> = ({ city, active }) => {
  const displayCity = labelCity(city || "");

  const commonLinks = (
    <>
      <li>
        👉{" "}
        <a
          href={`https://www.google.com/maps/search/tourist+attractions+in+${encodeURIComponent(
            city || "city"
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Google Maps: things to do in {displayCity}
        </a>
      </li>
      <li>
        👉{" "}
        <a
          href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(
            city || "city"
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Tripadvisor guide for {displayCity}
        </a>
      </li>
      <li>
        👉{" "}
        <a
          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(
            (city || "city").replace(/\s+/g, "_")
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Wikipedia overview of {displayCity}
        </a>
      </li>
    </>
  );

  if (active === "explore") {
    return (
      <div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Explore {displayCity}
        </h3>
        <p style={{ fontSize: 13, marginBottom: 6 }}>
          Ideas for how to spend your days in {displayCity}. Use these to refine
          the itinerary or choose which neighborhood to stay in.
        </p>
        <ul
          style={{
            fontSize: 13,
            paddingLeft: 18,
            margin: 0,
            display: "grid",
            gap: 4,
          }}
        >
          <li>
            Check if {displayCity} has a historic center, river walk, or main
            square and plan at least one slow walk there.
          </li>
          <li>
            Search “best viewpoints in {displayCity}” for sunset spots and city
            skyline photos.
          </li>
          <li>
            Pick 1–2 museums or cultural sites that match your interests (art,
            history, science, local culture).
          </li>
          <li>
            Save 2–3 parks or short hikes around {displayCity} for low-key
            mornings or jetlag days.
          </li>
          {commonLinks}
        </ul>
      </div>
    );
  }

  if (active === "savor") {
    return (
      <div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Savor {displayCity}
        </h3>
        <p style={{ fontSize: 13, marginBottom: 6 }}>
          Food & drink ideas so you don&apos;t waste meals on random places.
        </p>
        <ul
          style={{
            fontSize: 13,
            paddingLeft: 18,
            margin: 0,
            display: "grid",
            gap: 4,
          }}
        >
          <li>
            Search “must-try foods in {displayCity}” and add 2–3 signature
            dishes to your list.
          </li>
          <li>
            Bookmark 1–2 casual brunch/lunch spots and 1–2 nicer dinner options
            near where you&apos;re staying.
          </li>
          <li>
            Look for food halls, markets, or street-food areas in {displayCity}{" "}
            to sample lots of things in one stop.
          </li>
          <li>
            If coffee or cafés matter, search “best coffee in {displayCity}” and
            pin a couple of spots on your map.
          </li>
          {commonLinks}
        </ul>
      </div>
    );
  }

  // misc
  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Practical tips for {displayCity}
      </h3>
      <p style={{ fontSize: 13, marginBottom: 6 }}>
        Logistics for getting in, getting around, and staying safe in{" "}
        {displayCity}.
      </p>
      <ul
        style={{
          fontSize: 13,
          paddingLeft: 18,
          margin: 0,
          display: "grid",
          gap: 4,
        }}
      >
        <li>
          Check airport options near {displayCity} and typical ride times to the
          main hotel neighborhoods.
        </li>
        <li>
          Search “public transport in {displayCity}” to see if a transit card
          or day pass will save money.
        </li>
        <li>
          Look up “best neighborhoods to stay in {displayCity}” and choose 1–2
          areas that match your vibe (quiet, nightlife, family-friendly).
        </li>
        <li>
          Review basic safety tips, local customs, and tipping norms for{" "}
          {displayCity}.
        </li>
        {commonLinks}
      </ul>
    </div>
  );
};

export default ExploreSavorTabs;
