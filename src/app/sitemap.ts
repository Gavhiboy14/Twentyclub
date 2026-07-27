import type { MetadataRoute } from "next";
import { getAllProducts, getBrands } from "@/lib/data/queries";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Se regenera cada hora: los productos nuevos entran solos. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands] = await Promise.all([getAllProducts(), getBrands()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ofertas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...staticRoutes,
    ...brands.map((brand) => ({
      url: `${base}/marca/${brand.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/producto/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
