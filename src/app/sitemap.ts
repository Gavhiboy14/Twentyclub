import type { MetadataRoute } from "next";
import { getAllProducts, getBrands } from "@/lib/data/queries";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Se genera en cada visita, no en el build. Si se prerenderizara al buildear,
 * el deploy entero dependería de que la base esté accesible justo en ese
 * momento — alcanza con que Supabase tarde un segundo de más para que se
 * caiga todo el sitio por culpa del sitemap.
 */
export const dynamic = "force-dynamic";

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
