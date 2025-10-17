"use client";
import React from "react";
import SavorExploreLinks from "@/components/SavorExploreLinks";

export default function ExploreSavorTabs({
  showTabs,
  destinationCity,
  destinationCountry,
  countryCode,
}: {
  showTabs: boolean;
  destinationCity: string;
  destinationCountry: string;
  countryCode?: string;
}) {
  const city = destinationCity || "";
  const ctry = destinationCountry || "";
  const cc = (countryCode || "").toUpperCase();

  const [openExplore, setOpenExplore] = React.useState(false);
  const [openSavor, setOpenSavor] = React.useState(false);
  const [openMisc, setOpenMisc] = React.useState(false);

  if (!showTabs) return null;

  return (
    <section style={{ marginTop: 12 }}>
      <div className="tabs" role="tablist" aria-label="Explore Savor Misc">
        <button className={`tab ${openExplore ? "active":""}`} role="tab" aria-selected={openExplore} onClick={() => setOpenExplore(v=>!v)}>🗺️ Explore</button>
        <button className={`tab ${openSavor ? "active":""}`} role="tab" aria-selected={openSavor} onClick={() => setOpenSavor(v=>!v)}>🍽️ Savor</button>
        <button className={`tab ${openMisc ? "active":""}`} role="tab" aria-selected={openMisc} onClick={() => setOpenMisc(v=>!v)}>🧭 Misc</button>
      </div>

      {openExplore && (
        <div className="row-grid">
          <div>
            <div className="section-title">Top sights</div>
            <SavorExploreLinks category="explore" countryCode={cc} countryName={ctry} city={city} query="top sights" limit={8}/>
            <hr className="soft" />
            <div className="section-title">Parks &amp; views</div>
            <SavorExploreLinks category="explore" countryCode={cc} countryName={ctry} city={city} query="parks viewpoints" limit={8}/>
          </div>
          <div>
            <div className="section-title">Museums</div>
            <SavorExploreLinks category="explore" countryCode={cc} countryName={ctry} city={city} query="museums" limit={8}/>
            <hr className="soft" />
            <div className="section-title">Family</div>
            <SavorExploreLinks category="explore" countryCode={cc} countryName={ctry} city={city} query="family kids" limit={8}/>
            <hr className="soft" />
            <div className="section-title">Nightlife</div>
            <SavorExploreLinks category="explore" countryCode={cc} countryName={ctry} city={city} query="nightlife" limit={8}/>
            <hr className="soft" />
            <div className="section-title">Guides</div>
            <SavorExploreLinks category="explore" countryCode={cc} countryName={ctry} city={city} query="guides" limit={8}/>
          </div>
        </div>
      )}

      {openSavor && (
        <div className="row-grid">
          <div>
            <div className="section-title">Restaurants</div>
            <SavorExploreLinks category="savor" countryCode={cc} countryName={ctry} city={city} query="restaurants" limit={8}/>
            <hr className="soft" />
            <div className="section-title">Cafés</div>
            <SavorExploreLinks category="savor" countryCode={cc} countryName={ctry} city={city} query="cafes coffee" limit={8}/>
          </div>
          <div>
            <div className="section-title">Bars</div>
            <SavorExploreLinks category="savor" countryCode={cc} countryName={ctry} city={city} query="bars" limit={8}/>
            <hr className="soft" />
            <div className="section-title">Markets &amp; street food</div>
            <SavorExploreLinks category="savor" countryCode={cc} countryName={ctry} city={city} query="markets street food" limit={8}/>
          </div>
        </div>
      )}

      {openMisc && (
        <div className="row-grid">
          <div>
            <div className="section-title">Know before you go</div>
            <SavorExploreLinks category="misc" countryCode={cc} countryName={ctry} city={city} query="kbyg" limit={6}/>
          </div>
          <div>
            <div className="section-title">Weather / Pharmacies / Car rental</div>
            <SavorExploreLinks category="misc" countryCode={cc} countryName={ctry} city={city} query="utilities" limit={8}/>
          </div>
        </div>
      )}
    </section>
  );
}
