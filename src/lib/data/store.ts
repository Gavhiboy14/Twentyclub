import type { Database } from "@/lib/types";
import { localRepo } from "./drivers/local";
import { supabaseRepo } from "./drivers/supabase";
import { driverName, type DataRepo } from "./repo";

/**
 * Punto de entrada a los datos. Elige el driver según DATA_DRIVER y no hace
 * nada más — la lógica vive en `drivers/`.
 *
 *   local     → .data/db.json        (desarrollo y VPS con disco propio)
 *   supabase  → Postgres + Storage   (producción en Netlify)
 */
export function repo(): DataRepo {
  return driverName() === "supabase" ? supabaseRepo : localRepo;
}

/** La base completa. Es lo único que consultan las páginas. */
export function readDb(): Promise<Database> {
  return repo().snapshot();
}

/** Vuelve al catálogo semilla. Sólo disponible con el driver local. */
export async function resetDb(): Promise<void> {
  const current = repo();
  if (!current.reset) {
    throw new Error(
      "Restablecer el catálogo sólo está disponible con DATA_DRIVER=local. " +
        "En Supabase, volvé a correr `npm run seed:supabase`.",
    );
  }
  await current.reset();
}

export { driverName };
