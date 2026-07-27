import type {
  Banner,
  BannerPlacement,
  Brand,
  Category,
  Offer,
  Order,
  Product,
  ProductView,
  Settings,
} from "@/lib/types";
import { toProductView } from "@/lib/utils";
import type { Facets, ProductQuery } from "@/lib/catalog";
import { readDb } from "./store";

function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Índice de texto de un producto: marca, modelo, color, materiales y SKU. */
function searchIndex(p: ProductView) {
  return normalize(
    [
      p.brand.name,
      p.name,
      `${p.brand.name} ${p.name}`,
      p.color,
      p.sku,
      ...p.materials,
    ].join(" "),
  );
}

/* -------------------------------------------------------------------------- */
/* Lecturas base                                                              */
/* -------------------------------------------------------------------------- */

export async function getSettings(): Promise<Settings> {
  return (await readDb()).settings;
}

export async function getBrands(): Promise<Brand[]> {
  const db = await readDb();
  return [...db.brands].sort((a, b) => a.order - b.order);
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const db = await readDb();
  return db.brands.find((b) => b.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  return (await readDb()).categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = await readDb();
  return db.categories.find((c) => c.slug === slug) ?? null;
}

export async function getBanners(placement?: BannerPlacement): Promise<Banner[]> {
  const db = await readDb();
  return db.banners
    .filter((b) => b.active && (!placement || b.placement === placement))
    .sort((a, b) => a.order - b.order);
}

export async function getHeroBanner(): Promise<Banner | null> {
  return (await getBanners("hero"))[0] ?? null;
}

export async function getOffers(): Promise<Offer[]> {
  const db = await readDb();
  const now = Date.now();
  return db.offers.filter(
    (o) =>
      o.active &&
      Date.parse(o.startsAt) <= now &&
      Date.parse(o.endsAt) >= now,
  );
}

export async function getOrders(): Promise<Order[]> {
  const db = await readDb();
  return [...db.orders].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/* -------------------------------------------------------------------------- */
/* Catálogo                                                                   */
/* -------------------------------------------------------------------------- */

export async function getAllProducts(): Promise<ProductView[]> {
  const db = await readDb();
  return db.products.map((p) => toProductView(p, db.brands));
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductView[]> {
  const all = await getAllProducts();
  const q = query.q ? normalize(query.q) : "";
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];

  let list = all.filter((p) => {
    if (terms.length) {
      const haystack = searchIndex(p);
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    if (query.brands?.length && !query.brands.includes(p.brand.slug)) return false;
    if (query.categories?.length) {
      const slugs = query.categories;
      const hit = p.categoryIds.some((id) => slugs.includes(id.replace("cat_", "")));
      if (!hit) return false;
    }
    if (query.sizes?.length) {
      const hit = p.visibleSizes.some((s) => query.sizes!.includes(s.size));
      if (!hit) return false;
    }
    if (query.colors?.length && !query.colors.includes(p.color)) return false;
    if (query.minPrice != null && p.finalPrice < query.minPrice) return false;
    if (query.maxPrice != null && p.finalPrice > query.maxPrice) return false;
    if (query.available && !p.inStock) return false;
    if (query.offers && p.discount <= 0) return false;
    return true;
  });

  const sort = query.sort ?? "vendidos";
  list = list.sort((a, b) => {
    switch (sort) {
      case "nuevos":
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      case "precio-asc":
        return a.finalPrice - b.finalPrice;
      case "precio-desc":
        return b.finalPrice - a.finalPrice;
      default:
        return b.sold - a.sold;
    }
  });

  // Los agotados siempre van al final, ordenados entre sí.
  return [...list.filter((p) => p.inStock), ...list.filter((p) => !p.inStock)];
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  const db = await readDb();
  const product = db.products.find((p) => p.slug === slug);
  return product ? toProductView(product, db.brands) : null;
}

export async function getRelatedProducts(
  product: ProductView,
  limit = 4,
): Promise<ProductView[]> {
  const all = await getAllProducts();
  const scored = all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.brandId === product.brandId) score += 3;
      score += p.categoryIds.filter((c) => product.categoryIds.includes(c)).length * 2;
      if (Math.abs(p.finalPrice - product.finalPrice) < 60_000) score += 1;
      if (p.inStock) score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || b.p.sold - a.p.sold);

  return scored.slice(0, limit).map((s) => s.p);
}

export async function getFeaturedProducts(limit = 6): Promise<ProductView[]> {
  const all = await getAllProducts();
  return all
    .filter((p) => p.featured && p.inStock)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<ProductView[]> {
  const all = await getAllProducts();
  return all
    .filter((p) => p.inStock)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export async function getBestSellers(limit = 8): Promise<ProductView[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.inStock).sort((a, b) => b.sold - a.sold).slice(0, limit);
}

export async function getDiscountedProducts(): Promise<ProductView[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount);
}

export async function getProductsByIds(ids: string[]): Promise<ProductView[]> {
  const all = await getAllProducts();
  return ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is ProductView => Boolean(p));
}

/** Valores disponibles para armar los controles de filtro. */
export async function getFilterFacets(): Promise<Facets> {
  const all = await getAllProducts();
  const sizes = new Set<string>();
  const colors = new Map<string, string>();

  for (const p of all) {
    p.visibleSizes.forEach((s) => sizes.add(s.size));
    colors.set(p.color, p.colorHex);
  }

  const prices = all.map((p) => p.finalPrice);

  return {
    sizes: [...sizes].sort((a, b) => Number(a) - Number(b)),
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

/** Un modelo entra en "stock bajo" cuando le quedan ocho pares o menos. */
export const LOW_STOCK_THRESHOLD = 8;

export interface DashboardStats {
  totalOrders: number;
  ordersByStatus: Record<Order["status"], number>;
  revenue: number;
  unitsSold: number;
  outOfStock: number;
  lowStock: Array<{ id: string; slug: string; label: string; stock: number }>;
  mostViewed: Array<{ label: string; views: number }>;
  topSellers: Array<{ label: string; sold: number }>;
  salesByBrand: Array<{ brand: string; units: number }>;
  ordersTimeline: Array<{ date: string; pedidos: number; monto: number }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await readDb();
  const views = db.products.map((p) => toProductView(p, db.brands));

  const ordersByStatus = {
    pendiente: 0,
    contactado: 0,
    finalizado: 0,
    cancelado: 0,
  } as Record<Order["status"], number>;
  for (const o of db.orders) ordersByStatus[o.status]++;

  const revenue = db.orders
    .filter((o) => o.status === "finalizado")
    .reduce((acc, o) => acc + o.total, 0);

  const lowStock = views
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      label: `${p.brand.name} ${p.name}`,
      stock: p.totalStock,
    }))
    .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  const salesByBrand = db.brands
    .map((b) => ({
      brand: b.name,
      units: db.products
        .filter((p) => p.brandId === b.id)
        .reduce((acc, p) => acc + p.sold, 0),
    }))
    .sort((a, b) => b.units - a.units);

  // Últimos 14 días de pedidos, incluyendo los días sin movimiento.
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersTimeline = Array.from({ length: days }, (_, i) => {
    const day = new Date(today.getTime() - (days - 1 - i) * 86_400_000);
    const next = new Date(day.getTime() + 86_400_000);
    const inDay = db.orders.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= day.getTime() && t < next.getTime();
    });
    return {
      date: new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(day),
      pedidos: inDay.length,
      monto: inDay.reduce((acc, o) => acc + o.total, 0),
    };
  });

  return {
    totalOrders: db.orders.length,
    ordersByStatus,
    revenue,
    unitsSold: db.products.reduce((acc, p) => acc + p.sold, 0),
    outOfStock: views.filter((p) => !p.inStock).length,
    lowStock: lowStock.slice(0, 8),
    mostViewed: [...views]
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map((p) => ({ label: `${p.brand.name} ${p.name}`, views: p.views })),
    topSellers: [...views]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6)
      .map((p) => ({ label: `${p.brand.name} ${p.name}`, sold: p.sold })),
    salesByBrand,
    ordersTimeline,
  };
}

/** Productos crudos para el panel (sin filtrar talles agotados). */
export async function getAdminProducts(): Promise<Array<Product & { brandName: string }>> {
  const db = await readDb();
  return [...db.products]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map((p) => ({
      ...p,
      brandName: db.brands.find((b) => b.id === p.brandId)?.name ?? "—",
    }));
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const db = await readDb();
  return db.products.find((p) => p.id === id) ?? null;
}

