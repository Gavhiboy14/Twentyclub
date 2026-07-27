import { NextResponse } from "next/server";
import { readDb, repo } from "@/lib/data/store";
import { productSchema } from "@/lib/admin/schemas";
import { badRequest, requireAdmin } from "@/lib/admin/guard";
import { slugify } from "@/lib/utils";
import { uniqueSlug } from "@/lib/admin/slug";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const input = parsed.data;
  const db = await readDb();

  const brand = db.brands.find((b) => b.id === input.brandId);
  if (!brand) return badRequest("Esa marca no existe");

  const slug = uniqueSlug(
    slugify(`${brand.name} ${input.name}`),
    db.products.map((p) => p.slug),
  );
  const now = new Date().toISOString();

  const record: Product = {
    id: `prod_${slug}_${Date.now().toString(36)}`,
    slug,
    name: input.name,
    brandId: input.brandId,
    categoryIds: input.categoryIds,
    price: input.price,
    discount: input.discount,
    description: input.description,
    features: input.features,
    color: input.color,
    colorHex: input.colorHex,
    materials: input.materials,
    tags: input.tags,
    sku:
      input.sku ||
      `TC-${brand.slug.slice(0, 3).toUpperCase()}-${String(
        db.products.length + 1,
      ).padStart(3, "0")}`,
    images: input.images,
    sizes: input.sizes,
    featured: input.featured,
    views: input.views ?? 0,
    sold: input.sold ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const product = await repo().createProduct(record);
  return NextResponse.json({ product }, { status: 201 });
}
