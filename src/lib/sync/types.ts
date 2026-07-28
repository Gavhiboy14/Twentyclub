import type { Product, SizeStock, SyncRule } from "@/lib/types";

/* ==========================================================================
   Sincronización de catálogo

   El módulo tiene una regla que ordena todo lo demás: hay campos que vienen
   del proveedor y hay campos que son de Twenty Club. Los primeros se pisan en
   cada importación; los segundos no los toca nadie más que el administrador.
   La lista está en SYNCED_FIELDS y es la única fuente de verdad al respecto:
   si un campo no está ahí, la sincronización no puede escribirlo.
   ========================================================================== */

/**
 * Lo único que una importación tiene permitido escribir.
 *
 * Nombre comercial, descripción, SEO, slug, categorías, etiquetas, imágenes,
 * destacado y orden quedan deliberadamente afuera: son trabajo editorial, y
 * que un PDF los pise sería perderlo.
 */
export const SYNCED_FIELDS = [
  "supplierPrice",
  "price",
  "sizes",
  "status",
  "lastSyncAt",
] as const satisfies readonly (keyof Product)[];

export type SyncedField = (typeof SYNCED_FIELDS)[number];

/* ------------------------------ Extracción -------------------------------- */

/** Un producto tal como salió del PDF, sin saber todavía nada de la tienda. */
export interface ExtractedProduct {
  /** Página del PDF. Sirve para volver a la fuente cuando algo no cierra. */
  page: number;
  /** Texto crudo del que salió. Es la coartada de cada dato importado. */
  source: string;
  brand: string;
  model: string;
  color: string;
  supplierPrice: number;
  sizes: string[];
}

/** Una fila que no se pudo interpretar. Nunca se descarta en silencio. */
export interface ExtractionIssue {
  page: number;
  source: string;
  reason: string;
}

export interface ExtractionResult {
  pages: number;
  products: ExtractedProduct[];
  issues: ExtractionIssue[];
}

/* -------------------------------- Plan ------------------------------------ */

export type ChangeKind =
  | "nuevo"
  | "modificado"
  | "sin-cambios"
  | "ausente"
  | "error";

export type ChangeField = "precio" | "talles" | "estado";

export interface FieldChange {
  field: ChangeField;
  before: string;
  after: string;
}

/**
 * Una línea del plan de importación.
 *
 * `patch` y `previous` son simétricos a propósito: aplicar es escribir el
 * primero y revertir es escribir el segundo. Esa simetría es lo que hace que
 * el rollback no necesite lógica propia y por lo tanto no pueda divergir.
 */
export interface ImportItem {
  id: string;
  kind: ChangeKind;
  /** null en los productos nuevos hasta que se aplican. */
  productId: string | null;
  brand: string;
  model: string;
  page: number;
  changes: FieldChange[];
  /** En los nuevos viene el producto entero; en el resto, sólo lo sincronizado. */
  patch: Partial<Product> | null;
  /** Los valores que había antes, limitados a las claves de `patch`. */
  previous: Partial<Product> | null;
  /** Por qué quedó en error, o por qué se saltea. */
  reason: string;
  /** El administrador puede desmarcar líneas sueltas antes de confirmar. */
  approved: boolean;
}

export type ImportStatus = "analizado" | "aplicado" | "revertido";

export interface ImportSummary {
  found: number;
  created: number;
  updated: number;
  removed: number;
  priceChanges: number;
  sizeChanges: number;
  errors: number;
}

export interface ImportRun {
  id: string;
  createdAt: string;
  appliedAt: string | null;
  fileName: string;
  pages: number;
  /** Quién la corrió. Hoy hay un solo usuario, pero queda registrado igual. */
  user: string;
  status: ImportStatus;
  summary: ImportSummary;
}

export interface ImportRunDetail extends ImportRun {
  items: ImportItem[];
}

export const EMPTY_SUMMARY: ImportSummary = {
  found: 0,
  created: 0,
  updated: 0,
  removed: 0,
  priceChanges: 0,
  sizeChanges: 0,
  errors: 0,
};

/* -------------------------------- Reglas ---------------------------------- */

/** `SyncRule` vive en `lib/types` porque forma parte de la base, igual que las
 *  marcas o las categorías. Se reexporta acá para que el módulo se lea entero
 *  desde un solo lugar. */
export type { SyncRule } from "@/lib/types";

export type RuleField = SyncRule["field"];
export type RuleOperator = SyncRule["operator"];

/* ------------------------------- Talles ----------------------------------- */

/**
 * Los talles del PDF llegan como lista de números y en la tienda son objetos
 * con stock. Al sincronizar se conserva el stock de los talles que ya estaban:
 * el proveedor dice qué talles existen, no cuántos pares hay en el depósito.
 */
export function mergeSizes(current: SizeStock[], incoming: string[]): SizeStock[] {
  const byLabel = new Map(current.map((s) => [s.size, s]));
  return incoming.map(
    (size) => byLabel.get(size) ?? { size, stock: 0, available: true },
  );
}

export function sizeLabels(sizes: SizeStock[]): string[] {
  return sizes.map((s) => s.size);
}
