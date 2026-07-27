import Link from "next/link";
import { CircleAlert, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { getDashboardStats, getOrders } from "@/lib/data/queries";
import { Panel } from "@/components/admin/ui";
import {
  BrandSalesChart,
  OrdersTimeline,
  ViewsChart,
} from "@/components/admin/charts";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber, formatPrice } from "@/lib/utils";
import { STATUS_META } from "@/lib/admin/orders";

export const metadata = { title: "Resumen" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, orders] = await Promise.all([getDashboardStats(), getOrders()]);
  const recent = orders.slice(0, 6);

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-3">Panel</p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-cream">
          Cómo viene la tienda
        </h1>
        <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-ash">
          Todo lo que ves acá sale de los pedidos y del stock cargado. Se
          actualiza solo.
        </p>
      </header>

      {/* Métricas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<ShoppingCart className="size-4" />}
          label="Pedidos totales"
          value={formatNumber(stats.totalOrders)}
          detail={`${stats.ordersByStatus.pendiente} sin contactar`}
          alert={stats.ordersByStatus.pendiente > 0}
        />
        <Metric
          icon={<TrendingUp className="size-4" />}
          label="Facturado"
          value={formatPrice(stats.revenue)}
          detail={`${stats.ordersByStatus.finalizado} pedidos finalizados`}
        />
        <Metric
          icon={<Package className="size-4" />}
          label="Pares vendidos"
          value={formatNumber(stats.unitsSold)}
          detail="Histórico del catálogo"
        />
        <Metric
          icon={<CircleAlert className="size-4" />}
          label="Agotados"
          value={formatNumber(stats.outOfStock)}
          detail={`${stats.lowStock.length} con stock bajo`}
          alert={stats.outOfStock > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Pedidos de los últimos 14 días"
          description="Cantidad de pedidos recibidos por día."
          className="xl:col-span-2"
        >
          <OrdersTimeline data={stats.ordersTimeline} />
        </Panel>

        <Panel title="Stock bajo" description="Ocho pares o menos en total.">
          {stats.lowStock.length === 0 ? (
            <p className="py-10 text-center text-sm text-ash">
              Ningún modelo en zona de riesgo.
            </p>
          ) : (
            <ul className="space-y-1">
              {stats.lowStock.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/productos?q=${encodeURIComponent(item.label)}`}
                    className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-champagne/[0.04]"
                  >
                    <span className="truncate text-[0.8125rem] text-mist">
                      {item.label}
                    </span>
                    <Badge variant={item.stock <= 4 ? "bad" : "warn"}>
                      {item.stock}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Ventas por marca"
          description="Pares vendidos acumulados."
          className="xl:col-span-2"
        >
          <BrandSalesChart data={stats.salesByBrand} />
        </Panel>

        <Panel
          title="Más vistos"
          description="Visitas a la ficha de producto."
        >
          <ViewsChart data={stats.mostViewed} />
        </Panel>

        <Panel
          title="Últimos pedidos"
          description="Los seis más recientes."
          className="xl:col-span-3"
          action={
            <Link
              href="/admin/pedidos"
              className="text-[0.8125rem] text-sand transition-colors hover:text-cream"
            >
              Ver todos
            </Link>
          }
        >
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse">
              <thead>
                <tr className="border-b border-champagne/[0.07]">
                  <Th>Código</Th>
                  <Th>Cliente</Th>
                  <Th>Fecha</Th>
                  <Th>Productos</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Estado</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-champagne/[0.04] last:border-0"
                  >
                    <Td>
                      <span className="numeric text-xs text-chalk">
                        {order.code}
                      </span>
                    </Td>
                    <Td>{order.customer.name || "—"}</Td>
                    <Td>
                      <span className="text-xs text-ash">
                        {formatDate(order.createdAt)}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-ash">
                        {order.items.reduce((a, i) => a + i.qty, 0)} pares
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="numeric text-xs text-chalk">
                        {formatPrice(order.total)}
                      </span>
                    </Td>
                    <Td align="right">
                      <Badge variant={STATUS_META[order.status].variant}>
                        {STATUS_META[order.status].label}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-champagne/[0.07] bg-champagne/[0.022] p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <span className={alert ? "text-warn" : "text-cream"}>{icon}</span>
      </div>
      <p className="mt-4 font-display text-2xl font-bold tracking-tight text-cream">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-ash">{detail}</p>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-3 pb-3 numeric text-[0.625rem] uppercase tracking-[0.16em] text-ash ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-3 py-3 text-[0.8125rem] text-mist ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}
