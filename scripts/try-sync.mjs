/**
 * Banco de pruebas de la sincronización.
 *
 *   node scripts/try-sync.mjs "ruta/al/CATALOGO.pdf"
 *
 * Corre la extracción contra un PDF real y muestra qué salió: cuántas filas,
 * qué marcas dedujo, qué no pudo interpretar. No toca la base ni la tienda.
 *
 * Reimplementa el troceo de columnas del navegador a propósito: si este script
 * y `lib/sync/extract.ts` dejan de coincidir, es porque uno de los dos cambió
 * y hay que mirarlo.
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/try-sync.mjs <archivo.pdf>");
  process.exit(1);
}

/* El módulo de extracción es TypeScript, así que acá se replican las cuatro
   funciones puras que necesita el script. Están copiadas tal cual. */
const COLUMN = { modelEnd: 180, imageStart: 400 };
const ROW_BAND = 8;
const TITLE_ROW = /stock del d/i;
const HEADER_CELL = /^modelo$/i;
const SIZE_CELL = /^talles?\b/i;
const SIZE_PREFIX = /^talles?\b[\s,]*/i;

function rowsFromItems(items) {
  const bands = new Map();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const band = Math.round(item.y / ROW_BAND) * ROW_BAND;
    if (!bands.has(band)) bands.set(band, []);
    bands.get(band).push(item);
  }
  const rows = [];
  for (const [, cells] of [...bands.entries()].sort((a, b) => b[0] - a[0])) {
    cells.sort((a, b) => a.x - b.x);
    if (TITLE_ROW.test(cells.map((c) => c.str).join(" "))) continue;

    const model = [];
    const price = [];
    const sizes = [];
    let isHeader = false;

    for (const cell of cells) {
      const text = cell.str.trim();
      if (!text) continue;
      if (cell.x >= COLUMN.imageStart) continue;
      if (HEADER_CELL.test(text)) {
        isHeader = true;
        break;
      }
      if (text.includes("$")) price.push(text);
      else if (SIZE_CELL.test(text)) sizes.push(text);
      else if (cell.x < COLUMN.modelEnd) model.push(text);
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

const parsePrice = (raw) => {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
};

const parseSizes = (raw) => {
  const body = raw.replace(SIZE_PREFIX, "");
  const out = new Set();
  for (const token of body.split(",")) {
    const size = token.trim();
    if (/^\d{2}(\/\d{2})?$/.test(size)) out.add(size);
  }
  return [...out];
};

const canonical = (v) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const BRAND_KEYWORDS = [
  ["jordan", ["jordan"]],
  ["adidas", ["adidas", "adizero", "adi ", "samba", "forum", "gazelle", "superstar", "supernova", "campus", "spezial"]],
  ["new-balance", ["new balance", "new bal"]],
  ["vans", ["vans", "knu", "old skool", "ultraranger"]],
  ["puma", ["puma", "suede"]],
  ["converse", ["converse", "chuck"]],
  ["reebok", ["reebok", "club c"]],
  ["asics", ["asics", "gel"]],
  ["nike", ["nike", "dunk", "air force", "air max", "blazzer", "blazer", "cortez", "pegasus", "shox", "zoom", "air"]],
];

function inferBrand(model) {
  const text = canonical(model);
  for (const [slug, words] of BRAND_KEYWORDS) {
    for (const word of words) if (text.includes(canonical(word))) return slug;
  }
  return null;
}

/* ------------------------------- corrida ---------------------------------- */

const data = new Uint8Array(fs.readFileSync(file));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

const products = [];
const issues = [];

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const items = tc.items
    .filter((i) => typeof i.str === "string")
    .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));

  for (const row of rowsFromItems(items)) {
    const source = [row.model, row.price, row.sizes].filter(Boolean).join(" · ");
    const price = parsePrice(row.price);
    if (!row.model) {
      issues.push({ page: p, source, reason: "sin modelo" });
      continue;
    }
    if (price === null) {
      issues.push({ page: p, source, reason: "sin precio legible" });
      continue;
    }
    products.push({
      page: p,
      model: row.model,
      supplierPrice: price,
      sizes: parseSizes(row.sizes),
      brand: inferBrand(row.model),
    });
  }
}

const line = (l, v) => console.log(`${l.padEnd(34)} ${v}`);

console.log(`\n== ${path.basename(file)} ==\n`);
line("Páginas", doc.numPages);
line("Filas leídas", products.length);
line("Filas ilegibles", issues.length);

const sinMarca = products.filter((p) => !p.brand);
line("Sin marca deducible", sinMarca.length);

const sinTalles = products.filter((p) => !p.sizes.length);
line("Sin talles (packs de medias)", sinTalles.length);

const keys = products.map((p) => canonical(p.model));
const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
line("Duplicados en el PDF", dupes.length);

const precios = products.map((p) => p.supplierPrice);
line("Precio mínimo", Math.min(...precios).toLocaleString("es-AR"));
line("Precio máximo", Math.max(...precios).toLocaleString("es-AR"));

console.log("\n-- por marca --");
const porMarca = {};
for (const p of products) porMarca[p.brand ?? "(sin marca)"] = (porMarca[p.brand ?? "(sin marca)"] ?? 0) + 1;
for (const [b, n] of Object.entries(porMarca).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${b}`);
}

if (sinMarca.length) {
  console.log("\n-- modelos sin marca (van a quedar en error) --");
  for (const p of sinMarca) console.log(`  p.${String(p.page).padStart(2)}  ${p.model}`);
}

if (dupes.length) {
  console.log("\n-- duplicados --");
  for (const d of [...new Set(dupes)]) console.log(`  ${d}`);
}

if (issues.length) {
  console.log("\n-- filas ilegibles --");
  for (const i of issues) console.log(`  p.${i.page}  ${i.reason}: ${i.source}`);
}

console.log("\n-- muestra --");
for (const p of products.slice(0, 8)) {
  console.log(
    `  p.${String(p.page).padStart(2)}  ${(p.brand ?? "?").padEnd(12)} ${p.model.padEnd(34)} $${p.supplierPrice.toLocaleString("es-AR").padStart(8)}  ${p.sizes.join(" ") || "—"}`,
  );
}
console.log();
