import { NextResponse } from "next/server";
import { z } from "zod";
import { readDb, repo } from "@/lib/data/store";
import { badRequest, notFound, requireAdmin } from "@/lib/admin/guard";
import { applyPlan, rollbackPlan } from "@/lib/sync/apply";
import { relinkItem, summarize } from "@/lib/sync/plan";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  action: z.enum(["aplicar", "revertir", "vincular"]),
  /** Líneas aprobadas. Sólo se usa al aplicar. */
  itemIds: z.array(z.string()).default([]),
  /** Sólo al vincular: qué línea a qué producto de la tienda. */
  itemId: z.string().optional(),
  productId: z.string().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const run = await repo().getImport((await params).id);
  return run ? NextResponse.json(run) : notFound("Esa importación no existe");
}

/**
 * Confirma o deshace una importación.
 *
 * Es el único punto del módulo que escribe en el catálogo, y sólo llega acá
 * por una acción explícita del administrador: analizar nunca modifica nada.
 */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Falta indicar qué hacer");

  const store = repo();
  const id = (await params).id;
  const run = await store.getImport(id);
  if (!run) return notFound("Esa importación no existe");

  if (parsed.data.action === "vincular") {
    if (run.status !== "analizado") {
      return badRequest("Esta importación ya se aplicó");
    }
    const { itemId, productId } = parsed.data;
    if (!itemId || !productId) return badRequest("Faltan datos para vincular");

    const db = await readDb();
    const product = db.products.find((p) => p.id === productId);
    if (!product) return notFound("Ese producto no existe");

    const index = run.items.findIndex((item) => item.id === itemId);
    if (index === -1) return notFound("Esa línea no existe");

    const linked = relinkItem(run.items[index], product, db);
    if (!linked) {
      return badRequest("Sólo se puede vincular una línea de producto nuevo");
    }

    /* Si otra línea ya apuntaba a ese producto quedarían dos escribiendo
       encima, que es justo lo que el plan evita en el cruce automático. */
    const clash = run.items.some(
      (item, i) => i !== index && item.productId === productId,
    );
    if (clash) {
      return badRequest("Otra línea de esta importación ya usa ese producto");
    }

    const items = [...run.items];
    items[index] = linked;
    const updated = await store.updateImport(id, {
      items,
      summary: summarize(items),
    });
    return NextResponse.json({ run: updated, item: linked });
  }

  if (parsed.data.action === "aplicar") {
    if (run.status !== "analizado") {
      return badRequest(
        run.status === "aplicado"
          ? "Esta importación ya se aplicó"
          : "Esta importación se revirtió y no se puede volver a aplicar",
      );
    }

    const { report, items } = await applyPlan(run, parsed.data.itemIds);
    const updated = await store.updateImport(id, {
      status: "aplicado",
      appliedAt: new Date().toISOString(),
      items,
      // El resumen se recalcula sobre lo que realmente se escribió.
      summary: { ...summarize(items), errors: report.failed.length },
    });
    return NextResponse.json({ run: updated, report });
  }

  if (run.status !== "aplicado") {
    return badRequest("Sólo se puede deshacer una importación aplicada");
  }

  const report = await rollbackPlan(run);
  const updated = await store.updateImport(id, { status: "revertido" });
  return NextResponse.json({ run: updated, report });
}
