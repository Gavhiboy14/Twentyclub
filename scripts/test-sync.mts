/**
 * Prueba de punta a punta del módulo de sincronización, contra la base local.
 *
 *   npx tsx scripts/test-sync.mts "ruta/al/CATALOGO.pdf"
 *
 * Corre el ciclo completo —analizar, aplicar, deshacer— y comprueba que el
 * catálogo vuelva exactamente al estado inicial. Usa los módulos reales del
 * proyecto, no copias: si esto pasa, el panel hace lo mismo.
 *
 * Escribe en .data/db.json. Nunca apunta a Supabase.
 */
import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

process.env.DATA_DRIVER = "local";

const { productsFromRows, rowsFromItems, mergeResults } = await import(
  "../src/lib/sync/extract.ts"
);
const { buildPlan } = await import("../src/lib/sync/plan.ts");
const { defaultRules } = await import("../src/lib/sync/rules.ts");
const { applyPlan, rollbackPlan } = await import("../src/lib/sync/apply.ts");
const { readDb, repo } = await import("../src/lib/data/store.ts");

const file = process.argv[2];
if (!file) {
  console.error("Uso: npx tsx scripts/test-sync.mts <archivo.pdf>");
  process.exit(1);
}

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FALLA"} ${label}${ok ? "" : `\n         esperado ${JSON.stringify(expected)}, salió ${JSON.stringify(actual)}`}`,
  );
}

/* ------------------------------ 1. extraer -------------------------------- */

const data = new Uint8Array(fs.readFileSync(file));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

const parts = [];
for (let page = 1; page <= doc.numPages; page++) {
  const content = await (await doc.getPage(page)).getTextContent();
  // `items` mezcla texto con marcadores de estructura; sólo el texto tiene
  // `transform`, así que la comprobación además de filtrar acota el tipo.
  const items = content.items.flatMap((i) =>
    "str" in i && "transform" in i
      ? [{ str: i.str, x: i.transform[4] as number, y: i.transform[5] as number }]
      : [],
  );
  const { products, issues } = productsFromRows(rowsFromItems(items), page);
  parts.push({ pages: 1, products, issues });
}
const extraction = mergeResults(parts);

console.log("\n1. EXTRACCIÓN");
check("páginas", extraction.pages, doc.numPages);
check("filas ilegibles", extraction.issues.length, 0);
console.log(`  ok   productos leídos: ${extraction.products.length}`);

/* ------------------------------- 2. planear ------------------------------- */

const before = await readDb();
const beforeCount = before.products.length;
const beforeSnapshot = JSON.stringify(before.products);

const rules = before.syncRules.length
  ? before.syncRules
  : defaultRules(before.brands);

const { items, summary } = buildPlan({ extraction, db: before, rules });

console.log("\n2. PLAN");
console.log(
  `  ok   ${summary.found} encontrados · ${summary.created} nuevos · ${summary.updated} modificados · ${summary.removed} de baja · ${summary.errors} errores`,
);
check(
  "ninguna línea de error trae patch",
  items.filter((i) => i.kind === "error" && i.patch).length,
  0,
);
check(
  "todo producto nuevo nace en borrador",
  items
    .filter((i) => i.kind === "nuevo")
    .every((i) => (i.patch as { status?: string })?.status === "borrador"),
  true,
);
check(
  "ningún producto sin referencia de proveedor se da de baja",
  items.filter((i) => i.kind === "ausente").length,
  0,
);
check("el plan no escribió nada todavía", (await readDb()).products.length, beforeCount);

/* Dos filas del PDF no pueden engancharse al mismo producto de la tienda: la
   segunda le pisaría el precio a la primera en silencio. */
const reclamados = items
  .filter((i) => i.productId)
  .map((i) => i.productId as string);
check(
  "cada producto de la tienda lo reclama una sola línea",
  reclamados.length - new Set(reclamados).size,
  0,
);

/* -------------------------- 3. campos protegidos -------------------------- */

console.log("\n3. CAMPOS PROTEGIDOS");
const { onlySynced } = await import("../src/lib/sync/apply.ts");
const intruso = onlySynced({
  price: 1,
  name: "PISADO",
  description: "PISADO",
  slug: "pisado",
  tags: ["oferta"],
  featured: true,
  images: [{ id: "x", url: "x", alt: "x" }],
  categoryIds: ["x"],
} as never);
check(
  "sólo pasan los campos del proveedor",
  Object.keys(intruso).sort(),
  ["price"],
);

/* ------------------------------ 4. vincular ------------------------------- */

console.log("\n4. VINCULAR UN BORRADOR A UN PRODUCTO EXISTENTE");
const { relinkItem } = await import("../src/lib/sync/plan.ts");

const borrador = items.find((i) => i.kind === "nuevo");
const destino = before.products.find((p) => !p.supplierRef);

if (!borrador || !destino) {
  console.log("  info no hay caso para probar");
} else {
  const vinculado = relinkItem(borrador, destino, before);
  check("deja de ser producto nuevo", vinculado?.kind !== "nuevo", true);
  check("apunta al producto elegido", vinculado?.productId, destino.id);
  check("conserva el id de la línea", vinculado?.id, borrador.id);
  check(
    "graba la referencia para el próximo PDF",
    Boolean((vinculado?.patch as { supplierRef?: string })?.supplierRef),
    true,
  );
  check(
    "el precio manual del destino sigue sin moverse",
    (vinculado?.patch as { price?: number })?.price,
    undefined,
  );
  check(
    "se puede deshacer: guarda el valor anterior",
    (vinculado?.previous as { supplierPrice?: number })?.supplierPrice,
    destino.supplierPrice,
  );
}

/* ------------------------------- 5. margen -------------------------------- */

console.log("\n5. MARGEN");
const { publishedPrice, roundUpTo } = await import("../src/lib/sync/pricing.ts");
const cfgMargen = { pricingMode: "margen" as const, marginPercent: 35, marginFixed: 0 };
const cfgFijo = { pricingMode: "fijo" as const, marginPercent: 0, marginFixed: 15000 };
const ajustes = { ...cfgMargen, roundTo: 100 };

check("35% sobre 30.000 redondeado a 100", publishedPrice(30000, cfgMargen, ajustes), 40500);
check("monto fijo sobre 30.000", publishedPrice(30000, cfgFijo, ajustes), 45000);
check(
  "el modo manual no calcula nada",
  publishedPrice(30000, { ...cfgMargen, pricingMode: "manual" }, ajustes),
  null,
);
check("sin costo no hay precio", publishedPrice(0, cfgMargen, ajustes), null);
check("el redondeo va hacia arriba", roundUpTo(40401, 100), 40500);
check(
  "35% sobre 36.660 redondeado a 100",
  publishedPrice(36660, cfgMargen, ajustes),
  49500,
);

/* ------------------------------- 6. aplicar ------------------------------- */

const run = {
  id: `test_${Date.now().toString(36)}`,
  createdAt: new Date().toISOString(),
  appliedAt: null,
  fileName: "prueba.pdf",
  pages: extraction.pages,
  user: "prueba",
  status: "analizado" as const,
  summary,
  items,
};

const approved = items.filter((i) => i.patch).map((i) => i.id);
const { report, items: applied } = await applyPlan(run, approved);

const afterApply = await readDb();
console.log("\n6. APLICAR");
console.log(
  `  ok   ${report.created} creados · ${report.updated} actualizados · ${report.skipped} salteados · ${report.failed.length} fallidos`,
);
check("sin fallos", report.failed.length, 0);
check(
  "el catálogo creció exactamente lo planeado",
  afterApply.products.length,
  beforeCount + summary.created,
);
check(
  "todos los nuevos quedaron en borrador",
  afterApply.products.filter((p) => p.status === "borrador").length,
  summary.created,
);
/* Lo que importa no es que el costo no se registre —sí se registra— sino que
   el precio de venta de un producto en modo manual no se mueva jamás. */
const previos = new Map(
  (JSON.parse(beforeSnapshot) as typeof afterApply.products).map((p) => [
    p.id,
    p,
  ]),
);
const manualesMovidos = afterApply.products.filter((p) => {
  const antes = previos.get(p.id);
  return antes?.pricingMode === "manual" && antes.price !== p.price;
});
check("ningún precio manual se movió", manualesMovidos.length, 0);

const bajoCosto = afterApply.products.filter(
  (p) => p.supplierPrice > 0 && p.price <= p.supplierPrice,
);
console.log(
  `  info productos que quedarían por debajo del costo: ${bajoCosto.length}` +
    (bajoCosto.length
      ? ` (${bajoCosto.map((p) => `${p.name} $${p.price} vs costo $${p.supplierPrice}`).join("; ")})`
      : ""),
);

/* ------------------------------ 7. deshacer ------------------------------- */

const rollback = await rollbackPlan({ ...run, items: applied });
const afterRollback = await readDb();

console.log("\n7. DESHACER");
console.log(
  `  ok   ${rollback.created} borrados · ${rollback.updated} restaurados · ${rollback.failed.length} fallidos`,
);
check("sin fallos", rollback.failed.length, 0);
check("el catálogo volvió a su tamaño", afterRollback.products.length, beforeCount);

/* Comparación campo por campo, informando exactamente qué difiere. Comparar
   los JSON enteros sólo dice "no son iguales", que no alcanza para saber si
   quedó algo mal o si sólo se movió la marca de tiempo. */
const original = JSON.parse(beforeSnapshot) as typeof afterRollback.products;
const diffs: string[] = [];
for (const antes of original) {
  const ahora = afterRollback.products.find((p) => p.id === antes.id);
  if (!ahora) {
    diffs.push(`${antes.id}: desapareció`);
    continue;
  }
  for (const key of Object.keys(antes) as (keyof typeof antes)[]) {
    if (JSON.stringify(antes[key]) !== JSON.stringify(ahora[key])) {
      diffs.push(
        `${antes.slug}.${String(key)}: ${JSON.stringify(antes[key])} → ${JSON.stringify(ahora[key])}`,
      );
    }
  }
}
const soloMarcaDeTiempo = diffs.every((d) => d.includes(".updatedAt:"));
check(
  "el catálogo volvió idéntico salvo la marca de tiempo",
  soloMarcaDeTiempo,
  true,
);
if (diffs.length) {
  console.log(`  info ${diffs.length} campos cambiados tras deshacer:`);
  for (const d of diffs.slice(0, 12)) console.log(`         ${d}`);
}

/* -------------------------------- cierre ---------------------------------- */

await repo().updateImport(run.id, {}); // no-op: sólo comprueba que el driver responde

console.log(
  failures === 0
    ? "\nTODO OK — el ciclo completo deja el catálogo como estaba.\n"
    : `\n${failures} COMPROBACIONES FALLARON\n`,
);
process.exit(failures === 0 ? 0 : 1);
