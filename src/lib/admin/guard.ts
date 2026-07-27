import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * El middleware ya bloquea las páginas de /admin, pero las route handlers de
 * /api/admin son alcanzables por su cuenta y necesitan su propia verificación.
 */
export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/**
 * Deja sólo las claves que realmente vinieron en el body.
 *
 * `schema.partial()` marca todo opcional, pero Zod igual aplica los `.default()`
 * de los campos ausentes. Sin este filtro, guardar únicamente el stock desde el
 * panel borraría imágenes, materiales y etiquetas del producto.
 */
export function onlySent<T extends object>(raw: unknown, parsed: T): Partial<T> {
  if (typeof raw !== "object" || raw === null) return {};
  const sent = new Set(Object.keys(raw));
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => sent.has(key)),
  ) as Partial<T>;
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}
