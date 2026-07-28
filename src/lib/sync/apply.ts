import type { Product } from "@/lib/types";
import { repo } from "@/lib/data/store";
import { SYNCED_FIELDS, type ImportItem, type ImportRunDetail } from "./types";

/* ==========================================================================
   Aplicar y revertir

   Las dos operaciones son la misma escribiendo distinto lado del plan:
   aplicar escribe `patch`, revertir escribe `previous`. Por eso el rollback
   no tiene lógica propia y no puede quedar desincronizado de la importación.

   Todo lo que sale de acá pasa antes por `onlySynced`, que es el candado del
   módulo: aunque una línea del plan viniera con el nombre comercial o la
   descripción adentro, no se escriben. La lista de campos permitidos está en
   SYNCED_FIELDS y es la única puerta.
   ========================================================================== */

const ALLOWED = new Set<string>(SYNCED_FIELDS);

/**
 * Filtra un patch a los campos que la sincronización tiene permitido tocar.
 *
 * No es una validación defensiva de más: es la garantía que le dimos al
 * administrador de que su trabajo editorial no lo pisa ningún PDF.
 */
export function onlySynced(patch: Partial<Product>): Partial<Product> {
  return Object.fromEntries(
    Object.entries(patch).filter(([key]) => ALLOWED.has(key)),
  ) as Partial<Product>;
}

export interface ApplyReport {
  created: number;
  updated: number;
  skipped: number;
  failed: { item: string; reason: string }[];
}

function emptyReport(): ApplyReport {
  return { created: 0, updated: 0, skipped: 0, failed: [] };
}

/**
 * Escribe en el catálogo las líneas aprobadas.
 *
 * Devuelve el plan actualizado: los productos nuevos vuelven con el id que
 * les quedó, que es lo que después permite revertirlos. Sin eso, deshacer una
 * importación no sabría qué borrar.
 */
export async function applyPlan(
  run: ImportRunDetail,
  approvedIds: string[],
): Promise<{ report: ApplyReport; items: ImportItem[] }> {
  const approved = new Set(approvedIds);
  const report = emptyReport();
  const store = repo();
  const items: ImportItem[] = [];

  for (const item of run.items) {
    if (!approved.has(item.id) || !item.patch || item.kind === "error") {
      items.push({ ...item, approved: false });
      report.skipped++;
      continue;
    }

    try {
      if (item.kind === "nuevo") {
        const created = await store.createProduct(item.patch as Product);
        // Se guarda el id para poder deshacerlo después.
        items.push({ ...item, productId: created.id, approved: true });
        report.created++;
      } else if (item.productId) {
        const patch = onlySynced(item.patch);
        patch.updatedAt = new Date().toISOString();
        const updated = await store.updateProduct(item.productId, patch);
        if (!updated) {
          items.push({ ...item, approved: false });
          report.failed.push({
            item: `${item.brand} ${item.model}`,
            reason: "El producto ya no existe",
          });
          continue;
        }
        items.push({ ...item, approved: true });
        report.updated++;
      } else {
        items.push({ ...item, approved: false });
        report.skipped++;
      }
    } catch (error) {
      items.push({ ...item, approved: false });
      report.failed.push({
        item: `${item.brand} ${item.model}`,
        reason: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  return { report, items };
}

/**
 * Deshace una importación ya aplicada.
 *
 * Los productos que creó se borran; a los que modificó se les vuelve a
 * escribir el estado anterior. Sólo se toca lo que esta corrida tocó: si
 * después de importar alguien editó un precio a mano, revertir se lo pisa,
 * y por eso el panel avisa antes de hacerlo.
 */
export async function rollbackPlan(
  run: ImportRunDetail,
): Promise<ApplyReport> {
  const report = emptyReport();
  const store = repo();

  // En orden inverso: si una línea dependiera de otra, se deshace primero.
  for (const item of [...run.items].reverse()) {
    if (!item.approved || !item.productId) {
      report.skipped++;
      continue;
    }

    try {
      if (item.kind === "nuevo") {
        await store.deleteProduct(item.productId);
        report.created++;
      } else if (item.previous) {
        const patch = onlySynced(item.previous);
        patch.updatedAt = new Date().toISOString();
        await store.updateProduct(item.productId, patch);
        report.updated++;
      } else {
        report.skipped++;
      }
    } catch (error) {
      report.failed.push({
        item: `${item.brand} ${item.model}`,
        reason: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  return report;
}
