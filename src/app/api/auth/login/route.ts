import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  checkCredentials,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

/** Pequeño freno contra fuerza bruta: 8 intentos fallidos por IP cada 10 min. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = attempts.get(ip);
  if (entry) entry.count++;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá unos minutos." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Completá el email y la contraseña." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  if (!checkCredentials(email, password)) {
    recordFailure(ip);
    return NextResponse.json(
      { error: "Email o contraseña incorrectos." },
      { status: 401 },
    );
  }

  attempts.delete(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(email),
    sessionCookieOptions,
  );
  return response;
}
