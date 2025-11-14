import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type SortKey = "best" | "cheapest" | "fastest" | "flexible";
type SortBasis = "flightOnly" | "bundle";

type Seg = {
  from: string;
  to: string;
  depart_time: string;   // ISO
  arrive_time: string;   // ISO
  duration_minutes: number;
};

type FlightBlock = {
  carrier_name: string;
  cabin: Cabin;
  stops: number;
  refundable: boolean;
  greener: boolean;
  price_usd: number;
  segments_out: Seg[];
  segments_in?: Seg[];
  duration_minutes: number;
  deeplinks?: Record<string, unknown>;
};

type PricedHotel = {
  name: string;
  star: number;
  city: string;
  price_converted: number;
  currency: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  deeplinks?: Record<string, unknown>;
};

type Hotel = PricedHotel | { filteredOutByStar: true };

type Candidate = {
  id: string;
  currency: string;
  flight: FlightBlock;
  hotel?: Hotel;          // primary (used for pricing)
  hotels?: PricedHotel[]; // list for UI (top 3)
  deeplinks?: Record<string, unknown>;
  // UI context for hotel deep links
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  passengers?: number;
  passengersAdults?: number;
  passengersChildren?: number;
  passengersChildrenAges?: number[];
};

type ResultItem = Candidate & {
  flight_total: number;
  hotel_total: number;
  total_cost: number;
  display_total: number;
};

type SearchPayload = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  roundTrip: boolean;

  passengers: number;
  passengersAdults: number;
  passengersChildren: number;
  passengersInfants: number;
  passengersChildrenAges?: number[];

  cabin: Cabin;

  includeHotel: boolean;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  nights?: number;
  minHotelStar?: number;

  minBudget?: number;
  maxBudget?: number;
  currency: string;
  sort: SortKey;
  maxStops?: 0 | 1 | 2;
  refundable?: boolean;
  greener?: boolean;

  sortBasis?: SortBasis;
};

function assertString(v: any): v is string {
  return typeof v === "string" && v.length > 0;
}
function num(v: any): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function sumSegMinutes(segs: Seg[]): number {
  return segs.reduce((t, s) => t + (Number(s?.duration_minutes) || 0), 0);
}
function basePrice(origin: string, destination: string, date: string) {
  const seed = (s: string) =>
    s.split("").reduce((a, c) => (a * 33 + c.charCodeAt(0)) % 9973, 7);
  const v = seed(origin + destination + date);
  return 120 + (v % 160); // 120–279
}

/** airline URLs (fallback to homepage) */
function airlineUrl(
  carrier: string,
  origin: string,
  destination: string,
  departDate: string,
  roundTrip: boolean,
  returnDate?: string,
  opts?: { cabin?: string; adults?: number; children?: number }
) {
  const d = departDate; // yyyy-mm-dd
  const r = returnDate;
  const c = carrier.toLowerCase();
  const trip = roundTrip ? "roundTrip" : "oneWay";
  const adt = Math.max(1, opts?.adults ?? 1);
  const chd = Math.max(0, opts?.children ?? 0);
  const cabin = (opts?.cabin || "ECONOMY").toUpperCase();

  // United
  if (c.includes("united")) {
    const u = new URL("https://www.united.com/en-us/flight-search");
    u.searchParams.set("from", origin);
    u.searchParams.set("to", destination);
    u.searchParams.set("trip", trip);
    u.searchParams.set("depDate", d);
    if (roundTrip && r) u.searchParams.set("retDate", r);
    u.searchParams.set("cabin", cabin);
    u.searchParams.set("adults", String(adt));
    if (chd) u.searchParams.set("children", String(chd));
    return u.toString();
  }

  // American
  if (c.includes("american")) {
    const u = new URL("https://www.aa.com/booking/find-flights");
    u.searchParams.set("tripType", trip);
    u.searchParams.set("from", origin);
    u.searchParams.set("to", destination);
    u.searchParams.set("departDate", d);
    if (roundTrip && r) u.searchParams.set("returnDate", r);
    u.searchParams.set("cabin", cabin);
    u.searchParams.set("adults", String(adt));
    if (chd) u.searchParams.set("children", String(chd));
    return u.toString();
  }

  // Delta
  if (c.includes("delta")) {
    const u = new URL("https://www.delta.com/flight-search/book-a-flight");
    u.searchParams.set("tripType", trip);
    u.searchParams.set("fromCity", origin);
    u.searchParams.set("toCity", destination);
    u.searchParams.set("departureDate", d);
    if (roundTrip && r) u.searchParams.set("returnDate", r);
    u.searchParams.set("cabin", cabin);
    u.searchParams.set("adults", String(adt));
    if (chd) u.searchParams.set("children", String(chd));
    return u.toString();
  }

  // Fallback
  return `https://www.${carrier.replace(/\s+/g, "").toLowerCase()}.com/`;
}

function attachAirlineLink(pkg: Candidate, p: SearchPayload): Candidate {
  const carrier = pkg?.flight?.carrier_name;
  if (!carrier) return pkg;
  const url = airlineUrl(
    carrier,
    p.origin,
    p.destination,
    p.departDate,
    p.roundTrip,
    p.returnDate,
    {
      cabin: p.cabin,
      adults: p.passengersAdults ?? p.passengers,
      children: p.passengersChildren
    }
  );
  return {
    ...pkg,
    deeplinks: { ...(pkg.deeplinks || {}), airline: { name: carrier, url } },
    flight: {
      ...pkg.flight,
      deeplinks: { ...(pkg.flight.deeplinks || {}), airline: { name: carrier, url } },
    },
  };
}

function buildSegments(p: SearchPayload) {
  const { origin, destination, departDate, returnDate, roundTrip } = p;

  const directOut: Seg[] = [
    { from: origin, to: destination, depart_time: `${departDate}T08:10`, arrive_time: `${departDate}T10:55`, duration_minutes: 165 },
  ];
  const oneStopOut_A: Seg[] = [
    { from: origin, to: "CLT", depart_time: `${departDate}T06:00`, arrive_time: `${departDate}T07:45`, duration_minutes: 105 },
    { from: "CLT", to: destination, depart_time: `${departDate}T08:50`, arrive_time: `${departDate}T10:35`, duration_minutes: 105 },
  ];
  const oneStopOut_B: Seg[] = [
    { from: origin, to: "ORD", depart_time: `${departDate}T09:00`, arrive_time: `${departDate}T10:30`, duration_minutes: 90 },
    { from: "ORD", to: destination, depart_time: `${departDate}T11:20`, arrive_time: `${departDate}T13:15`, duration_minutes: 115 },
  ];
  const twoStopOut: Seg[] = [
    { from: origin, to: "DEN", depart_time: `${departDate}T05:40`, arrive_time: `${departDate}T07:15`, duration_minutes: 95 },
    { from: "DEN", to: "PHX", depart_time: `${departDate}T08:20`, arrive_time: `${departDate}T10:05`, duration_minutes: 105 },
    { from: "PHX", to: destination, depart_time: `${departDate}T11:10`, arrive_time: `${departDate}T13:05`, duration_minutes: 115 },
  ];

  const directIn: Seg[] | undefined = roundTrip
    ? [{ from: destination, to: origin, depart_time: `${returnDate}T17:40`, arrive_time: `${returnDate}T20:20`, duration_minutes: 160 }]
    : undefined;
  const oneStopIn: Seg[] | undefined = roundTrip
    ? [
        { from: destination, to: "CLT", depart_time: `${returnDate}T18:15`, arrive_time: `${returnDate}T19:55`, duration_minutes: 100 },
        { from: "CLT", to: origin, depart_time: `${returnDate}T21:00`, arrive_time: `${returnDate}T22:45`, duration_minutes: 105 },
      ]
    : undefined;

  return { directOut, oneStopOut_A, oneStopOut_B, twoStopOut, directIn, oneStopIn };
}

function buildCandidates(p: SearchPayload): Candidate[] {
  const { cabin, currency } = p;
  const { directOut, oneStopOut_A, oneStopOut_B, twoStopOut, directIn, oneStopIn } = buildSegments(p);
  const bp = basePrice(p.origin, p.destination, p.departDate);

  const base: Candidate[] = [
    {
      id: "CAND-1",
      currency,
      flight: {
        carrier_name: "United",
        cabin, stops: 0, refundable: true, greener: true,
        price_usd: Math.round(bp + 60),
        segments_out: directOut, ...(directIn ? { segments_in: directIn } : {}),
        duration_minutes: sumSegMinutes(directOut) + (directIn ? sumSegMinutes(directIn) : 0),
      },
    },
    {
      id: "CAND-2",
      currency,
      flight: {
        carrier_name: "American",
        cabin, stops: 1, refundable: false, greener: false,
        price_usd: Math.round(bp - 30),
        segments_out: oneStopOut_A, ...(oneStopIn ? { segments_in: oneStopIn } : {}),
        duration_minutes: sumSegMinutes(oneStopOut_A) + (oneStopIn ? sumSegMinutes(oneStopIn) : 0),
      },
    },
    {
      id: "CAND-3",
      currency,
      flight: {
        carrier_name: "Delta",
        cabin, stops: 2, refundable: true, greener: false,
        price_usd: Math.round(bp + 10),
        segments_out: twoStopOut, ...(oneStopIn ? { segments_in: oneStopIn } : {}),
        duration_minutes: sumSegMinutes(twoStopOut) + (oneStopIn ? sumSegMinutes(oneStopIn) : 0),
      },
    },
    {
      id: "CAND-4",
      currency,
      flight: {
        carrier_name: "Alaska",
        cabin, stops: 1, refundable: true, greener: true,
        price_usd: Math.round(bp + 5),
        segments_out: oneStopOut_B, ...(oneStopIn ? { segments_in: oneStopIn } : {}),
        duration_minutes: sumSegMinutes(oneStopOut_B) + (oneStopIn ? sumSegMinutes(oneStopIn) : 0),
      },
    },
    {
      id: "CAND-5",
      currency,
      flight: {
        carrier_name: "JetBlue",
        cabin, stops: 0, refundable: false, greener: false,
        price_usd: Math.round(bp + 35),
        segments_out: directOut, ...(directIn ? { segments_in: directIn } : {}),
        duration_minutes: sumSegMinutes(directOut) + (directIn ? sumSegMinutes(directIn) : 0),
      },
    },
    {
      id: "CAND-6",
      currency,
      flight: {
        carrier_name: "Southwest",
        cabin, stops: 1, refundable: false, greener: true,
        price_usd: Math.round(bp - 10),
        segments_out: oneStopOut_A, ...(oneStopIn ? { segments_in: oneStopIn } : {}),
        duration_minutes: sumSegMinutes(oneStopOut_A) + (oneStopIn ? sumSegMinutes(oneStopIn) : 0),
      },
    },
  ];

  // attach airline deeplinks
  let candidates = base.map((c) => attachAirlineLink(c, p));

  // Context for hotel deep-links on UI
  const hotelCheckIn = p.hotelCheckIn || p.departDate || undefined;
  const hotelCheckOut = p.hotelCheckOut || p.returnDate || undefined;
  candidates = candidates.map((c) => ({
    ...c,
    hotelCheckIn,
    hotelCheckOut,
    passengers: p.passengers,
    passengersAdults: p.passengersAdults,
    passengersChildren: p.passengersChildren,
    passengersChildrenAges: p.passengersChildrenAges,
  }));

  // Add hotels only when requested: always 3 options with variety
  if (p.includeHotel) {
    const nights = Math.max(1, p.nights ?? 1);
    const starTarget = p.minHotelStar ?? 0;
    const hotelBase = 95 + (bp % 60); // per night
    const city = p.destination;

    const names = [
      "Downtown Inn",
      "Airport Suites",
      "Central Plaza",
      "Cityline Hotel",
      "Grand Quarter",
      "Harbor View",
      "Lakeside Crown",
      "Skyline Court"
    ];

    candidates.forEach((c, i) => {
      const three: PricedHotel[] = [0, 1, 2].map((k) => {
        const star = Math.min(5, Math.max(3, ((i + k) % 3) + 3)); // 3–5★
        const price = Math.round(hotelBase * nights * (1 + k * 0.12 + (i % 2 ? 0.04 : 0)));
        const imageUrl = `https://source.unsplash.com/featured/600x360/?hotel,${encodeURIComponent(city)}`;
        return {
          name: names[(i + k) % names.length],
          star,
          city,
          price_converted: price,
          currency: c.currency,
          imageUrl,
          deeplinks: { booking: true, hotels: true, expedia: true },
        };
      });

      const meeting = three.filter((h) => h.star >= starTarget);
      const primary = (meeting.length ? meeting : three).slice().sort((a, b) => a.price_converted - b.price_converted)[0];

      c.hotels = three;
      c.hotel = primary;
    });
  }

  return candidates;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchPayload;

    // Basic validation
    if (!assertString(body.origin) || !assertString(body.destination)) {
      return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
    }
    if (!assertString(body.departDate)) {
      return NextResponse.json({ error: "Departure date is required." }, { status: 400 });
    }
    if (body.roundTrip && !assertString(body.returnDate || "")) {
      return NextResponse.json({ error: "Return date is required for round-trip." }, { status: 400 });
    }

    const sortBasis: SortBasis = body.sortBasis === "bundle" ? "bundle" : "flightOnly";

    let results: ResultItem[] = buildCandidates(body).map((c) => {
      const flight_total = c.flight?.price_usd ?? 0;

      let hotel_total = 0;
      if (body.includeHotel && c.hotel && "price_converted" in c.hotel) {
        hotel_total = c.hotel.price_converted ?? 0;
      }

      const bundle_total = Math.round(flight_total + hotel_total);

      return {
        ...c,
        flight_total,
        hotel_total,
        total_cost: bundle_total,                                           // used by cards
        display_total: sortBasis === "bundle" ? bundle_total : flight_total // used for sort
      };
    });

    // filters
    if (body.refundable) results = results.filter((c) => c.flight?.refundable);
    if (body.greener) results = results.filter((c) => c.flight?.greener);
    if (typeof body.maxStops === "number")
      results = results.filter((c) => (c.flight?.stops ?? 99) <= body.maxStops!);

    // budgets (use total_cost which already reflects hotel if included)
    if (num(body.minBudget) !== undefined)
      results = results.filter((c) => c.total_cost >= (body.minBudget as number));
    if (num(body.maxBudget) !== undefined)
      results = results.filter((c) => c.total_cost <= (body.maxBudget as number));

    // sort
    const key = body.sort || "best";
    if (key === "cheapest") {
      results.sort((a, b) => a.display_total - b.display_total);
    } else if (key === "fastest") {
      results.sort(
        (a, b) => (a.flight?.duration_minutes ?? 1e9) - (b.flight?.duration_minutes ?? 1e9)
      );
    } else if (key === "flexible") {
      results.sort((a, b) => {
        const ra = a.flight?.refundable ? 0 : 1;
        const rb = b.flight?.refundable ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return a.display_total - b.display_total;
      });
    } else {
      results.sort((a, b) => {
        const as = a.display_total * 1.0 + (a.flight?.duration_minutes ?? 1e9) * 0.2;
        const bs = b.display_total * 1.0 + (b.flight?.duration_minutes ?? 1e9) * 0.2;
        return as - bs;
      });
    }

    const hotelWarning =
      body.includeHotel && !body.nights ? "Using 1 night by default for hotel pricing." : null;

    // If Include hotel is OFF: remove hotels array and hotel_total, keep flight-only totals (UI still has context dates for later)
    if (!body.includeHotel) {
      results = results.map((r) => ({
        id: r.id,
        currency: r.currency,
        flight: r.flight,
        deeplinks: r.deeplinks,
        hotelCheckIn: r.hotelCheckIn,
        hotelCheckOut: r.hotelCheckOut,
        passengers: r.passengers,
        passengersAdults: r.passengersAdults,
        passengersChildren: r.passengersChildren,
        passengersChildrenAges: r.passengersChildrenAges,
        flight_total: r.flight_total,
        hotel_total: 0,
        total_cost: r.flight_total,
        display_total: r.display_total ?? r.flight_total,
      })) as ResultItem[];
    }

    return NextResponse.json({ results, hotelWarning, sortBasis });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Search failed" }, { status: 500 });
  }
}
