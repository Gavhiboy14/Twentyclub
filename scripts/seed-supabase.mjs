/**
 * Carga el catálogo semilla en Supabase y sube las imágenes generadas al bucket.
 *
 *   npm run seed:supabase                    # carga inicial (se niega si ya hay datos)
 *   npm run seed:supabase -- --images-only   # sólo empuja imágenes a Storage
 *   npm run seed:supabase -- --force         # borra todo y vuelve a cargar
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local, y
 * haber ejecutado supabase/schema.sql una vez desde el SQL Editor.
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");
const imagesOnly = process.argv.includes("--images-only");
const BUCKET = "productos";

/* ------------------------------- Entorno ---------------------------------- */

async function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = await readFile(resolve(root, file), "utf8");
      for (const line of raw.split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        const [, key, value] = match;
        if (!process.env[key]) {
          process.env[key] = value.replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // El archivo puede no existir: las variables ya pueden venir del entorno.
    }
  }
}

/* ------------------------- Catálogo semilla (TS) --------------------------- */

/**
 * `seed.ts` es TypeScript y este script corre en Node pelado, así que en vez de
 * importarlo se reutiliza el JSON que genera el driver local. Si no existe, se
 * crea corriendo el sitio una vez con DATA_DRIVER=local.
 */
async function loadSeed() {
  try {
    return JSON.parse(await readFile(resolve(root, ".data/db.json"), "utf8"));
  } catch {
    throw new Error(
      "No encontré .data/db.json.\n" +
        "Arrancá el sitio una vez con `npm run dev` (DATA_DRIVER=local) para que\n" +
        "se genere el catálogo semilla, y después volvé a correr este script.",
    );
  }
}

/* -------------------------------- Mapeo ----------------------------------- */

const toProductRow = (p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brand_id: p.brandId,
  category_ids: p.categoryIds,
  price: p.price,
  discount: p.discount,
  description: p.description,
  features: p.features,
  color: p.color,
  color_hex: p.colorHex,
  materials: p.materials,
  tags: p.tags,
  sku: p.sku,
  images: p.images,
  sizes: p.sizes,
  featured: p.featured,
  views: p.views,
  sold: p.sold,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

const toBannerRow = (b) => ({
  id: b.id,
  placement: b.placement,
  eyebrow: b.eyebrow,
  title: b.title,
  subtitle: b.subtitle,
  image: b.image,
  cta_label: b.ctaLabel,
  cta_href: b.ctaHref,
  active: b.active,
  order: b.order,
});

const toOfferRow = (o) => ({
  id: o.id,
  title: o.title,
  description: o.description,
  discount: o.discount,
  product_ids: o.productIds,
  starts_at: o.startsAt,
  ends_at: o.endsAt,
  active: o.active,
});

const toOrderRow = (o) => ({
  id: o.id,
  code: o.code,
  created_at: o.createdAt,
  customer: o.customer,
  items: o.items,
  total: o.total,
  status: o.status,
});

/* ------------------------------- Imágenes --------------------------------- */

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * Sube /public/products, /public/brands y /public/uploads al bucket y
 * devuelve un mapa "/products/x.svg" → URL pública de Storage.
 *
 * "uploads" es la carpeta donde caen las fotos reales que subís desde el
 * panel con DATA_DRIVER=local — sin esta carpeta, esas fotos nunca migran y
 * los productos quedan apuntando a un archivo que sólo existe en tu disco.
 */
async function uploadImages(db) {
  const storage = db.storage.from(BUCKET);
  const map = new Map();

  for (const folder of ["products", "brands", "uploads"]) {
    let files = [];
    try {
      files = await readdir(resolve(root, "public", folder));
    } catch {
      continue;
    }

    for (const file of files) {
      const ext = extname(file).toLowerCase();
      const contentType = MIME[ext];
      if (!contentType) continue;

      const path = `${folder}/${file}`;
      const body = await readFile(resolve(root, "public", folder, file));

      const { error } = await storage.upload(path, body, {
        contentType,
        upsert: true,
      });
      if (error) throw new Error(`subiendo ${path}: ${error.message}`);

      map.set(`/${path}`, storage.getPublicUrl(path).data.publicUrl);
    }
  }

  console.log(`  ↑ ${map.size} imágenes en Storage`);
  return map;
}

/** Reemplaza las rutas locales por las URLs públicas de Storage. */
function rewrite(url, map) {
  if (!url) return url;
  return map.get(url) ?? url;
}

/* --------------------------------- Main ----------------------------------- */

async function main() {
  await loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Clave nueva (sb_secret_…) o la legacy service_role.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local",
    );
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  console.log(`→ ${url}`);

  // Modo sólo-imágenes: regenerás los SVG con `npm run gen:images` y los
  // empujás a Storage sin tocar una fila de la base.
  if (imagesOnly) {
    await uploadImages(db);
    console.log("\nListo. Sólo se actualizaron las imágenes.");
    return;
  }

  const seed = await loadSeed();

  /*
   * Protección contra pérdida de datos.
   *
   * Este script carga el catálogo desde .data/db.json, que es una foto local.
   * Si ya venís administrando desde el panel contra Supabase, ese archivo está
   * desactualizado y correr el seed pisaría tu catálogo real con datos viejos.
   */
  const { count, error: countError } = await db
    .from("products")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`consultando la base: ${countError.message}`);

  if ((count ?? 0) > 0 && !force) {
    throw new Error(
      `La base ya tiene ${count} productos.\n\n` +
        "Este script carga desde .data/db.json (una foto local) y pisaría lo que\n" +
        "tengas cargado desde el panel. Si es lo que querés, repetilo con --force.\n\n" +
        "Si sólo necesitás actualizar las imágenes generadas:\n" +
        "  npm run seed:supabase -- --images-only",
    );
  }

  if (force) {
    console.log("  × borrando datos existentes");
    // El orden importa: products referencia brands.
    for (const table of ["orders", "offers", "banners", "products", "categories", "brands"]) {
      const { error } = await db.from(table).delete().neq("id", "");
      if (error) throw new Error(`limpiando ${table}: ${error.message}`);
    }
  }

  const images = await uploadImages(db);

  const steps = [
    ["brands", seed.brands.map((b) => ({ ...b, banner: rewrite(b.banner, images), logo: rewrite(b.logo, images) }))],
    ["categories", seed.categories.map((c) => ({ ...c, cover: rewrite(c.cover, images) }))],
    [
      "products",
      seed.products.map((p) =>
        toProductRow({
          ...p,
          images: p.images.map((img) => ({ ...img, url: rewrite(img.url, images) })),
        }),
      ),
    ],
    ["banners", seed.banners.map((b) => toBannerRow({ ...b, image: rewrite(b.image, images) }))],
    ["offers", seed.offers.map(toOfferRow)],
    ["orders", seed.orders.map(toOrderRow)],
  ];

  for (const [table, rows] of steps) {
    if (rows.length === 0) continue;
    const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`cargando ${table}: ${error.message}`);
    console.log(`  ✓ ${table}: ${rows.length}`);
  }

  const { error: settingsError } = await db
    .from("settings")
    .upsert({ id: 1, data: seed.settings });
  if (settingsError) throw new Error(`cargando settings: ${settingsError.message}`);
  console.log("  ✓ settings");

  console.log("\nListo. Poné DATA_DRIVER=supabase y arrancá el sitio.");
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
