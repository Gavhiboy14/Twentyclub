/**
 * Sesión del panel: un token firmado con HMAC-SHA256 guardado en cookie
 * httpOnly. Usa Web Crypto, así que funciona tanto en el middleware (edge)
 * como en las route handlers de Node.
 */

export const SESSION_COOKIE = "tc_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 h

interface SessionPayload {
  email: string;
  exp: number;
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error(
      "Falta AUTH_SECRET. Copiá .env.example a .env.local y completalo.",
    );
  }
  return value;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function key() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(data: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(),
    new TextEncoder().encode(data),
  );
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(email: string) {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await sign(body)}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = await sign(body);
  // Comparación de longitud constante.
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;
  return (
    email.trim().toLowerCase() === expectedEmail.toLowerCase() &&
    password === expectedPassword
  );
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === "production",
} as const;
