'use client';
import React from 'react';
import { providerLinksFor } from '@/lib/providersLinks';

export type SubTab = 'explore' | 'savor' | 'misc' | 'compare';

export type Props = {
  city: string;
  originCountry?: string;
  destCountry?: string;
  active: Exclude<SubTab, 'compare'>; // we only render content for these
};

const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <div className="rounded-2xl ring-1 ring-slate-200 p-3 bg-white/90">
    <h4 className="font-semibold mb-2">{title}</h4>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const Pill: React.FC<{href: string; children: React.ReactNode}> = ({href, children}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center rounded-full px-3 py-1 text-sm ring-1 ring-slate-300 hover:ring-slate-400 bg-slate-50 hover:bg-white transition"
  >
    {children}
  </a>
);

function isInternational(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.toLowerCase() !== b.toLowerCase();
}

const ExploreSavorTabs: React.FC<Props> = ({ city, originCountry, destCountry, active }) => {
  const intl = isInternational(originCountry, destCountry);
  const p = providerLinksFor(intl);

  const grid = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-medium">
          {active.charAt(0).toUpperCase() + active.slice(1)} — {city || 'Destination'}
        </span>
      </div>

      {active === 'explore' && (
        <div className={grid}>
          <Section title="Top sights">
            <Pill href={p.maps(city, 'top sights')}>Google Maps</Pill>
            <Pill href={p.tripadvisor(city, 'Attractions')}>Tripadvisor</Pill>
            <Pill href={p.timeout(city)}>Time Out</Pill>
          </Section>

          <Section title="Parks & views">
            <Pill href={p.maps(city, 'parks')}>Google Maps</Pill>
            <Pill href={p.tripadvisor(city, 'Nature & Parks')}>Tripadvisor</Pill>
          </Section>

          <Section title="Museums">
            <Pill href={p.maps(city, 'museums')}>Google Maps</Pill>
            <Pill href={p.tripadvisor(city, 'Museums')}>Tripadvisor</Pill>
          </Section>

          <Section title="Family">
            <Pill href={p.maps(city, 'family activities')}>Google Maps</Pill>
            <Pill href={p.tripadvisor(city, 'Family & Kids')}>Tripadvisor</Pill>
          </Section>

          <Section title="Nightlife">
            <Pill href={p.maps(city, 'nightlife')}>Google Maps</Pill>
            <Pill href={p.tripadvisor(city, 'Nightlife')}>Tripadvisor</Pill>
            <Pill href={p.timeout(city, 'nightlife')}>Time Out</Pill>
          </Section>

          <Section title="Guides">
            <Pill href={p.wikivoyage(city)}>Wikivoyage</Pill>
            <Pill href={p.wikipedia(city)}>Wikipedia</Pill>
          </Section>
        </div>
      )}

      {active === 'savor' && (
        <div className={grid}>
          <Section title="Best restaurants">
            <Pill href={p.yelp(city, 'best restaurants')}>Yelp</Pill>
            <Pill href={p.openTable(city)}>OpenTable</Pill>
            {intl && <Pill href={p.michelin(city)}>Michelin</Pill>}
          </Section>

          <Section title="Local eats">
            <Pill href={p.yelp(city, 'local eats')}>Yelp</Pill>
            <Pill href={p.maps(city, 'local food')}>Google Maps</Pill>
          </Section>

          <Section title="Cafés & coffee">
            <Pill href={p.maps(city, 'coffee')}>Google Maps</Pill>
            <Pill href={p.yelp(city, 'coffee')}>Yelp</Pill>
          </Section>

          <Section title="Street food">
            <Pill href={p.maps(city, 'street food')}>Google Maps</Pill>
            <Pill href={p.yelp(city, 'street food')}>Yelp</Pill>
          </Section>

          {intl && (
            <Section title="Regional dining">
              <Pill href={p.zomato(city)}>Zomato</Pill>
              <Pill href={p.eazyDiner(city)}>EazyDiner</Pill>
            </Section>
          )}

          <Section title="Desserts">
            <Pill href={p.maps(city, 'desserts')}>Google Maps</Pill>
            <Pill href={p.yelp(city, 'desserts')}>Yelp</Pill>
          </Section>
        </div>
      )}

      {active === 'misc' && (
        <div className={grid}>
          <Section title="Know before you go">
            <Pill href={p.wikivoyage(city)}>Wikivoyage</Pill>
            <Pill href={p.wikipedia(city)}>Wikipedia</Pill>
            <Pill href={p.xe()}>XE currency</Pill>
            <Pill href={p.usStateDept(city)}>US State Dept</Pill>
          </Section>

          <Section title="Weather">
            <Pill href={p.weather(city)}>Weather</Pill>
          </Section>

          <Section title="Pharmacies">
            <Pill href={p.maps(city, 'pharmacies')}>Google Maps</Pill>
          </Section>

          <Section title="Car rental">
            <Pill href={p.cars(city)}>Search cars</Pill>
          </Section>
        </div>
      )}
    </div>
  );
};

export default ExploreSavorTabs;
