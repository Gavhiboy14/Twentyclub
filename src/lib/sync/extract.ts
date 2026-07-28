import type { ExtractionIssue, ExtractionResult, ExtractedProduct } from "./types";

/* ==========================================================================
   Lectura del PDF del proveedor

   El catálogo lo exporta Google Sheets, así que el PDF trae texto real y las
   columnas caen siempre en la misma coordenada. Eso permite leerlo de forma
   determinística: mismo archivo, mismo resultado, y cada dato con su fila de
   origen para poder auditarlo. No hay modelo de lenguaje en este camino.

   Las columnas se reconocen por contenido, no por posición. Parece un rodeo
   teniendo coordenadas, pero las celdas del PDF vienen centradas: un producto
   con diez talles arranca su celda mucho más a la izquierda que uno con dos,
   y con cortes fijos ese texto se mete en la columna del precio. Pasó con
   "Adizero FULL BLACK" y "Jordan SpaceJam", que daban precios de veinticuatro
   cifras. El signo $ y la palabra "Talle" no se mueven de lugar; la x sí.

   Lo único que sigue saliendo de la posición es el borde del modelo (x < 180)
   y el de la imagen (x > 400), que se descarta entero: las fotos se cargan a
   mano y esa columna a veces trae "#N/A" por una fórmula rota en la planilla.
   ========================================================================== */

/** Un ítem de texto de pdf.js, reducido a lo que importa. */
export interface TextItem {
  str: string;
  x: number;
  y: number;
}

/** Fin de la columna de modelo y comienzo de la de imagen, en puntos PDF. */
const COLUMN = { modelEnd: 180, imageStart: 400 };

/** Alto de banda para agrupar ítems en una misma fila, en puntos PDF. */
const ROW_BAND = 8;

const TITLE_ROW = /stock del d/i;
const HEADER_CELL = /^modelo$/i;
const SIZE_CELL = /^talles?\b/i;
const SIZE_PREFIX = /^talles?\b[\s,]*/i;

/**
 * Agrupa los ítems sueltos de una página en filas y columnas.
 *
 * pdf.js entrega el texto en el orden del contenido, no en el visual, así que
 * el orden se reconstruye por coordenada: banda horizontal para la fila, y
 * dentro de la fila el corte de columna por posición x.
 */
export function rowsFromItems(items: TextItem[]): {
  model: string;
  price: string;
  sizes: string;
}[] {
  const bands = new Map<number, TextItem[]>();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const band = Math.round(item.y / ROW_BAND) * ROW_BAND;
    const bucket = bands.get(band);
    if (bucket) bucket.push(item);
    else bands.set(band, [item]);
  }

  const rows: { model: string; price: string; sizes: string }[] = [];
  // De arriba hacia abajo: en PDF la y crece hacia arriba.
  for (const [, cells] of [...bands.entries()].sort((a, b) => b[0] - a[0])) {
    cells.sort((a, b) => a.x - b.x);
    if (TITLE_ROW.test(cells.map((c) => c.str).join(" "))) continue;

    const model: string[] = [];
    const price: string[] = [];
    const sizes: string[] = [];
    let isHeader = false;

    for (const cell of cells) {
      const text = cell.str.trim();
      if (!text) continue;
      if (cell.x >= COLUMN.imageStart) continue; // columna de imagen
      if (HEADER_CELL.test(text)) {
        isHeader = true;
        break;
      }
      if (text.includes("$")) price.push(text);
      else if (SIZE_CELL.test(text)) sizes.push(text);
      else if (cell.x < COLUMN.modelEnd) model.push(text);
      // Un resto sin clasificar sólo puede ser continuación de los talles.
      else if (sizes.length) sizes.push(text);
      else model.push(text);
    }

    if (isHeader) continue;
    const row = {
      model: model.join(" ").trim(),
      price: price.join(" ").trim(),
      sizes: sizes.join(" ").trim(),
    };
    if (row.model || row.price) rows.push(row);
  }
  return rows;
}

/** "$36.660" → 36660. El punto es separador de miles, no decimal. */
export function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * "Talles, 38/39, 40/41" → ["38/39", "40/41"].
 *
 * El prefijo alterna entre "Talle" y "Talles" según la fila, y los talles
 * combinados (38/39) son válidos: el proveedor los usa para calzado unisex.
 */
export function parseSizes(raw: string): string[] {
  const body = raw.replace(SIZE_PREFIX, "");
  if (!body.trim()) return [];
  const seen = new Set<string>();
  for (const token of body.split(",")) {
    const size = token.trim();
    if (/^\d{2}(\/\d{2})?$/.test(size)) seen.add(size);
  }
  return [...seen];
}

/**
 * Convierte las filas de una página en productos.
 *
 * Una fila sin talles no es un error: el proveedor vende packs de medias, que
 * tienen precio pero no numeración. Una fila sin precio sí lo es, y se reporta
 * en vez de descartarse.
 */
export function productsFromRows(
  rows: { model: string; price: string; sizes: string }[],
  page: number,
): { products: ExtractedProduct[]; issues: ExtractionIssue[] } {
  const products: ExtractedProduct[] = [];
  const issues: ExtractionIssue[] = [];

  for (const row of rows) {
    const source = [row.model, row.price, row.sizes]
      .filter(Boolean)
      .join(" · ");
    const model = row.model.trim();
    const price = parsePrice(row.price);

    if (!model) {
      issues.push({ page, source, reason: "La fila no tiene modelo" });
      continue;
    }
    if (price === null) {
      issues.push({ page, source, reason: "No se pudo leer el precio" });
      continue;
    }

    products.push({
      page,
      source,
      brand: "",
      model,
      color: "",
      supplierPrice: price,
      sizes: parseSizes(row.sizes),
    });
  }

  return { products, issues };
}

export function emptyResult(): ExtractionResult {
  return { pages: 0, products: [], issues: [] };
}

/** Une el resultado de varias páginas en uno solo. */
export function mergeResults(parts: ExtractionResult[]): ExtractionResult {
  return parts.reduce<ExtractionResult>(
    (acc, part) => ({
      pages: acc.pages + part.pages,
      products: [...acc.products, ...part.products],
      issues: [...acc.issues, ...part.issues],
    }),
    emptyResult(),
  );
}
