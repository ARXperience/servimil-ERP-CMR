// Autenticación Service Account → Access Token vía JWT firmado con Web Crypto.
// Compatible con runtime Node y runtime Cloudflare Workers (V8 isolates).
// No usa googleapis. Solo SubtleCrypto + fetch.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}
let cache: TokenCache | null = null;

function b64urlEncode(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    bytes = input;
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = (typeof btoa !== "undefined")
    ? btoa(bin)
    : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64Decode(b64: string): Uint8Array {
  const bin = (typeof atob !== "undefined")
    ? atob(b64)
    : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function normalizePem(raw: string): string {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  return b64Decode(body);
}

async function signJwt(email: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${b64urlEncode(JSON.stringify(header))}.${b64urlEncode(JSON.stringify(claim))}`;
  const keyBytes = pemToPkcs8(normalizePem(privateKeyPem));
  // SubtleCrypto exige ArrayBuffer estricto (no SharedArrayBuffer). El .buffer de
  // un Uint8Array nuevo siempre es ArrayBuffer, pero los tipos de TS lo declaran
  // como ArrayBufferLike. Cast explícito.
  const keyAb = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  ) as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyAb,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${b64urlEncode(sig)}`;
}

export async function getAccessToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + 30_000) return cache.accessToken;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) throw new Error("Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY");
  const jwt = await signJwt(email, key);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OAuth token request failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cache.accessToken;
}

export function clearTokenCache() {
  cache = null;
}
