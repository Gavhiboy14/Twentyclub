import type { Brand, Database, Product, SyncRule } from "@/lib/types";
import { formatPrice, slugify } from "@/lib/utils";
import { uniqueSlug } from "@/lib/admin/slug";
import {
  EMPTY_SUMMARY,
  mergeSizes,
  sizeLabels,
  type ExtractedProduct,
  type ExtractionResult,
  type FieldChange,
  type ImportItem,
  type ImportSummary,
} from "./types";
import { canonical, detectColor, displayName, similarity, supplierKey } from "./normalize";
import { applyRules } from "./rules";
import { publishedPrice } from "./pricing";
import { DEFAULT_SYNC_SETTINGS } from "./defaults";

/* ==========================================================================
   Plan de importación

   Acá no se escribe nada: se arma la lista de lo que pasaría si el admin
   confirmara. Cada línea lleva su `patch` —lo que se escribiría— y su
   `previous` —lo que hay hoy—, y esos dos campos son simétricos: aplicar es
   escribir el primero, revertir es escribir el segundo. Por eso el rollback
   no tiene lógica propia y no puede desincronizarse de la importación.
   ========================================================================== */

/** Umbral del cruce difuso. Alto a propósito: ante la duda, producto nuevo. */
const FUZZY_THRESHOLD = 0.72;

let counter = 0;
function itemId(): string {
  counter += 1;
  return `it_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export interface PlanInput {
  extraction: ExtractionResult;
  db: Database;
  rules: SyncRule[];
  /** Fecha de la corrida; se inyecta para que los tests sean reproducibles. */
  now?: string;
}

export interface Plan {
  items: ImportItem[];
  summary: ImportSummary;
}

/* --------------------------- Deduplicación -------------------------------- */

/**
 * El proveedor repite filas de vez en cuando (en el catálogo de julio,
 * "Puma Suede XL" aparece dos veces). Se queda la primera y la repetida se
 * reporta, para que el admin sepa que su planilla tiene un duplicado.
 */
function dedupe(products: ExtractedProduct[]): {
  unique: ExtractedProduct[];
  duplicates: ExtractedProduct[];
} {
  const seen = new Map<string, ExtractedProduct>();
  const duplicates: ExtractedProduct[] = [];
  for (const product of products) {
    const key = supplierKey(product.model);
    if (seen.has(key)) duplicates.push(product);
    else seen.set(key, product);
  }
  return { unique: [...seen.values()], duplicates };
}

/* ------------------------------ Matcheo ----------------------------------- */

/**
 * Encuentra el producto de la tienda que corresponde a una fila del PDF.
 *
 * Primero por referencia exacta, que es como quedan atados a partir de la
 * primera importación. Recién si no hay, intenta por parecido de nombre, y
 * sólo dentro de la misma marca — cruzar "Dunk Panda" de Nike con uno de otra
 * marca sería peor que crear un producto de más.
 */
function findExisting(
  extracted: ExtractedProduct,
  brandId: string | null,
  products: Product[],
  claimed: Set<string>,
): Product | null {
  const key = supplierKey(extracted.model);

  const byRef = products.find((p) => p.supplierRef && p.supplierRef === key);
  if (byRef) return byRef;

  if (!brandId) return null;

  /* `claimed` es imprescindible, no una precaución.
     Durante el armado del plan nada se escribe, así que el `supplierRef` que
     una línea le va a poner al producto todavía no está en la base. Sin este
     registro en memoria, dos filas parecidas del PDF —"Jordan 1 Low" y
     "Jordan 1 Low Bred"— se enganchan las dos al mismo producto, y al aplicar
     la segunda le pisa el precio a la primera sin que nada lo avise. */
  let best: { product: Product; score: number } | null = null;
  for (const product of products) {
    if (product.brandId !== brandId) continue;
    if (product.supplierRef) continue; // ya está atado a otra fila
    if (claimed.has(product.id)) continue;
    const score = similarity(extracted.model, product.name);
    if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
      best = { product, score };
    }
  }
  return best?.product ?? null;
}

/* -------------------------------- Plan ------------------------------------ */

export function buildPlan({ extraction, db, rules, now }: PlanInput): Plan {
  const timestamp = now ?? new Date().toISOString();
  const settings = db.settings.sync ?? DEFAULT_SYNC_SETTINGS;
  const brandsById = new Map<string, Brand>(db.brands.map((b) => [b.id, b]));
  const takenSlugs = new Set(db.products.map((p) => p.slug));

  const { unique, duplicates } = dedupe(extraction.products);

  const items: ImportItem[] = [];
  const touched = new Set<string>();

  /* Filas que no se pudieron leer: entran al plan como error para que queden
     a la vista, nunca se descartan en silencio. */
  for (const issue of extraction.issues) {
    items.push({
      id: itemId(),
      kind: "error",
      productId: null,
      brand: "",
      model: issue.source,
      page: issue.page,
      changes: [],
      patch: null,
      previous: null,
      reason: issue.reason,
      approved: false,
    });
  }

  for (const duplicate of duplicates) {
    items.push({
      id: itemId(),
      kind: "error",
      productId: null,
      brand: "",
      model: duplicate.model,
      page: duplicate.page,
      changes: [],
      patch: null,
      previous: null,
      reason: "Está repetido en el PDF; se toma la primera aparición",
      approved: false,
    });
  }

  for (const extracted of unique) {
    const outcome = applyRules(extracted.model, rules);
    const brand = outcome.brandId ? brandsById.get(outcome.brandId) : undefined;
    const existing = findExisting(
      extracted,
      outcome.brandId,
      db.products,
      touched,
    );

    /* Sin marca no hay producto posible: la columna es obligatoria en la base.
       Se reporta para que el admin cree la marca o agregue una regla. */
    if (!existing && !brand) {
      items.push({
        id: itemId(),
        kind: "error",
        productId: null,
        brand: "",
        model: extracted.model,
        page: extracted.page,
        changes: [],
        patch: null,
        previous: null,
        reason:
          "No hay ninguna regla que asocie este modelo a una marca de la tienda",
        approved: false,
      });
      continue;
    }

    if (existing) {
      touched.add(existing.id);
      items.push(
        updateItem(existing, extracted, brandsById, settings, timestamp),
      );
    } else {
      items.push(
        createItem(extracted, brand!, outcome, settings, timestamp, takenSlugs),
      );
    }
  }

  /* Lo que dejó de venir en el PDF. Sólo cuenta para productos que alguna vez
     vinieron de una importación: los cargados a mano no son asunto del
     proveedor y no se tocan. */
  for (const product of db.products) {
    if (!product.supplierRef) continue;
    if (touched.has(product.id)) continue;
    if (product.status === "no-disponible") continue;
    items.push({
      id: itemId(),
      kind: "ausente",
      productId: product.id,
      brand: brandsById.get(product.brandId)?.name ?? "",
      model: product.name,
      page: 0,
      changes: [
        { field: "estado", before: product.status, after: "no-disponible" },
      ],
      patch: { status: "no-disponible", lastSyncAt: timestamp },
      previous: { status: product.status, lastSyncAt: product.lastSyncAt },
      reason: "Dejó de aparecer en el catálogo del proveedor",
      approved: true,
    });
  }

  return { items, summary: summarize(items) };
}

/* ------------------------- Líneas del plan -------------------------------- */

function updateItem(
  product: Product,
  extracted: ExtractedProduct,
  brandsById: Map<string, Brand>,
  settings: Database["settings"]["sync"],
  timestamp: string,
): ImportItem {
  const changes: FieldChange[] = [];
  const patch: Partial<Product> = { lastSyncAt: timestamp };
  const previous: Partial<Product> = { lastSyncAt: product.lastSyncAt };

  if (extracted.supplierPrice !== product.supplierPrice) {
    patch.supplierPrice = extracted.supplierPrice;
    previous.supplierPrice = product.supplierPrice;
  }

  const nextPrice = publishedPrice(
    extracted.supplierPrice,
    product,
    settings,
  );
  if (nextPrice !== null && nextPrice !== product.price) {
    changes.push({
      field: "precio",
      before: formatPrice(product.price),
      after: formatPrice(nextPrice),
    });
    patch.price = nextPrice;
    previous.price = product.price;
  }

  const currentSizes = sizeLabels(product.sizes);
  if (extracted.sizes.length && currentSizes.join(",") !== extracted.sizes.join(",")) {
    changes.push({
      field: "talles",
      before: currentSizes.join(" · ") || "—",
      after: extracted.sizes.join(" · "),
    });
    patch.sizes = mergeSizes(product.sizes, extracted.sizes);
    previous.sizes = product.sizes;
  }

  /* Un producto que había desaparecido y vuelve al PDF se vuelve a publicar.
     Si estaba en borrador se queda en borrador: seguir sin revisar. */
  if (product.status === "no-disponible") {
    changes.push({ field: "estado", before: "no-disponible", after: "publicado" });
    patch.status = "publicado";
    previous.status = product.status;
  }

  /* La referencia se graba la primera vez que se lo cruza, para que el próximo
     PDF lo encuentre por clave exacta y no por parecido. */
  if (!product.supplierRef) {
    patch.supplierRef = supplierKey(extracted.model);
    previous.supplierRef = "";
  }

  return {
    id: itemId(),
    kind: changes.length ? "modificado" : "sin-cambios",
    productId: product.id,
    brand: brandsById.get(product.brandId)?.name ?? "",
    model: product.name,
    page: extracted.page,
    changes,
    patch,
    previous,
    reason: "",
    approved: changes.length > 0,
  };
}

function createItem(
  extracted: ExtractedProduct,
  brand: Brand,
  outcome: ReturnType<typeof applyRules>,
  settings: Database["settings"]["sync"],
  timestamp: string,
  takenSlugs: Set<string>,
): ImportItem {
  const name = displayName(extracted.model);
  const { color, colorHex } = detectColor(extracted.model);
  const slug = uniqueSlug(
    slugify(`${brand.name} ${name}`) || "producto",
    takenSlugs,
  );
  takenSlugs.add(slug);
  const price =
    publishedPrice(extracted.supplierPrice, settings, settings) ??
    extracted.supplierPrice;

  const draft: Product = {
    id: `prod_${canonical(extracted.model).replace(/ /g, "_").slice(0, 40)}_${Date.now().toString(36)}`,
    slug,
    name,
    brandId: brand.id,
    categoryIds: outcome.categoryIds,
    price,
    discount: 0,
    description: "",
    features: [],
    color,
    colorHex,
    materials: [],
    tags: outcome.tags,
    sku: "",
    images: [],
    sizes: mergeSizes([], extracted.sizes),
    featured: false,
    views: 0,
    sold: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    // Nace en borrador: sin fotos ni descripción no puede salir a la tienda.
    status: "borrador",
    pricingMode: settings.pricingMode,
    supplierPrice: extracted.supplierPrice,
    supplierRef: supplierKey(extracted.model),
    marginPercent: settings.marginPercent,
    marginFixed: settings.marginFixed,
    lastSyncAt: timestamp,
  };

  return {
    id: itemId(),
    kind: "nuevo",
    productId: null,
    brand: brand.name,
    model: name,
    page: extracted.page,
    changes: [
      { field: "precio", before: "—", after: formatPrice(price) },
      {
        field: "talles",
        before: "—",
        after: extracted.sizes.join(" · ") || "sin talles",
      },
    ],
    patch: draft,
    previous: null,
    reason: "",
    approved: true,
  };
}

/* ------------------------------ Resumen ----------------------------------- */

export function summarize(items: ImportItem[]): ImportSummary {
  const summary: ImportSummary = { ...EMPTY_SUMMARY };
  for (const item of items) {
    if (item.kind !== "error") summary.found++;
    if (item.kind === "nuevo") summary.created++;
    if (item.kind === "modificado") summary.updated++;
    if (item.kind === "ausente") summary.removed++;
    if (item.kind === "error") summary.errors++;
    for (const change of item.changes) {
      if (item.kind === "nuevo") continue;
      if (change.field === "precio") summary.priceChanges++;
      if (change.field === "talles") summary.sizeChanges++;
    }
  }
  return summary;
}
