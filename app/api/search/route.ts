// app/api/search/route.ts
import { NextResponse } from "next/server";
import { amadeusGet } from "@/lib/amadeusClient";

export const dynamic = "force-dynamic";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

type SearchBody = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  roundTrip?: boolean;
  passengersAdults: number;
  passengersChildren: number;
  passengersInfants: number;
  cabin: Cabin;
  includeHotel?: boolean;
  currency?: string;
};

function parseIsoDurationToMinutes(dur: string | undefined): number {
  if (!dur || !dur.startsWith("PT")) return 0;
  let hours = 0;
  let minutes = 0;
  const hMatch = dur.match(/(\d+)H/);
  if (hMatch) hours = parseInt(hMatch[1], 10);
  const mMatch = dur.match(/(\d+)M/);
  if (mMatch) minutes = parseInt(mMatch[1], 10);
  return hours * 60 + minutes;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchBody;

    const {
      origin,
      destination,
      departDate,
      returnDate,
      roundTrip = true,
      passengersAdults,
      passengersChildren,
      passengersInfants,
      cabin,
      currency = "USD",
    } = body;

    if (!origin || !destination || !departDate) {
      return NextResponse.json(
        { error: "origin, destination, and departDate are required" },
        { status: 400 }
      );
    }

    const adults = passengersAdults || 1;
    const childCount = passengersChildren || 0;
    const infantCount = passengersInfants || 0;
    const totalPax = adults + childCount + infantCount;

    if (totalPax <= 0) {
      return NextResponse.json(
        { error: "At least one passenger is required" },
        { status: 400 }
      );
    }

    // Call Amadeus Flight Offers (test or prod depending on AMADEUS_ENV)
    const params: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departDate,
      adults,
      max: 20,
      currencyCode: currency,
      travelClass: cabin,
    };

    if (roundTrip && returnDate) {
      params.returnDate = returnDate;
    }

    const json: any = await amadeusGet(
      "/v2/shopping/flight-offers",
      params
    );

    const offers: any[] = json.data || [];

    const results = offers.slice(0, 10).map((offer, idx) => {
      const priceTotal = Number(offer.price?.total || 0);
      const itineraries = offer.itineraries || [];

      const outItin = itineraries[0] || {};
      const retItin = itineraries[1] || null;

      const segmentsOut = (outItin.segments || []).map((s: any) => ({
        from: s.departure?.iataCode,
        to: s.arrival?.iataCode,
        departureTime: s.departure?.at,
        arrivalTime: s.arrival?.at,
        carrierCode: s.carrierCode,
        flightNumber: s.number,
        duration_minutes: parseIsoDurationToMinutes(s.duration),
      }));

      const segmentsReturn = retItin
        ? (retItin.segments || []).map((s: any) => ({
            from: s.departure?.iataCode,
            to: s.arrival?.iataCode,
            departureTime: s.departure?.at,
            arrivalTime: s.arrival?.at,
            carrierCode: s.carrierCode,
            flightNumber: s.number,
            duration_minutes: parseIsoDurationToMinutes(s.duration),
          }))
        : [];

      const mainCarrier =
        segmentsOut[0]?.carrierCode || offer.validatingAirlineCodes?.[0];

      const flight = {
        price_usd: priceTotal,
        currency,
        mainCarrier,
        segments_out: segmentsOut,
        segments_return: segmentsReturn,
      };

      const pkg = {
        id: offer.id || `amadeus-${idx}`,
        flight,
        flight_total: priceTotal,
        hotel_total: 0, // later when we add hotels
        total_cost: priceTotal,
        provider: "amadeus",
      };

      return pkg;
    });

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("search route error:", err);
    return NextResponse.json(
      { error: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}
