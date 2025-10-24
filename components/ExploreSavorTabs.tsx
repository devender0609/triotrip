"use client";

import React from "react";
import matrix from "../data/providers.json";
import { buildUrl, providersFor, isInternational } from "../lib/providerLinks";

type SubTab = "explore" | "savor" | "misc";

type Props = {
  city: string;
  originCountry?: string | null;
  destCountry?: string | null;
  mode: SubTab;
};

function Section({ title, items }: { title: string; items: React.ReactNode }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <div className="pills">{items}</div>
    </div>
  );
}

function Chip({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <a className="chip" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export default function ExploreSavorTabs({ city, originCountry, destCountry, mode }: Props) {
  const country = (destCountry || "US").toUpperCase();
  const international = isInternational(originCountry || undefined, destCountry || undefined);

  const ctx = (term: string) => ({ city, country, originCountry: originCountry || undefined, term });

  const renderGroup = (categoryKey: string, label: string, term: string) => {
    const provs = providersFor(matrix, categoryKey, ctx(term));
    return (
      <Section
        key={categoryKey}
        title={label}
        items={
          <>
            {provs.map((p: any) => (
              <Chip key={p.id} href={buildUrl(p.link, ctx(term))}>
                {p.label}
              </Chip>
            ))}
          </>
        }
      />
    );
  };

  return (
    <div className="wrap">
      <div className="heading">
        <span className={`dot ${mode === "explore" ? "green" : mode === "savor" ? "blue" : "amber"}`} />
        <strong className="title">
          {mode === "explore" ? "Explore" : mode === "savor" ? "Savor" : "Miscellaneous"} — {city}
        </strong>
        {international && <span className="intl">International</span>}
      </div>

      {mode === "explore" && (
        <div className="grid">
          {renderGroup("explore.top_sights", "Top sights", "top sights")}
          {renderGroup("explore.parks_views", "Parks & views", "parks viewpoints")}
          {renderGroup("explore.museums", "Museums", "museums")}
          {renderGroup("explore.family", "Family", "family activities")}
          {renderGroup("explore.nightlife", "Nightlife", "nightlife")}
          {/* Guides are under 'guides.*' keys; still shown on Explore like your original */}
          <Section
            title="Guides"
            items={
              <>
                {providersFor(matrix, "guides.wikivoyage", ctx("")).map((p: any) => (
                  <Chip key={p.id} href={buildUrl(p.link, ctx(city))}>
                    {p.label}
                  </Chip>
                ))}
                {providersFor(matrix, "guides.wikipedia", ctx("")).map((p: any) => (
                  <Chip key={p.id} href={buildUrl(p.link, ctx(city))}>
                    {p.label}
                  </Chip>
                ))}
              </>
            }
          />
        </div>
      )}

      {mode === "savor" && (
        <div className="grid">
          {renderGroup("savor.best_restaurants", "Best restaurants", "best restaurants")}
          {renderGroup("savor.local_eats", "Local eats", "local food")}
          {renderGroup("savor.cafes_coffee", "Cafés & coffee", "cafes coffee")}
          {renderGroup("savor.street_food", "Street food", "street food")}
          {renderGroup("savor.desserts", "Desserts", "desserts")}
          {international && renderGroup("savor.regional_dining", "Regional dining", "regional dining")}
        </div>
      )}

      {mode === "misc" && (
        <div className="grid">
          <Section
            title="Know before you go"
            items={
              <>
                {providersFor(matrix, "guides.wikivoyage", ctx("")).map((p: any) => (
                  <Chip key={p.id} href={buildUrl(p.link, ctx(city))}>
                    {p.label}
                  </Chip>
                ))}
                {providersFor(matrix, "guides.wikipedia", ctx("")).map((p: any) => (
                  <Chip key={p.id} href={buildUrl(p.link, ctx(city))}>
                    {p.label}
                  </Chip>
                ))}
                {providersFor(matrix, "misc.know", ctx("")).map((p: any) => (
                  <Chip key={p.id} href={buildUrl(p.link, ctx(city))}>
                    {p.label}
                  </Chip>
                ))}
              </>
            }
          />
          {renderGroup("misc.weather", "Weather", "weather")}
          {renderGroup("misc.pharmacies", "Pharmacies", "pharmacies")}
          {renderGroup("misc.car_rental", "Car rental", "car rental")}
        </div>
      )}

      <style jsx>{`
        .wrap { width: 100%; }
        .heading { display:flex; align-items:center; gap:8px; padding:6px 10px 14px 6px; }
        .title { font-size:16px; font-weight:800; color: var(--c-ink-strong, #0f172a); }
        .intl { margin-left: 8px; font-size: 12px; font-weight: 800; color: #2563eb; }
        .dot { width:10px; height:10px; border-radius:50%; display:inline-block; box-shadow:0 0 0 2px #fff; }
        .dot.green { background:#10b981; } .dot.blue { background:#3b82f6; } .dot.amber { background:#f59e0b; }
        .grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:16px; }
        @media (max-width:1100px){ .grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width:640px){ .grid{ grid-template-columns: 1fr; } }
        .card { background: var(--c-card,#fff); border:1px solid var(--c-line,#e2e8f0); border-radius:12px; padding:14px; }
        .card h4 { margin:0 0 10px; font-size:15px; font-weight:800; color: var(--c-ink-strong,#0f172a); }
        .pills { display:flex; flex-wrap:wrap; gap:10px; }
        .chip { display:inline-flex; align-items:center; padding:8px 12px; border:1px solid var(--c-line,#e2e8f0);
                border-radius:10px; background:#fff; text-decoration:none; color:var(--c-ink-strong,#0f172a);
                font-weight:700; box-shadow:0 1px 0 rgba(0,0,0,0.03); }
        .chip:hover { background:#f8fafc; }
      `}</style>
    </div>
  );
}