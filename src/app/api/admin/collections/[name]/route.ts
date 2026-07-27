import { NextResponse } from "next/server";
import { readDb, repo } from "@/lib/data/store";
import { COLLECTION_SCHEMAS, type CollectionName } from "@/lib/admin/schemas";
import { badRequest, requireAdmin } from "@/lib/admin/guard";
import { uniqueSlug } from "@/lib/admin/slug";
import { slugify } from "@/lib/utils";
import type { Row } from "@/lib/data/repo";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ name: string }> };

function isCollection(value: string): value is CollectionName {
  return value in COLLECTION_SCHEMAS;
}

/**
 * Alta genérica para marcas, categorías, banners y ofertas: las cuatro son
 * listas planas con la misma forma de operación, así que comparten ruta.
 * Los productos tienen su propio endpoint porque generan slug y SKU.
 */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { name } = await params;
  if (!isCollection(name)) return badRequest("Colección desconocida");

  const parsed = COLLECTION_SCHEMAS[name].safeParse(await request.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const db = await readDb();
  const stamp = Date.now().toString(36);
  const input = parsed.data as Record<string, unknown>;
  let row: Row;

  switch (name) {
    case "brands": {
      const brandName = String(input.name);
      row = {
        ...input,
        id: `brand_${stamp}`,
        slug: uniqueSlug(slugify(brandName), db.brands.map((b) => b.slug)),
        wordmark: brandName.toUpperCase(),
      };
      break;
    }
    case "categories": {
      row = {
        ...input,
        id: `cat_${stamp}`,
        slug: uniqueSlug(
          slugify(String(input.name)),
          db.categories.map((c) => c.slug),
        ),
      };
      break;
    }
    case "banners":
      row = { ...input, id: `banner_${stamp}` };
      break;
    default:
      row = { ...input, id: `offer_${stamp}` };
  }

  const item = await repo().createRecord(name, row);
  return NextResponse.json({ item }, { status: 201 });
}
