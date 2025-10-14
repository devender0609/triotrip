"use client";

import React from "react";
import ResultCard from "../components/ResultCard";

// ---------------- Types ----------------
type MainTab = "explore" | "savor" | "compare";

// ---------------- Small local UI bits ----------------
const SavedChip = ({ count }: { count: number }) => (
  <span className="toolbar-chip" aria-label={`Saved ${count}`}>Saved ({count})</span>
);

// ---------------- Link helpers (city-scoped) ----------------
const enc = encodeURIComponent;

const gmapsQueryLink = (city: string, q: string) =>
  `https://www.google.com/maps/search/${enc(`${q} in ${city}`)}`;

const tripadvisor = (q: string, city: string) =>
  `https://www.tripadvisor.com/Search?q=${enc(`${q} ${city}`)}`;

const yelp = (q: string, city: string) =>
  `https://www.yelp.com/search?find_desc=${enc(q)}&find_loc=${enc(city)}`;

const opentable = (city: string) =>
  `https://www.opentable.com/s?covers=2&currentview=list&datetime=${enc(
    new Date().toISOString()
  )}&metroId=72&size=100&term=${enc(city)}`;

const michelin = (city: string) =>
  `https://guide.michelin.com/en/search?q=${enc(city)}`;

const lonelyplanet = (city: string) =>
  `https://www.lonelyplanet.com/search?q=${enc(city)}`;

const timeout = (city: string) =>
  `https://www.timeout.com/search?query=${enc(city)}`;

const wiki = (city: string) =>
  `https://en.wikipedia.org/wiki/${enc(city)}`;

const wikivoyage = (city: string) =>
  `https://en.wikivoyage.org/wiki/${enc(city)}`;

const xe = (city: string) =>
  `https://www.xe.com/currencyconverter/convert/?Amount=1&To=USD&search=${enc(city)}`;

const usStateDept = () =>
  `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`;

const web = (q: string) =>
  `https://www.google.com/search?q=${enc(q)}`;

// ---------------- ContentPlaces (EX/SA panels) ----------------
function ContentPlaces({
  mode,
  destCity,
  isInternational,
}: {
  mode: MainTab;
  destCity: string;
  isInternational: boolean;
}) {
  const blocks =
    mode === "explore"
      ? [
          { title: "Top sights", q: "top attractions" },
          { title: "Parks & views", q: "parks scenic views" },
          { title: "Museums", q: "museums galleries" },
          { title: "Family", q: "family activities" },
          { title: "Nightlife", q: "nightlife bars" },
          { title: "Guides", q: "travel guide" },
        ]
      : [
          { title: "Best restaurants", q: "best restaurants" },
          { title: "Local eats", q: "local food spots" },
          { title: "Cafés & coffee", q: "cafes coffee" },
          { title: "Street food", q: "street food" },
          { title: "Desserts", q: "desserts bakeries" },
          { title: "Reservations", q: "reservations" },
        ];

  const know = isInternational ? (
    <div className="place-card">
      <div className="place-title">Know before you go</div>
      <div style={{ color: "#475569", fontWeight: 500, fontSize: 13 }}>
        Culture, currency, safety & tips
      </div>
      <div className="place-links">
        <a className="place-link" href={wikivoyage(destCity)} target="_blank" rel="noreferrer">Wikivoyage</a>
        <a className="place-link" href={wiki(destCity)} target="_blank" rel="noreferrer">Wikipedia</a>
        <a className="place-link" href={xe(destCity)} target="_blank" rel="noreferrer">XE currency</a>
        <a className="place-link" href={usStateDept()} target="_blank" rel="noreferrer">US State Dept</a>
        <a className="place-link" href={gmapsQueryLink(destCity, "pharmacies")} target="_blank" rel="noreferrer">Maps: Pharmacies</a>
      </div>
    </div>
  ) : null;

  return (
    <section
      className="places-panel"
      aria-label={mode === "explore" ? "Explore destination" : "Savor destination"}
    >
      <div className="subtle-h">
        {mode === "explore" ? `🌍 Explore - ${destCity}` : `🍽️ Savor - ${destCity}`}
      </div>

      <div className="places-grid">
        {know}

        {blocks.map(({ title, q }) => (
          <div key={title} className="place-card">
            <div className="place-title">{title}</div>
            <div style={{ color: "#475569", fontWeight: 500, fontSize: 13 }}>{q}</div>
            <div className="place-links">
              <a className="place-link" href={gmapsQueryLink(destCity, q)} target="_blank" rel="noreferrer">Google Maps</a>
              <a className="place-link" href={tripadvisor(q, destCity)} target="_blank" rel="noreferrer">Tripadvisor</a>

              {mode === "savor" && (
                <>
                  <a className="place-link" href={yelp(q, destCity)} target="_blank" rel="noreferrer">Yelp</a>
                  <a className="place-link" href={opentable(destCity)} target="_blank" rel="noreferrer">OpenTable</a>
                  <a className="place-link" href={michelin(destCity)} target="_blank" rel="noreferrer">Michelin</a>
                </>
              )}

              {mode === "explore" && (
                <>
                  <a className="place-link" href={lonelyplanet(destCity)} target="_blank" rel="noreferrer">Lonely Planet</a>
                  <a className="place-link" href={timeout(destCity)} target="_blank" rel="noreferrer">Time Out</a>
                </>
              )}

              <a className="place-link" href={web(`${q} in ${destCity}`)} target="_blank" rel="noreferrer">Web</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------- Main Page ----------------
export default function Page() {
  // form + state (trimmed to what’s used for the toolbar behavior here)
  const [origin, setOrigin] = React.useState("ORD");
  const [destCity, setDestCity] = React.useState("Paris");
  const [departDate, setDepartDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState("");
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [infants, setInfants] = React.useState(0);

  const [hasSearched, setHasSearched] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<MainTab>("compare");
  const [compareMode, setCompareMode] = React.useState<boolean>(true);
  const [exploreVisible, setExploreVisible] = React.useState<boolean>(false);

  const [sort, setSort] = React.useState<"best" | "cheapest" | "fastest" | "flexible">("best");
  const [sortBasis, setSortBasis] = React.useState<"flightOnly" | "bundle">("flightOnly");
  const [showAll, setShowAll] = React.useState(false);
  const [savedCount] = React.useState(0);

  const [loading, setLoading] = React.useState(false);

  const isInternational = React.useMemo(() => {
    // naive: if city includes a comma country or not a US city code
    return !/USA|United States|,?\s*US\b/i.test(destCity);
  }, [destCity]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // simulate async
    setTimeout(() => {
      setHasSearched(true);
      setCompareMode(true);
      setActiveTab("compare");
      setExploreVisible(false);
      setLoading(false);
    }, 300);
  }

  // toolbar segmented buttons style
  const segStyle = (on: boolean): React.CSSProperties => ({
    height: 36,
    padding: "0 10px",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: 10,
    border: on ? "2px solid #0284c7" : "1px solid #93c5fd",
    background: on ? "#e0f2fe" : "#fff",
    color: on ? "#0c4a6e" : "#0369a1",
  });

  return (
    <div style={{ padding: 12, display: "grid", gap: 14 }}>
      {/* remove underline/baseline on header links & logo without touching globals */}
      <style jsx global>{`
        header a { text-decoration: none !important; border-bottom: 0 !important; }
      `}</style>

      {/* Simple form to “Search” and unlock tabs */}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(6, minmax(0,1fr))", alignItems: "end" }}>
          <label style={{ gridColumn: "span 2" }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Origin</div>
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="input" />
          </label>

          <label style={{ gridColumn: "span 2" }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Destination city</div>
            <input value={destCity} onChange={(e) => setDestCity(e.target.value)} className="input" />
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Depart</div>
            <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} className="input" />
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Return</div>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="input" />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Adults</label>
            <input type="number" min={1} value={adults} onChange={(e) => setAdults(+e.target.value)} style={{ width: 70 }} className="input" />
          </div>
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Children</label>
            <input type="number" min={0} value={children} onChange={(e) => setChildren(+e.target.value)} style={{ width: 70 }} className="input" />
          </div>
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Infants</label>
            <input type="number" min={0} value={infants} onChange={(e) => setInfants(+e.target.value)} style={{ width: 70 }} className="input" />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <div>
              <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Sort by (basis)</label>
              <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" style={segStyle("flightOnly" === sortBasis)} onClick={() => setSortBasis("flightOnly")}>Flight only</button>
                <button type="button" style={segStyle("bundle" === sortBasis)} onClick={() => setSortBasis("bundle")}>Bundle total</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="submit" style={{ height: 46, padding: "0 18px", fontWeight: 600, color: "#0b3b52", background: "linear-gradient(180deg,#f0fbff,#e6f7ff)", borderRadius: 10, minWidth: 130, fontSize: 15, cursor: "pointer", border: "1px solid #c9e9fb" }}>
            {loading ? "Searching…" : "Search"}
          </button>
          <button type="button" style={{ height: 46, padding: "0 16px", fontWeight: 600, background: "#fff", border: "2px solid #7dd3fc", color: "#0369a1", borderRadius: 12, cursor: "pointer", lineHeight: 1, whiteSpace: "nowrap" }} onClick={() => window.location.reload()}>
            Reset
          </button>
        </div>
      </form>

      {/* Toolbar — appears only after search; tabs toggle their panels; compare hides them */}
      {hasSearched && (
        <div className="toolbar">
          <div className="tabs" role="tablist" aria-label="Content tabs">
            <button
              className={`tab ${activeTab === "explore" ? "tab--active" : ""}`}
              role="tab"
              aria-selected={activeTab === "explore"}
              onClick={() => {
                if (activeTab === "explore" && exploreVisible) { setExploreVisible(false); }
                else { setActiveTab("explore"); setExploreVisible(true); }
                setCompareMode(false);
              }}
            >
              {`🌍 Explore - ${destCity}`}
            </button>

            <button
              className={`tab ${activeTab === "savor" ? "tab--active" : ""}`}
              role="tab"
              aria-selected={activeTab === "savor"}
              onClick={() => {
                if (activeTab === "savor" && exploreVisible) { setExploreVisible(false); }
                else { setActiveTab("savor"); setExploreVisible(true); }
                setCompareMode(false);
              }}
            >
              {`🍽️ Savor - ${destCity}`}
            </button>

            <button
              className={`tab tab--compare ${compareMode ? "tab--active" : ""}`}
              role="tab"
              aria-selected={compareMode}
              onClick={() => { setExploreVisible(false); setActiveTab("compare"); setCompareMode(v => !v); }}
            >
              ⚖️ Compare
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div role="tablist" aria-label="Sort" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["best", "cheapest", "fastest", "flexible"] as const).map((k) => (
                <button key={k} role="tab" aria-selected={sort === k} className={`toolbar-chip ${sort === k ? "toolbar-chip--active" : ""}`} onClick={() => setSort(k)}>
                  {k === "best" ? "Best" : k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <button className={`toolbar-chip ${!showAll ? "toolbar-chip--active" : ""}`} onClick={() => setShowAll(false)} title="Show top 3">Top-3</button>
            <button className={`toolbar-chip ${showAll ? "toolbar-chip--active" : ""}`} onClick={() => setShowAll(true)} title="Show all">All</button>
            <button className="toolbar-chip" onClick={() => window.print()}>Print</button>
            <SavedChip count={savedCount} />
          </div>
        </div>
      )}

      {/* Panels: Explore/Savor only if clicked; Compare hides them */}
      {hasSearched && exploreVisible && activeTab !== "compare" && (
        <ContentPlaces mode={activeTab} destCity={destCity} isInternational={isInternational} />
      )}

      {/* Example results area below (your own ResultCard list) */}
      <div className="results-grid">
        {/* Your mapping/rendering of flight/hotel/combined results can live here */}
        {/* <ResultCard ... /> */}
        <div style={{ fontSize: 13, color: "#64748b" }}>
          (Results list placeholder — your existing ResultCard map renders here.)
        </div>
      </div>
    </div>
  );
}
