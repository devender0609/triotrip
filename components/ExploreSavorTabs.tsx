import React from "react";

type Props = {
  city: string;
  active: "explore" | "savor" | "misc";
};

const labelCity = (city: string) =>
  city && city !== "Destination" ? city : "your destination";

const ExploreSavorTabs: React.FC<Props> = ({ city, active }) => {
  const displayCity = labelCity(city || "");

  const quickLinksRow = (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <a
        href={`https://www.google.com/maps/search/tourist+attractions+in+${encodeURIComponent(
          city || "city"
        )}`}
        target="_blank"
        rel="noreferrer"
        style={{
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #0ea5e9",
          textDecoration: "none",
          background: "#0ea5e9",
          color: "#0f172a",
          fontWeight: 600,
        }}
      >
        🧭 Things to do
      </a>
      <a
        href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(
          city || "city"
        )}`}
        target="_blank"
        rel="noreferrer"
        style={{
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #38bdf8",
          textDecoration: "none",
          background: "#0f172a",
          color: "#e0f2fe",
          fontWeight: 600,
        }}
      >
        ⭐ Reviews
      </a>
      <a
        href={`https://en.wikipedia.org/wiki/${encodeURIComponent(
          (city || "city").replace(/\s+/g, "_")
        )}`}
        target="_blank"
        rel="noreferrer"
        style={{
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #64748b",
          textDecoration: "none",
          background: "#ffffff",
          color: "#0f172a",
          fontWeight: 600,
        }}
      >
        📚 Overview
      </a>
    </div>
  );

  if (active === "explore") {
    return (
      <div
        style={{
          display: "grid",
          gap: 10,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Explore {displayCity}
          </h3>
          <p
            style={{
              fontSize: 13,
              margin: 0,
              marginBottom: 8,
              color: "#475569",
            }}
          >
            Quick ideas for how to spend your time in {displayCity}.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          }}
        >
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Walking & sights
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: "#334155",
                display: "grid",
                gap: 2,
              }}
            >
              <li>
                Check if {displayCity} has a historic center, river walk, or
                main square and plan 1–2 walks there.
              </li>
              <li>
                Search “best viewpoints in {displayCity}” for sunset or skyline
                spots.
              </li>
            </ul>
          </div>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Culture & nature
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: "#334155",
                display: "grid",
                gap: 2,
              }}
            >
              <li>
                Pick 1–2 museums or sites (art, history, or local culture) that
                actually match your interests.
              </li>
              <li>
                Save 2–3 parks, short hikes, or waterfront areas in{" "}
                {displayCity} for low-key mornings.
              </li>
            </ul>
          </div>
        </div>

        {quickLinksRow}
      </div>
    );
  }

  if (active === "savor") {
    return (
      <div
        style={{
          display: "grid",
          gap: 10,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Savor {displayCity}
          </h3>
        <p
          style={{
            fontSize: 13,
            margin: 0,
            marginBottom: 8,
            color: "#475569",
          }}
        >
          Food & drink ideas so you don&apos;t waste meals on random places.
        </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          }}
        >
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Local flavors
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: "#334155",
                display: "grid",
                gap: 2,
              }}
            >
              <li>
                Search “must-try foods in {displayCity}” and list 2–3 dishes.
              </li>
              <li>
                Add 1–2 bakeries, cafés, or dessert spots to your saved places.
              </li>
            </ul>
          </div>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Where to eat
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: "#334155",
                display: "grid",
                gap: 2,
              }}
            >
              <li>
                Bookmark 1–2 casual lunch spots and 1–2 nicer dinner
                reservations near your hotel area.
              </li>
              <li>
                Look for food halls or markets in {displayCity} to sample
                several things at once.
              </li>
            </ul>
          </div>
        </div>

        {quickLinksRow}
      </div>
    );
  }

  // misc
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            marginBottom: 4,
          }}
        >
          Practical tips for {displayCity}
        </h3>
        <p
          style={{
            fontSize: 13,
            margin: 0,
            marginBottom: 8,
            color: "#475569",
          }}
        >
          Logistics for getting in, getting around, and staying safe.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        }}
      >
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 10,
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 4,
              color: "#0f172a",
            }}
          >
            Getting there & around
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              color: "#334155",
              display: "grid",
              gap: 2,
            }}
          >
            <li>
              Check airport options near {displayCity} and typical ride times to
              main hotel areas.
            </li>
            <li>
              Search “public transport in {displayCity}” to see if a transit
              card or day pass will save money.
            </li>
          </ul>
        </div>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 10,
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 4,
              color: "#0f172a",
            }}
          >
            Where to stay & safety
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              color: "#334155",
              display: "grid",
              gap: 2,
            }}
          >
            <li>
              Look up “best neighborhoods to stay in {displayCity}” and pick 1–2
              areas that match your vibe (quiet, nightlife, family).
            </li>
            <li>
              Review basic safety tips and tipping customs for {displayCity} so
              you&apos;re not surprised on arrival.
            </li>
          </ul>
        </div>
      </div>

      {quickLinksRow}
    </div>
  );
};

export default ExploreSavorTabs;
