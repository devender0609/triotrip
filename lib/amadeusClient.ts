// lib/amadeusClient.ts

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const AMADEUS_ENV = process.env.AMADEUS_ENV || "test";

if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
  console.warn(
    "[amadeusClient] Missing AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET in environment."
  );
}

const TOKEN_URL =
  AMADEUS_ENV === "production"
    ? "https://api.amadeus.com/v1/security/oauth2/token"
    : "https://test.api.amadeus.com/v1/security/oauth2/token";

const API_BASE =
  AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error(
      "Amadeus credentials are missing. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET."
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Amadeus token error:", res.status, text);
    throw new Error(
      `Amadeus token error ${res.status}. Check AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET and that you're using the correct (test) environment.`
    );
  }

  const json: any = await res.json();
  const accessToken = json.access_token as string;
  const expiresInSec = json.expires_in as number;

  cachedToken = {
    accessToken,
    expiresAt: now + (expiresInSec || 1800) * 1000,
  };
  return accessToken;
}

export async function amadeusGet(
  path: string,
  params: Record<string, any>
): Promise<any> {
  const token = await getAccessToken();
  const url = new URL(API_BASE + path);

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Amadeus GET error:", res.status, text);
    throw new Error(`Amadeus error ${res.status}`);
  }

  return res.json();
}
