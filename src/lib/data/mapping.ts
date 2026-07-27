import type {
  Banner,
  Brand,
  Category,
  Offer,
  Order,
  Product,
  ProductImage,
  ProductTag,
  SizeStock,
} from "@/lib/types";
import type { CollectionName } from "@/lib/admin/schemas";
import type { Row } from "./repo";

/**
 * Traducción entre las columnas de Postgres (snake_case) y los tipos de la app
 * (camelCase). Vive acá y en ningún otro lado: si agregás una columna, este es
 * el archivo que hay que tocar.
 */

type PgRow = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const bool = (v: unknown, fallback = false) =>
  typeof v === "boolean" ? v : fallback;
const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/* ------------------------------- Productos -------------------------------- */

export function productFromRow(row: PgRow): Product {
  return {
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.name),
    brandId: str(row.brand_id),
    categoryIds: list(row.category_ids),
    price: num(row.price),
    discount: num(row.discount),
    description: str(row.description),
    features: list(row.features),
    color: str(row.color),
    colorHex: str(row.color_hex, "#b4b0a0"),
    materials: list(row.materials),
    tags: list(row.tags) as ProductTag[],
    sku: str(row.sku),
    images: (Array.isArray(row.images) ? row.images : []) as ProductImage[],
    sizes: (Array.isArray(row.sizes) ? row.sizes : []) as SizeStock[],
    featured: bool(row.featured),
    views: num(row.views),
    sold: num(row.sold),
    createdAt: str(row.created_at, new Date().toISOString()),
    updatedAt: str(row.updated_at, new Date().toISOString()),
  };
}

/** Sólo emite las claves presentes: sirve igual para insert y para patch. */
export function productToRow(product: Partial<Product>): PgRow {
  const row: PgRow = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined) row[key] = value;
  };

  put("id", product.id);
  put("slug", product.slug);
  put("name", product.name);
  put("brand_id", product.brandId);
  put("category_ids", product.categoryIds);
  put("price", product.price);
  put("discount", product.discount);
  put("description", product.description);
  put("features", product.features);
  put("color", product.color);
  put("color_hex", product.colorHex);
  put("materials", product.materials);
  put("tags", product.tags);
  put("sku", product.sku);
  put("images", product.images);
  put("sizes", product.sizes);
  put("featured", product.featured);
  put("views", product.views);
  put("sold", product.sold);
  put("created_at", product.createdAt);
  put("updated_at", product.updatedAt);

  return row;
}

/* -------------------------------- Pedidos --------------------------------- */

export function orderFromRow(row: PgRow): Order {
  const customer = (row.customer ?? {}) as Partial<Order["customer"]>;
  return {
    id: str(row.id),
    code: str(row.code),
    createdAt: str(row.created_at, new Date().toISOString()),
    customer: {
      name: str(customer.name),
      phone: str(customer.phone),
      note: str(customer.note),
    },
    items: (Array.isArray(row.items) ? row.items : []) as Order["items"],
    total: num(row.total),
    status: str(row.status, "pendiente") as Order["status"],
  };
}

export function orderToRow(order: Partial<Order>): PgRow {
  const row: PgRow = {};
  if (order.id !== undefined) row.id = order.id;
  if (order.code !== undefined) row.code = order.code;
  if (order.createdAt !== undefined) row.created_at = order.createdAt;
  if (order.customer !== undefined) row.customer = order.customer;
  if (order.items !== undefined) row.items = order.items;
  if (order.total !== undefined) row.total = order.total;
  if (order.status !== undefined) row.status = order.status;
  return row;
}

/* -------------------------- Colecciones simples --------------------------- */

export function brandFromRow(row: PgRow): Brand {
  return {
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.name),
    wordmark: str(row.wordmark) || str(row.name).toUpperCase(),
    logo: (row.logo as string | null) ?? null,
    banner: (row.banner as string | null) ?? null,
    description: str(row.description),
    order: num(row.order),
  };
}

export function categoryFromRow(row: PgRow): Category {
  return {
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.name),
    cover: (row.cover as string | null) ?? null,
    description: str(row.description),
  };
}

export function bannerFromRow(row: PgRow): Banner {
  return {
    id: str(row.id),
    placement: str(row.placement, "promo") as Banner["placement"],
    eyebrow: str(row.eyebrow),
    title: str(row.title),
    subtitle: str(row.subtitle),
    image: (row.image as string | null) ?? null,
    ctaLabel: str(row.cta_label, "Ver más"),
    ctaHref: str(row.cta_href, "/productos"),
    active: bool(row.active, true),
    order: num(row.order),
  };
}

export function offerFromRow(row: PgRow): Offer {
  return {
    id: str(row.id),
    title: str(row.title),
    description: str(row.description),
    discount: num(row.discount),
    productIds: list(row.product_ids),
    startsAt: str(row.starts_at, new Date().toISOString()),
    endsAt: str(row.ends_at, new Date().toISOString()),
    active: bool(row.active, true),
  };
}

/** Claves camelCase → snake_case por colección, sólo donde difieren. */
const COLUMN_ALIASES: Record<CollectionName, Record<string, string>> = {
  brands: {},
  categories: {},
  banners: { ctaLabel: "cta_label", ctaHref: "cta_href" },
  offers: { productIds: "product_ids", startsAt: "starts_at", endsAt: "ends_at" },
};

export function recordToRow(collection: CollectionName, record: Row): PgRow {
  const aliases = COLUMN_ALIASES[collection];
  const row: PgRow = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    row[aliases[key] ?? key] = value;
  }
  return row;
}

export const ROW_MAPPERS: Record<CollectionName, (row: PgRow) => Row> = {
  brands: (row) => brandFromRow(row) as unknown as Row,
  categories: (row) => categoryFromRow(row) as unknown as Row,
  banners: (row) => bannerFromRow(row) as unknown as Row,
  offers: (row) => offerFromRow(row) as unknown as Row,
};
