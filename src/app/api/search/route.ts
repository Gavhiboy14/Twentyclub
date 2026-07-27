import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

/** Buscador del sitio: marca, modelo, nombre completo, color, materiales y SKU. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const products = await getProducts({ q, sort: "vendidos" });

  return NextResponse.json({
    results: products.slice(0, 8).map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand.name,
      color: p.color,
      price: p.finalPrice,
      image: p.images[0].url,
      inStock: p.inStock,
    })),
  });
}
