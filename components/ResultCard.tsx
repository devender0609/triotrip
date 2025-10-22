"use client";
import React from "react";

/* Airline sites for the alternate buttons */
const AIRLINE_SITE: Record<string, string> = {
  American: "https://www.aa.com",
  "American Airlines": "https://www.aa.com",
  Delta: "https://www.delta.com",
  "Delta Air Lines": "https://www.delta.com",
  United: "https://www.united.com",
  "United Airlines": "https://www.united.com",
  Alaska: "https://www.alaskaair.com",
  "Alaska Airlines": "https://www.alaskaair.com",
  Southwest: "https://www.southwest.com",
  JetBlue: "https://www.jetblue.com",
  Lufthansa: "https://www.lufthansa.com",
  Qatar: "https://www.qatarairways.com",
  Emirates: "https://www.emirates.com",
  "Air France": "https://wwws.airfrance.us",
  KLM: "https://www.klm.com",
  ANA: "https://www.ana.co.jp",
  JAL: "https://www.jal.co.jp",
  "British Airways": "https://www.britishairways.com",
};

type ResultCardProps = {
  pkg: any;
  index?: number;
  compared?: boolean;
  onToggleCompare?: (id: string) => void;
  currency?: string;

  /** Optional props your page passes — now supported */
  pax?: number;
  comparedIds?: string[];
  onSavedChangeGlobal?: (count: any) => void;
  large?: boolean;
  showHotel?: boolean; // when false, hide hotel panel even if pkg.hotels exist
};

export default function ResultCard({
  pkg,
  index = 0,
  compared,
  onToggleCompare,
  currency,

  pax,
  comparedIds,
  onSavedChangeGlobal, // currently unused; accepted to satisfy call sites
  large,                // currently unused; accepted to satisfy call sites
  showHotel,            // when false, hide hotels panel
}: ResultCardProps) {
  const id =
    pkg?.id ||
    `pkg-${pkg?.origin || ""}-${pkg?.destination || ""}-${pkg?.departDate || ""}-${pkg?.returnDate || ""}-${index}`;

  const adults = Number(pkg.passengersAdults ?? pkg.adults ?? 1) || 1;
  const children = Number(pkg.passengersChildren ?? pkg.children ?? 0) || 0;
  const infants = Number(pkg.passengersInfants ?? pkg.infants ?? 0) || 0;
  let totalPax = Math.max(1, adults + children + infants);
  if (typeof pax === "number" && isFinite(pax) && pax > 0) totalPax = Math.round(pax);

  /* flights */
  const outSegs: any[] = Array.isArray(pkg?.flight?.segments)
    ? pkg.flight.segments
    : pkg.flight?.segments_out || [];
  const inSegs: any[] = Array.isArray(pkg?.returnFlight?.segments)
    ? pkg.returnFlight.segments
    : pkg.flight?.segments_in || [];

  const out0 = outSegs?.[0];
  const in0 = inSegs?.[0];

  const from = (out0?.from || pkg.origin || "").toUpperCase();
  const to = (outSegs?.[outSegs.length - 1]?.to || pkg.destination || "").toUpperCase();
  const dateOut = (out0?.depart_time || "").slice(0, 10);
  const dateRet = (in0?.depart_time || "").slice(0, 10);
  const route = `${from}-${to}`;

  const airline = pkg.flight?.carrier_name || pkg.flight?.carrier || pkg.airline || "";

  const priceRaw =
    (typeof pkg?.total_cost_converted === "number" && pkg.total_cost_converted) ||
    (typeof pkg?.total_cost === "number" && pkg.total_cost) ||
    (typeof pkg?.flight?.price_usd_converted === "number" && pkg.flight.price_usd_converted) ||
    (typeof pkg?.flight?.price_usd === "number" && pkg.flight.price_usd) ||
    (typeof pkg?.flight_total === "number" && pkg.flight_total) ||
    0;

  const priceFmt =
    (pkg?.currency || currency || "USD") +
    " " +
    (Number.isFinite(priceRaw) ? Math.round(priceRaw).toLocaleString() : "—");

  const TRIOTRIP_BOOK_PATH =
    process.env.NEXT_PUBLIC_TRIOTRIP_BOOK_PATH || "/checkout";

  /* ----------------- helpers ----------------- */
  function ensureHttps(u?: string | null) {
    if (!u) return "";
    let s = String(u).trim();
    if (!s) return "";
    if (s.startsWith("//")) s = "https:" + s;
    if (s.startsWith("http://"))
      s = s.replace(/^http:\/\//i, "https://");
    return s;
  }
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++)
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  function layoverMinutes(a?: string, b?: string) {
    if (!a || !b) return 0;
    const A = new Date(a).getTime();
    const B = new Date(b).getTime();
    return Math.max(0, Math.round((B - A) / 60000));
  }
  function fmtTime(t?: string) {
    if (!t) return "";
    return new Date(t).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  function fmtDur(mins?: number) {
    if (!mins && mins !== 0) return "";
    const h = Math.floor((mins as number) / 60);
    const m = Math.floor((mins as number) % 60);
    return `${h}h ${m}m`;
  }

  // --- HOTEL HELPERS ---
  function hotelStars(h: any) {
    const v = h?.stars ?? h?.starRating ?? h?.star ?? h?.category;
    if (typeof v === "number") return Math.max(0, Math.min(5, Math.round(v)));
    if (typeof v === "string") {
      const m = v.match(/\d(\.\d)?/);
      return m ? Math.max(0, Math.min(5, Math.round(parseFloat(m[0])))) : undefined;
    }
    return undefined;
  }
  function hotelPriceRange(h: any, currencyFallback?: string) {
    const cand = [h?.priceRange, h?.price_range];
    for (const c of cand) if (typeof c === "string" && c.trim()) return c.trim();

    const num = (x: any) => (typeof x === "number" && isFinite(x) ? x : undefined);
    const min =
      num(h?.priceMin ?? h?.minPrice ?? h?.lowRate ?? h?.price_from ?? h?.price_low ?? h?.minRate ?? h?.from);
    const max =
      num(h?.priceMax ?? h?.maxPrice ?? h?.highRate ?? h?.price_to ?? h?.price_high ?? h?.maxRate ?? h?.to);
    const one = num(h?.price ?? h?.rate ?? h?.nightly ?? h?.avgPrice);
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    const cur = (pkg?.currency || currency || currencyFallback || "USD");

    if (min != null && max != null) return `${cur} ${fmt(min)}–${fmt(max)}`;
    if (min != null) return `${cur} from ${fmt(min)}`;
    if (max != null) return `${cur} up to ${fmt(max)}`;
    if (one != null) return `${cur} ~${fmt(one)}`;
    return "";
  }
  // --- END HOTEL HELPERS ---

  /* ----------------- google flights deep link ----------------- */
  const googleFlights = (() => {
    const seg =
      from && to && dateOut
        ? `${from}.${to}.${dateOut.replace(/-/g, "")}`
        : "";
    const segR =
      from && to && dateRet
        ? `${to}.${from}.${dateRet.replace(/-/g, "")}`
        : "";
    const cur = `;c:${pkg?.currency || currency || "USD"}`;
    const hash = seg
      ? `#flt=${seg}${segR ? "*" + segR : ""}${cur};sd:1;tt:o`
      : "";
    return `https://www.google.com/travel/flights${hash}`;
  })();

  /* ----------------- hotel links ----------------- */
  function hotelPrimaryLink(h: any, cityFallback: string) {
    const official = ensureHttps(h?.website || h?.officialUrl || h?.url);
    if (official) return official;

    const city = h?.city || cityFallback || pkg?.destination || "";
    const q = h?.name ? `${h.name}, ${city}` : city;

    const b = new URL("https://www.booking.com/searchresults.html");
    if (q) b.searchParams.set("ss", q);
    if (pkg?.hotelCheckIn) b.searchParams.set("checkin", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) b.searchParams.set("checkout", pkg.hotelCheckOut);
    b.searchParams.set("group_adults", String(Math.max(1, totalPax)));
    if (totalPax > 1) b.searchParams.set("no_rooms", "1");
    b.searchParams.set("selected_currency", pkg.currency || currency || "USD");
    return b.toString();
  }
  function hotelAltLinks(h: any, cityFallback: string) {
    const city = h?.city || cityFallback || pkg?.destination || "";
    const destName = h?.name ? `${h.name}, ${city}` : city;

    const exp = new URL("https://www.expedia.com/Hotel-Search");
    if (destName) exp.searchParams.set("destination", destName);
    if (pkg?.hotelCheckIn) exp.searchParams.set("startDate", pkg.hotelCheckIn);
    if (pkg?.hotelCheckOut) exp.searchParams.set("endDate", pkg.hotelCheckOut);

    const hotels = new URL("https://www.hotels.com/Hotel-Search");
    if (destName) hotels.searchParams.set("destination", destName);

    const maps = new URL("https://www.google.com/maps/search/");
    if (destName) maps.searchParams.set("q", destName);

    return {
      expedia: exp.toString(),
      hotels: hotels.toString(),
      maps: maps.toString(),
    };
  }
  function hotelImg(h: any, i?: number) {
    const candidate =
      ensureHttps(h?.imageUrl || h?.image || h?.photo || "") ||
      (h?.optimizedThumbUrls &&
        ensureHttps(h.optimizedThumbUrls.srpDesktop || h.optimizedThumbUrls.srpMobile)) ||
      "";
    if (candidate) return candidate;

    const city =
      h?.city ||
      h?.location?.city ||
      h?.address?.city ||
      h?.cityName ||
      pkg?.destination ||
      pkg?.to ||
      pkg?.arrivalCity ||
      "";

    const seedParts = [
      h?.id || "",
      h?.name || "",
      city || "",
      h?.address?.line1 || h?.address || "",
      typeof h?.lat === "number" && typeof h?.lng === "number" ? `${h.lat},${h.lng}` : "",
      typeof i === "number" ? `idx:${i}` : "",
    ];
    const lock = hash(seedParts.filter(Boolean).join("|")) % 1_000_000;
    return `https://picsum.photos/seed/${lock}/400/250`;
  }

  // derive compared state if not passed
  const isCompared = compared || (comparedIds ? comparedIds.includes(id) : false);

  const wrapStyle: React.CSSProperties = {
    display: "grid",
    gap: 12,
    border: isCompared ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "linear-gradient(180deg,#ffffff,#f6fbff)",
    boxShadow: "0 8px 20px rgba(2,6,23,.06)",
    cursor: onToggleCompare ? "pointer" : "default",
  };

  return (
    <section
      className={`result-card ${isCompared ? "result-card--compared" : ""}`}
      style={wrapStyle}
      onClick={() => onToggleCompare?.(id)}
    >
      {/* Header + quick actions */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 700, color: "#0f172a" }}>
          Option {index + 1} • {route} {dateOut ? `• ${dateOut}` : ""}{" "}
          {pkg.roundTrip && dateRet ? `↩ ${dateRet}` : ""}{" "}
          {airline ? `• ${airline}` : ""}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Price */}
          <div
            style={{
              fontWeight: 900,
              color: "#0b3b52",
              background: "#f0f7ff",
              border: "1px solid #cfe3ff",
              borderRadius: 10,
              padding: "6px 10px",
            }}
          >
            💵 {priceFmt}
          </div>

          {/* Action links */}
          {airline && (
            <a
              className="book-link"
              href={AIRLINE_SITE[airline] || `https://www.google.com/search?q=${encodeURIComponent(airline + " booking")}`}
              target="_blank"
              rel="noreferrer"
            >
              Airline
            </a>
          )}
          <a className="book-link" href={googleFlights} target="_blank" rel="noreferrer">
            Google Flights
          </a>
          <a
            className="book-link"
            href={`${TRIOTRIP_BOOK_PATH}?pkg=${encodeURIComponent(id)}`}
          >
            Book via TrioTrip
          </a>
        </div>
      </header>

      {/* Outbound */}
      {outSegs.length > 0 && (
        <div
          style={{
            border: "1px solid #cfe3ff",
            borderRadius: 12,
            padding: 10,
            background: "linear-gradient(180deg,#ffffff,#eef6ff)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600, color: "#0b3b52" }}>
            Outbound {dateOut ? `• ${dateOut}` : ""}
          </div>
          {outSegs.map((s: any, i: number) => (
            <React.Fragment key={`o${i}`}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {s.from} → {s.to}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {fmtDur(s.duration_minutes)}
                </div>
              </div>

              {i < outSegs.length - 1 && (
                <div style={{ display: "grid", placeItems: "center" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      border: "2px dashed #5b728a",
                      background: "#fff",
                      color: "#0f172a",
                      borderRadius: 999,
                      fontSize: 14,
                      boxShadow: "0 4px 10px rgba(2,6,23,.06)",
                    }}
                  >
                    ⏱️ Layover in{" "}
                    <strong style={{ marginLeft: 4 }}>{s.to}</strong>
                    <span style={{ opacity: 0.7 }}>•</span>
                    {(() => {
                      const mins = layoverMinutes(
                        s.arrive_time,
                        outSegs[i + 1].depart_time
                      );
                      return (
                        <strong>
                          {Math.floor(mins / 60)}h {mins % 60}m
                        </strong>
                      );
                    })()}
                    <span style={{ opacity: 0.7, marginLeft: 8 }}>•</span>
                    Next departs{" "}
                    <strong>{fmtTime(outSegs[i + 1].depart_time)}</strong>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Return */}
      {inSegs.length > 0 && (
        <div
          style={{
            border: "1px solid #cfe3ff",
            borderRadius: 12,
            padding: 10,
            background: "linear-gradient(180deg,#ffffff,#eef6ff)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600, color: "#0b3b52" }}>
            Return {dateRet ? `• ${dateRet}` : ""}
          </div>
          {inSegs.map((s: any, i: number) => (
            <React.Fragment key={`i${i}`}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {s.from} → {s.to}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {fmtTime(s.depart_time)} – {fmtTime(s.arrive_time)}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {fmtDur(s.duration_minutes)}
                </div>
              </div>

              {i < inSegs.length - 1 && (
                <div style={{ display: "grid", placeItems: "center" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      border: "2px dashed #5b728a",
                      background: "#fff",
                      color: "#0f172a",
                      borderRadius: 999,
                      fontSize: 14,
                      boxShadow: "0 4px 10px rgba(2,6,23,.06)",
                    }}
                  >
                    ⏱️ Layover in{" "}
                    <strong style={{ marginLeft: 4 }}>{s.to}</strong>
                    <span style={{ opacity: 0.7 }}>•</span>
                    {(() => {
                      const mins = layoverMinutes(
                        s.arrive_time,
                        inSegs[i + 1].depart_time
                      );
                      return (
                        <strong>
                          {Math.floor(mins / 60)}h {mins % 60}m
                        </strong>
                      );
                    })()}
                    <span style={{ opacity: 0.7, marginLeft: 8 }}>•</span>
                    Next departs{" "}
                    <strong>{fmtTime(inSegs[i + 1].depart_time)}</strong>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Hotels (unlimited) */}
      {showHotel !== false && Array.isArray(pkg.hotels) && pkg.hotels.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 8,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 10,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 600, color: "#0b3b52" }}>
            Hotels
          </div>
          {pkg.hotels.map((h: any, i: number) => {
            const city = h?.city || pkg?.destination || "";
            const primary = hotelPrimaryLink(h, city);
            const alt = hotelAltLinks(h, city);
            const img = hotelImg(h, i);
            return (
              <div
                key={`h${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 10,
                  alignItems: "center",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 10,
                  background: "#fff",
                }}
              >
                <a
                  href={primary}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: 160,
                    height: 100,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#f1f5f9",
                    display: "block",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={h?.name || "Hotel"}
                    loading="lazy"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      t.onerror = null;
                      const seed =
                        hash(`${h?.name || ""}|${city}|${i}`) % 1_000_000;
                      t.src = `https://picsum.photos/seed/${seed}/400/250`;
                    }}
                    style={{
                      width: 160,
                      height: 100,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </a>
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <a
                      href={primary}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        textDecoration: "none",
                      }}
                    >
                      {h?.name || "Hotel"}
                    </a>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a
                        className="book-link book-link--booking"
                        href={primary}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Booking
                      </a>
                      <a
                        className="book-link book-link--expedia"
                        href={alt.expedia}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Expedia
                      </a>
                      <a
                        className="book-link book-link--hotels"
                        href={alt.hotels}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Hotels
                      </a>
                      <a
                        className="book-link book-link--maps"
                        href={alt.maps}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Map
                      </a>
                    </div>
                  </div>

                  {/* star + price range line */}
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {(() => {
                      const s = hotelStars(h);
                      return s
                        ? `${"★".repeat(s)}${"☆".repeat(5 - s)} (${s}★)`
                        : "";
                    })()}
                    {(() => {
                      const pr = hotelPriceRange(h, pkg?.currency || currency || "USD");
                      return pr ? ` • ${pr}` : "";
                    })()}
                  </div>

                  <div style={{ color: "#475569", fontSize: 13 }}>
                    {h?.address || h?.city || city}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
