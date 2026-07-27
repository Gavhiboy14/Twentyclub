import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { readDb, repo } from "@/lib/data/store";
import { buildOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import { finalPrice, PLACEHOLDER_IMAGE } from "@/lib/utils";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        size: z.string(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  customer: z
    .object({
      name: z.string().max(80).optional().default(""),
      phone: z.string().max(40).optional().default(""),
      note: z.string().max(500).optional().default(""),
    })
    .optional(),
});

/**
 * Registra el pedido y devuelve el link de WhatsApp ya armado.
 * Los precios se recalculan acá: nunca se confía en lo que manda el cliente.
 */
export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "El pedido llegó incompleto. Volvé a intentar." },
      { status: 400 },
    );
  }

  const { items: requested, customer } = parsed.data;
  const db = await readDb();

  const items: OrderItem[] = [];
  for (const line of requested) {
    const product = db.products.find((p) => p.id === line.productId);
    if (!product) continue;
    const size = product.sizes.find((s) => s.size === line.size);
    if (!size || !size.available || size.stock <= 0) continue;

    const brand = db.brands.find((b) => b.id === product.brandId);
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: brand?.name ?? "",
      size: line.size,
      qty: Math.min(line.qty, size.stock),
      unitPrice: finalPrice(product),
      image: product.images[0]?.url ?? PLACEHOLDER_IMAGE,
    });
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Ninguno de los talles del carrito sigue disponible." },
      { status: 409 },
    );
  }

  const total = items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);

  // El código es correlativo sobre los pedidos existentes. Dos checkouts
  // simultáneos podrían pedir el mismo número, así que el sufijo lo desempata.
  const sequence = 2419 + db.orders.length;
  const stamp = Date.now().toString(36).slice(-3).toUpperCase();

  const order = await repo().createOrder({
    id: `order_${Date.now().toString(36)}`,
    code: `TC-${sequence}-${stamp}`,
    createdAt: new Date().toISOString(),
    customer: {
      name: customer?.name?.trim() ?? "",
      phone: customer?.phone?.trim() ?? "",
      note: customer?.note?.trim() ?? "",
    },
    items,
    total,
    status: "pendiente",
  } satisfies Order);

  const message = buildOrderMessage({
    items: order.items,
    total: order.total,
    code: order.code,
    customerName: order.customer.name,
    note: order.customer.note,
  });

  return NextResponse.json({
    code: order.code,
    total: order.total,
    url: whatsappUrl(db.settings.whatsappNumber, message),
  });
}

/** Listado para el panel. */
export async function GET() {
  const session = await verifySessionToken(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await readDb();
  return NextResponse.json({
    orders: [...db.orders].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ),
  });
}
