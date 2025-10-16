"use client";
import React, { useState } from "react";
import { getExploreLinks, getSavorLinks } from "@/lib/savorExplore"; // your helper

export default function ExploreSavorTabs({
  destinationCity,
  destinationCountry,
  showTabs, // pass true only after search
}: {
  destinationCity: string;
  destinationCountry: string;
  showTabs: boolean;
}) {
  const [openExplore, setOpenExplore] = useState(false);
  const [openSavor, setOpenSavor] = useState(false);

  if (!showTabs) return null;

  const explore = getExploreLinks(destinationCity, destinationCountry);
  const savor = getSavorLinks(destinationCity, destinationCountry);

  const badge = {
    fontWeight: 900,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#0ea5e9",
    color: "#fff",
    border: "1px solid #0284c7",
  } as React.CSSProperties;

  const row = { display: "grid", gap: 8, marginBottom: 10 } as React.CSSProperties;
  const pillBtn = (active: boolean) => ({
    ...badge,
    background: active ? "#0284c7" : "#0ea5e9",
    border: `1px solid ${active ? "#0369a1" : "#0284c7"}`,
    cursor: "pointer",
  });

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={pillBtn(openExplore)} onClick={() => setOpenExplore(v => !v)}>
          🔎 Explore
        </button>
        <button style={pillBtn(openSavor)} onClick={() => setOpenSavor(v => !v)}>
          🍽️ Savor
        </button>
      </div>

      {/* Explore rows */}
      {openExplore && (
        <div style={{ border: "1px solid #dbeafe", borderRadius: 12, padding: 12, background: "#f8fbff" }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Explore {destinationCity}</h3>
          <div style={row}><strong>Know before you go:</strong>{explore.know.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Top sights:</strong>{explore.sights.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Parks & views:</strong>{explore.parks.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Museums:</strong>{explore.museums.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Family:</strong>{explore.family.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Nightlife:</strong>{explore.nightlife.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Guides:</strong>{explore.guides.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
        </div>
      )}

      {/* Savor rows */}
      {openSavor && (
        <div style={{ border: "1px solid #fce7f3", borderRadius: 12, padding: 12, background: "#fff0f7" }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Savor {destinationCity}</h3>
          <div style={row}><strong>Must-try:</strong>{savor.must.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Local favorites:</strong>{savor.local.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Street food:</strong>{savor.street.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Cafés & desserts:</strong>{savor.cafes.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Fine dining:</strong>{savor.fine.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
          <div style={row}><strong>Guides:</strong>{savor.guides.map((l:any)=> <a key={l.title} href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div>
        </div>
      )}
    </section>
  );
}
