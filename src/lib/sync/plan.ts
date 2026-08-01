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
import {
  canonical,
  detectColor,
  displayName,
  similarity,
  supplierKey,
  withoutBrand,
} from "./normalize";
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

/** Umbral del cruce difuso. Alto a propósito: ante la duda, no se ata solo. */
const FUZZY_THRESHOLD = 0.72;

/**
 * Piso para *sugerir* un producto sin atarlo.
 *
 * Entre este valor y `FUZZY_THRESHOLD` está la zona gris: demasiado parecido
 * para ignorarlo, no lo suficiente como para vincularlo sin preguntar. El caso
 * típico es que el proveedor escriba "Nike Dunk Panda Blancas" y en la tienda
 * el producto se llame "Dunk Panda". Se ofrece en un clic y decide el admin.
 */
const SUGGEST_THRESHOLD = 0.4;

/**
 * Umbral para volver a enganchar un producto que **ya estaba atado** y cuya
 * referencia no volvió a aparecer en este PDF.
 *
 * Es más bajo que el general y no por descuido: ese producto ya se sabe de
 * este proveedor, y la única alternativa a reengancharlo es darlo de baja y
 * crear un duplicado al lado. Un renombre típico —"Ultraranger" pasa a
 * "Ultraranger Blancas"— cae en 0.67 y no llegaba al umbral general. El
 * cambio de vínculo queda visible en la línea, así que si el parecido erró se
 * ve y se excluye antes de confirmar.
 */
const REBIND_THRESHOLD = 0.55;

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
 * Producto de la tienda que se parece a una fila del PDF.
 *
 * Sólo dentro de la misma marca: cruzar "Dunk Panda" de Nike con uno de otra
 * marca sería peor que crear un producto de más.
 *
 * A diferencia del cruce por referencia, esto corre en una segunda pasada y
 * mira también productos que **ya tienen** referencia, siempre que ninguna
 * fila de este PDF los haya reclamado. Un producto atado cuya referencia no
 * volvió a aparecer es justo el caso del renombre —el proveedor le cambió el
 * nombre al modelo—, y es el único momento en que conviene volver a engancharlo
 * por parecido en vez de darlo de baja y crear un duplicado al lado.
 *
 * `claimed` es imprescindible, no una precaución. Durante el armado del plan
 * nada se escribe, así que el `supplierRef` que una línea le va a poner al
 * producto todavía no está en la base. Sin este registro en memoria, dos filas
 * parecidas —"Jordan 1 Low" y "Jordan 1 Low Bred"— se enganchan las dos al
 * mismo producto, y al aplicar la segunda le pisa el precio a la primera sin
 * que nada lo avise.
 */
function findBySimilarity(
  extracted: ExtractedProduct,
  brandId: string | null,
  products: Product[],
  claimed: Set<string>,
  brandName: string,
): Product | null {
  if (!brandId) return null;

  const needle = withoutBrand(extracted.model, brandName);

  let best: { product: Product; score: number } | null = null;
  for (const product of products) {
    if (product.brandId !== brandId) continue;
    if (claimed.has(product.id)) continue;
    /* Un producto huérfano —atado a este proveedor y sin fila propia en este
       PDF— se reengancha con menos exigencia: ver `REBIND_THRESHOLD`. */
    const floor = product.supplierRef ? REBIND_THRESHOLD : FUZZY_THRESHOLD;
    const score = similarity(needle, withoutBrand(product.name, brandName));
    if (score >= floor && (!best || score > best.score)) {
      best = { product, score };
    }
  }
  return best?.product ?? null;
}

/**
 * Producto más parecido para una fila que no se pudo vincular sola.
 *
 * Mira el mismo universo que `findExisting` —misma marca, sin referencia y no
 * reclamado— pero en la franja de abajo del umbral. No decide nada: alimenta
 * el botón de "¿Es este?" del panel, para que vincular no obligue a buscar el
 * producto a mano en la lista entera.
 */
function findSuggestion(
  extracted: ExtractedProduct,
  brandId: string | null,
  products: Product[],
  claimed: Set<string>,
  brandsById: Map<string, Brand>,
): ImportItem["suggestion"] {
  if (!brandId) return null;

  const brandName = brandsById.get(brandId)?.name ?? "";
  const needle = withoutBrand(extracted.model, brandName);

  let best: { product: Product; score: number } | null = null;
  for (const product of products) {
    if (product.brandId !== brandId) continue;
    if (claimed.has(product.id)) continue;
    const score = similarity(needle, withoutBrand(product.name, brandName));
    if (
      score >= SUGGEST_THRESHOLD &&
      score < FUZZY_THRESHOLD &&
      (!best || score > best.score)
    ) {
      best = { product, score };
    }
  }

  if (!best) return null;
  // El candidato salió del filtro por marca, así que `brandName` es el suyo.
  return {
    productId: best.product.id,
    label: `${brandName} ${best.product.name}`.trim(),
  };
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

  /* El cruce va en dos pasadas y el orden no es un detalle de implementación.
     Si se resolviera fila por fila, una fila temprana podría llevarse por
     parecido un producto que más abajo del PDF le corresponde por referencia
     exacta a otra. Primero se atan todos los seguros; el parecido se reparte
     después, sobre lo que quedó realmente suelto. */
  const byRef = new Map<string, Product>();
  for (const product of db.products) {
    if (product.supplierRef) byRef.set(product.supplierRef, product);
  }

  const rows = unique.map((extracted) => {
    const outcome = applyRules(extracted.model, rules);
    return {
      extracted,
      outcome,
      brand: outcome.brandId ? brandsById.get(outcome.brandId) : undefined,
      existing: byRef.get(supplierKey(extracted.model)) ?? null,
    };
  });

  for (const row of rows) {
    if (row.existing) touched.add(row.existing.id);
  }

  for (const row of rows) {
    if (row.existing) continue;
    row.existing = findBySimilarity(
      row.extracted,
      row.outcome.brandId,
      db.products,
      touched,
      row.brand?.name ?? "",
    );
    if (row.existing) touched.add(row.existing.id);
  }

  for (const { extracted, outcome, brand, existing } of rows) {
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
      // Ya quedó reclamado en la pasada que lo encontró.
      items.push(
        updateItem(existing, extracted, brandsById, settings, timestamp),
      );
    } else {
      items.push(
        createItem(
          extracted,
          brand!,
          outcome,
          settings,
          timestamp,
          takenSlugs,
          findSuggestion(
            extracted,
            outcome.brandId,
            db.products,
            touched,
            brandsById,
          ),
        ),
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
     PDF lo encuentre por clave exacta y no por parecido.

     Y se **regraba** si el proveedor le cambió el nombre al modelo: sin esto,
     un renombre obligaría a vincular el mismo producto a mano en cada
     importación, porque la referencia vieja no vuelve a aparecer nunca.

     El renombre entra además como cambio visible. No es cosmético: si fuera
     el único cambio de la línea —mismo precio, mismos talles— la línea
     quedaría en "sin cambios", no se aprobaría, y la referencia nueva no
     llegaría a guardarse. */
  const nextRef = supplierKey(extracted.model);
  if (product.supplierRef !== nextRef) {
    if (product.supplierRef) {
      changes.push({
        field: "vínculo",
        before: product.supplierRef,
        after: nextRef,
      });
    }
    patch.supplierRef = nextRef;
    previous.supplierRef = product.supplierRef;
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

/**
 * Línea para un modelo del PDF que no está en la tienda.
 *
 * Nace **desaprobada**, y esa es la decisión que ordena toda la pantalla: el
 * catálogo del proveedor es mucho más grande que la tienda, así que "no lo
 * encontré" es un aviso, no una orden de crear. Si esto viniera aprobado,
 * confirmar una importación llenaría Twenty Club con cientos de borradores que
 * nadie pidió. El admin elige de a uno: vincular, incluir o ignorar.
 */
function createItem(
  extracted: ExtractedProduct,
  brand: Brand,
  outcome: ReturnType<typeof applyRules>,
  settings: Database["settings"]["sync"],
  timestamp: string,
  takenSlugs: Set<string>,
  suggestion: ImportItem["suggestion"] = null,
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
    reason: suggestion
      ? `No coincide con ningún producto de tu tienda. ¿Será "${suggestion.label}"?`
      : "No coincide con ningún producto de tu tienda",
    suggestion,
    approved: false,
  };
}

/* ------------------------------ Revinculación ----------------------------- */

/**
 * Convierte una línea "producto nuevo" en una actualización de un producto que
 * ya existe.
 *
 * El cruce automático es conservador a propósito —ante la duda crea— y en el
 * primer PDF eso deja decenas de borradores que en realidad son productos que
 * la tienda ya tiene con otro nombre. Esto es la salida manual: el admin elige
 * el par correcto y la línea se recalcula como modificación.
 *
 * Queda atado para siempre: el `supplierRef` que se escribe hace que la
 * próxima importación lo encuentre por clave exacta, sin volver a preguntar.
 */
export function relinkItem(
  item: ImportItem,
  product: Product,
  db: Database,
  now?: string,
): ImportItem | null {
  if (item.kind !== "nuevo" || !item.patch) return null;

  const draft = item.patch as Product;
  const extracted: ExtractedProduct = {
    page: item.page,
    source: "",
    brand: item.brand,
    color: draft.color,
    // `supplierRef` del borrador ya es la forma canónica del modelo del PDF.
    model: draft.supplierRef,
    supplierPrice: draft.supplierPrice,
    sizes: draft.sizes.map((size) => size.size),
  };

  const linked = updateItem(
    product,
    extracted,
    new Map(db.brands.map((brand) => [brand.id, brand])),
    db.settings.sync ?? DEFAULT_SYNC_SETTINGS,
    now ?? new Date().toISOString(),
  );

  // Se conserva el id para que la aprobación que ya tenía el admin no se pierda.
  return { ...linked, id: item.id, approved: true };
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
