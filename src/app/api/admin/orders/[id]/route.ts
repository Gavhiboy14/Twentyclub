import { NextResponse } from "next/server";
import { readDb, repo } from "@/lib/data/store";
import { orderPatchSchema } from "@/lib/admin/schemas";
import { badRequest, notFound, requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const parsed = orderPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const db = await readDb();
  const current = db.orders.find((o) => o.id === id);
  if (!current) return notFound("Ese pedido ya no existe");

  const order = await repo().updateOrder(id, parsed.data);
  if (!order) return notFound("Ese pedido ya no existe");

  // Al dar un pedido por finalizado se descuenta el stock y se suman las
  // ventas. Sólo la primera vez: volver a marcarlo no descuenta de nuevo.
  if (current.status !== "finalizado" && order.status === "finalizado") {
    await repo().commitOrderStock(order);
  }

  return NextResponse.json({ order });
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const removed = await repo().deleteOrder(id);
  if (!removed) return notFound("Ese pedido ya no existe");
  return NextResponse.json({ ok: true });
}
