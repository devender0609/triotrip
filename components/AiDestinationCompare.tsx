"use client";

import React, { useEffect, useMemo, useState } from "react";

type CompareCard = {
  title: string;
  budget: string;
  bestFor?: string;
  weather?: string;
  pros?: string[];
  cons?: string[];
  dining?: string;
  hotels?: string;
  nightlife?: string;
  family?: string;
  safety?: string;
  airports?: string;
  imageUrl?: string;
};

const PALETTE = [
  { accent: "#4F46E5", accent2: "#06B6D4" }, // indigo -> cyan
  { accent: "#10B981", accent2: "#22C55E" }, // emerald -> green
  { accent: "#F97316", accent2: "#EF4444" }, // orange -> red
  { accent: "#A855F7", accent2: "#EC4899" }, // purple -> pink
  { accent: "#3B82F6", accent2: "#60A5FA" }, // blue -> sky
];

function slugifyTitle(t: string) {
  return (t || "").trim();
}

/** Best-effort: Wikipedia city thumbnail (reliable), fallback to Unsplash skyline query */
async function resolveCityImage(place: string): Promise<string | null> {
  const q = (place || "").trim();
  if (!q) return null;

  // Try Wikipedia REST summary thumbnail first
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) {
      const j: any = await r.json();
      const thumb = j?.thumbnail?.source || j?.originalimage?.source;
      if (typeof thumb === "string" && thumb.startsWith("http")) return thumb;
    }
  } catch {}

  // Fallback to Unsplash Source (no key required)
  // "featured" sometimes returns unrelated; add skyline/landmark to reduce cars.
  const unsplash = `https://source.unsplash.com/1200x700/?${encodeURIComponent(q + " skyline landmark city")}`;
  return unsplash;
}

function softParseListBlock(text: string): string[] {
  if (!text) return [];
  // split bullets or newline lists
  return text
    .split(/\n|•|- /g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Accepts either:
 * - array of objects returned by your API, OR
 * - a big string blob with headings, and extracts best-effort fields.
 */
function normalizeComparePayload(payload: any): CompareCard[] {
  if (!payload) return [];

  // If API returns cards directly
  if (Array.isArray(payload)) {
    return payload.map((x) => ({
      title: String(x.title ?? x.destination ?? x.name ?? ""),
      budget: String(x.budget ?? x.cost ?? ""),
      bestFor: x.bestFor ?? x.best_for ?? "",
      weather: x.weather ?? "",
      pros: Array.isArray(x.pros) ? x.pros : softParseListBlock(String(x.pros ?? "")),
      cons: Array.isArray(x.cons) ? x.cons : softParseListBlock(String(x.cons ?? "")),
      dining: x.dining ?? x.food ?? x.eats ?? "",
      hotels: x.hotels ?? x.stay ?? x.areasToStay ?? "",
      nightlife: x.nightlife ?? "",
      family: x.family ?? x.familyFriendly ?? "",
      safety: x.safety ?? "",
      airports: x.airports ?? "",
      imageUrl: x.imageUrl ?? x.image_url ?? undefined,
    }));
  }

  // If API returns {results:[...]}
  if (Array.isArray(payload?.results)) return normalizeComparePayload(payload.results);

  // If API returns text, we do best-effort splitting on blank lines with a leading title
  const text = String(payload?.text ?? payload?.content ?? payload ?? "");
  const blocks = text.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
  const cards: CompareCard[] = [];

  // Try to detect "Title" blocks like: "Bali" then "Pros:" etc.
  let current: CompareCard | null = null;

  for (const b of blocks) {
    // A title-only block (single line) likely marks new card
    const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].length <= 40 && !/pros|cons|weather|dining|hotels|nightlife|family|safety/i.test(lines[0])) {
      if (current) cards.push(current);
      current = { title: lines[0], budget: "" };
      continue;
    }
    if (!current) current = { title: "Destination", budget: "" };

    // Extract budget label if present
    const budgetMatch = b.match(/(\$+)\s*·?\s*([A-Za-z -]{3,30})/);
    if (budgetMatch && !current.budget) current.budget = `${budgetMatch[1]} · ${budgetMatch[2].trim()}`;

    // Extract sections
    const grab = (label: string) => {
      const rx = new RegExp(label + "\\s*:\\s*([\\s\\S]+)$", "i");
      const m = b.match(rx);
      return m ? m[1].trim() : "";
    };

    const bestFor = grab("Best fo");
    if (bestFor) current.bestFor = bestFor;

    const weather = grab("Weathe");
    if (weather) current.weather = weather;

    if (/Pros\\s*:/i.test(b)) current.pros = softParseListBlock(grab("Pros"));
    if (/Cons\s*:/i.test(b)) current.cons = softParseListBlock(grab("Cons"));

    const dining = b.match(/DINING\s*&\s*LOCAL\s*EATS[\s\S]*?/i) ? b : "";
    if (/DINING\s*&\s*LOCAL\s*EATS/i.test(b)) current.dining = b.replace(/^DINING\s*&\s*LOCAL\s*EATS\s*/i, "").trim();

    if (/HOTELS\s*&\s*AREAS\s*TO\s*STAY/i.test(b)) current.hotels = b.replace(/^HOTELS\s*&\s*AREAS\s*TO\s*STAY\s*/i, "").trim();
    if (/ENTERTAINMENT\s*&\s*NIGHTLIFE/i.test(b)) current.nightlife = b.replace(/^ENTERTAINMENT\s*&\s*NIGHTLIFE\s*/i, "").trim();
    if (/FAMILY-?FRIENDLY/i.test(b)) current.family = b.replace(/^FAMILY-?FRIENDLY\s*/i, "").trim();
  }
  if (current) cards.push(current);

  return cards.filter((c) => c.title && c.title !== "Destination");
}

export default function AiDestinationCompare({ currency }: { currency?: string } = {}) {
  const [destinations, setDestinations] = useState("Bali, Thailand, Hawaii");
  const [month, setMonth] = useState("Decembe");
  const [days, setDays] = useState<number>(7);
  const [home, setHome] = useState("Austin, TX");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<CompareCard[]>([]);

  const places = useMemo(
    () =>
      destinations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [destinations]
  );

  async function onCompare() {
    setLoading(true);
    setError(null);

    try {
      // Use your existing API if present; fall back to client-side dummy if not.
      const r = await fetch("/api/ai/compare-destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinations: places, month, days, home }),
      });

      if (!r.ok) {
        // still show something rather than blank
        const t = await r.text();
        throw new Error(t || `Compare request failed (${r.status})`);
      }

      const j = await r.json();
      const normalized = normalizeComparePayload(j?.results ?? j);

      // Resolve images
      const withImages: CompareCard[] = await Promise.all(
        normalized.map(async (c, idx) => {
          const imageUrl = c.imageUrl || (await resolveCityImage(c.title));
          return { ...c, imageUrl: imageUrl || undefined };
        })
      );

      setCards(withImages);
    } catch (e: any) {
      setError(e?.message || "Compare request failed.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  // --- UI styles (colorful but still clean) ---
  const sCard: React.CSSProperties = {
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(10,15,28,0.92), rgba(4,8,16,0.92))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    overflow: "hidden",
  };

  const sInput: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    outline: "none",
  };

  const sLabel: React.CSSProperties = { fontWeight: 800, marginBottom: 8, display: "block" };

  const sBtn: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 999,
    border: "none",
    cursor: "pointe",
    background: "linear-gradient(90deg, #2dd4bf, #3b82f6, #a855f7, #ec4899)",
    color: "white",
    fontWeight: 900,
  };

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...sCard, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "cente", gap: 10, marginBottom: 8 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Compare destinations with AI</div>
          <div style={{ width: 10, height: 10, borderRadius: 99, background: "#22c55e", boxShadow: "0 0 0 4px rgba(34,197,94,0.15)" }} />
        </div>

        <div style={{ opacity: 0.9, marginBottom: 16 }}>
          Drop in a few places and we’ll compare them for cost, weather, food, hotels, nightlife, family-friendliness, safety,
          and the best airports to use. Images match the city you request.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1f", gap: 14 }}>
          <div>
            <label style={sLabel}>Destinations (comma-separated)</label>
            <input value={destinations} onChange={(e) => setDestinations(e.target.value)} style={sInput} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1f", gap: 12 }}>
            <div>
              <label style={sLabel}>Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={sInput}>
                {["January","February","March","April","May","June","July","August","Septembe","Octobe","Novembe","Decembe"].map((m) => (
                  <option key={m} value={m} style={{ color: "black" }}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={sLabel}>Days</label>
              <input type="numbe" min={1} value={days} onChange={(e) => setDays(Number(e.target.value || 1))} style={sInput} />
            </div>
            <div>
              <label style={sLabel}>Home city / airport</label>
              <input value={home} onChange={(e) => setHome(e.target.value)} style={sInput} />
            </div>
          </div>

          <button onClick={onCompare} style={sBtn} disabled={loading}>
            {loading ? "Comparing..." : "Compare these places"}
          </button>

          {error ? (
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>Compare failed</div>
              <div style={{ opacity: 0.95 }}>{error}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* RESULTS */}
      {cards.length > 0 ? (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {cards.map((c, idx) => {
            const colors = PALETTE[idx % PALETTE.length];
            return (
              <div key={slugifyTitle(c.title) + idx} style={{ ...sCard }}>
                {/* IMAGE */}
                {c.imageUrl ? (
                  <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                    <img
                      src={c.imageUrl}
                      alt={`${c.title} skyline`}
                      style={{ width: "100%", height: "100%", objectFit: "cove", display: "block" }}
                      loading="lazy"
                      onError={(e) => {
                        // Hard fallback: ensure it becomes a skyline query instead of random/blank
                        const img = e.currentTarget as HTMLImageElement;
                        const fallback = `https://source.unsplash.com/1200x700/?${encodeURIComponent(c.title + " skyline landmark")}`;
                        if (img.src !== fallback) img.src = fallback;
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.70))",
                      }}
                    />
                    <div style={{ position: "absolute", left: 14, bottom: 12, right: 14, display: "flex", alignItems: "cente", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 950, fontSize: 18 }}>{c.title}</div>
                      {c.budget ? (
                        <div
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: `1px solid ${colors.accent}`,
                            background: "rgba(0,0,0,0.35)",
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.budget}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 14, display: "flex", alignItems: "cente", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{c.title}</div>
                    {c.budget ? (
                      <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${colors.accent}`, fontWeight: 900 }}>{c.budget}</div>
                    ) : null}
                  </div>
                )}

                {/* BODY */}
                <div style={{ padding: 14 }}>
                  {c.bestFor ? (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontWeight: 900, color: colors.accent2 }}>Best for: </span>
                      <span style={{ opacity: 0.96 }}>{c.bestFor}</span>
                    </div>
                  ) : null}

                  {c.weather ? (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontWeight: 900, color: colors.accent2 }}>Weather: </span>
                      <span style={{ opacity: 0.96 }}>{c.weather}</span>
                    </div>
                  ) : null}

                  {c.pros?.length ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6, color: colors.accent2 }}>Pros</div>
                      <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 6 }}>
                        {c.pros.slice(0, 6).map((p, i) => (
                          <li key={i} style={{ opacity: 0.96 }}>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {c.cons?.length ? (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6, color: "#FCA5A5" }}>Cons</div>
                      <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 6 }}>
                        {c.cons.slice(0, 6).map((p, i) => (
                          <li key={i} style={{ opacity: 0.96 }}>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {c.dining ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6, color: colors.accent2 }}>Dining & local eats</div>
                      <div style={{ opacity: 0.96, lineHeight: 1.6 }}>{c.dining}</div>
                    </div>
                  ) : null}

                  {c.hotels ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6, color: colors.accent2 }}>Hotels & areas to stay</div>
                      <div style={{ opacity: 0.96, lineHeight: 1.6 }}>{c.hotels}</div>
                    </div>
                  ) : null}

                  {c.nightlife ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6, color: colors.accent2 }}>Entertainment & nightlife</div>
                      <div style={{ opacity: 0.96, lineHeight: 1.6 }}>{c.nightlife}</div>
                    </div>
                  ) : null}

                  {c.family ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 950, marginBottom: 6, color: colors.accent2 }}>Family-friendly</div>
                      <div style={{ opacity: 0.96, lineHeight: 1.6 }}>{c.family}</div>
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    height: 4,
                    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent2})`,
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
