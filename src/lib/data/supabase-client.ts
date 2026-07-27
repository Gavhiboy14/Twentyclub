import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de servidor con la clave secreta: saltea RLS, así que NUNCA puede
 * salir del servidor. Sólo lo importan los drivers y las route handlers.
 *
 * El sitio no usa Supabase desde el navegador, así que la clave publicable no
 * hace falta en ningún lado.
 */
let client: SupabaseClient | null = null;

/**
 * Supabase está migrando de `service_role` a las claves nuevas `sb_secret_…`.
 * Aceptamos las dos: la nueva primero, la vieja como respaldo.
 */
function secretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = secretKey();

  if (!url || !key) {
    throw new Error(
      "DATA_DRIVER=supabase pero falta NEXT_PUBLIC_SUPABASE_URL o " +
        "SUPABASE_SECRET_KEY. Cargalas en las variables de entorno " +
        "(en Netlify: Site configuration → Environment variables).",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Bucket público donde viven las fotos de producto. */
export const STORAGE_BUCKET = "productos";

/** El host de Supabase, para restringir remotePatterns de next/image. */
export function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
