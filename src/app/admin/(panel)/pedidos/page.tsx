import { getOrders } from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import { OrdersBoard } from "@/components/admin/orders-board";

export const metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <>
      <PageHeader
        eyebrow="Ventas"
        title="Pedidos"
        description="Cada vez que alguien cierra la compra por WhatsApp, el pedido queda registrado acá. Marcarlo como finalizado descuenta el stock."
      />
      <OrdersBoard orders={orders} />
    </>
  );
}
