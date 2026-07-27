import { NextResponse } from "next/server";
import { readDb, repo } from "@/lib/data/store";
import { productSchema } from "@/lib/admin/schemas";
import { badRequest, notFound, onlySent, requireAdmin } from "@/lib/admin/guard";
import { uniqueSlug } from "@/lib/admin/slug";
import { slugify } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const raw = await request.json();
  const parsed = productSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const patch: Partial<Product> = onlySent(raw, parsed.data);
  const db = await readDb();
  const current = db.products.find((p) => p.id === id);
  if (!current) return notFound("Ese producto ya no existe");

  // Si cambió el modelo o la marca, el slug se regenera para que la URL siga
  // describiendo el producto.
  const nameChanged = patch.name !== undefined && patch.name !== current.name;
  const brandChanged =
    patch.brandId !== undefined && patch.brandId !== current.brandId;

  if (nameChanged || brandChanged) {
    const brandId = patch.brandId ?? current.brandId;
    const brand = db.brands.find((b) => b.id === brandId);
    patch.slug = uniqueSlug(
      slugify(`${brand?.name ?? ""} ${patch.name ?? current.name}`),
      db.products.filter((p) => p.id !== id).map((p) => p.slug),
    );
  }

  patch.updatedAt = new Date().toISOString();

  const product = await repo().updateProduct(id, patch);
  if (!product) return notFound("Ese producto ya no existe");
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const removed = await repo().deleteProduct(id);
  if (!removed) return notFound("Ese producto ya no existe");
  return NextResponse.json({ ok: true });
}

/** Duplicar: copia el producto con stock en cero y sin etiquetas. */
export async function POST(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const db = await readDb();
  const source = db.products.find((p) => p.id === id);
  if (!source) return notFound("Ese producto ya no existe");

  const slug = uniqueSlug(
    `${source.slug}-copia`,
    db.products.map((p) => p.slug),
  );
  const now = new Date().toISOString();

  const copy: Product = {
    ...structuredClone(source),
    id: `prod_${slug}_${Date.now().toString(36)}`,
    slug,
    name: `${source.name} (copia)`,
    sku: `${source.sku}-C`,
    tags: [],
    featured: false,
    sold: 0,
    views: 0,
    sizes: source.sizes.map((s) => ({ ...s, stock: 0 })),
    createdAt: now,
    updatedAt: now,
  };

  const product = await repo().createProduct(copy);
  return NextResponse.json({ product }, { status: 201 });
}
