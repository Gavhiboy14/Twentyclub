import { NextResponse } from "next/server";
import { readDb, repo } from "@/lib/data/store";
import { COLLECTION_SCHEMAS, type CollectionName } from "@/lib/admin/schemas";
import { badRequest, notFound, onlySent, requireAdmin } from "@/lib/admin/guard";
import { uniqueSlug } from "@/lib/admin/slug";
import { slugify } from "@/lib/utils";
import type { Row } from "@/lib/data/repo";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ name: string; id: string }> };

function isCollection(value: string): value is CollectionName {
  return value in COLLECTION_SCHEMAS;
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { name, id } = await params;
  if (!isCollection(name)) return badRequest("Colección desconocida");

  const raw = await request.json();
  const parsed = COLLECTION_SCHEMAS[name].partial().safeParse(raw);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const patch = onlySent(raw, parsed.data) as Record<string, unknown>;

  // Marcas y categorías tienen slug: si cambia el nombre, la URL lo sigue.
  const newName = patch.name;
  if ((name === "brands" || name === "categories") && typeof newName === "string") {
    const db = await readDb();
    const siblings = name === "brands" ? db.brands : db.categories;
    patch.slug = uniqueSlug(
      slugify(newName),
      siblings.filter((item) => item.id !== id).map((item) => item.slug),
    );
    if (name === "brands") patch.wordmark = newName.toUpperCase();
  }

  const item = await repo().updateRecord(name, id, patch as Row);
  if (!item) return notFound();
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { name, id } = await params;
  if (!isCollection(name)) return badRequest("Colección desconocida");

  const result = await repo().deleteRecord(name, id);

  if (result === "missing") return notFound();
  if (result === "in-use") {
    return badRequest(
      "Esa marca tiene productos cargados. Movelos o borralos primero.",
    );
  }

  return NextResponse.json({ ok: true });
}
