"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_META, STATUS_ORDER } from "@/lib/admin/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/field";
import { ConfirmAction, EmptyRow, ErrorNote, useMutate } from "./ui";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import { normalizePhone } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/site/social-icons";

export function OrdersBoard({ orders }: { orders: Order[] }) {
  const { mutate, pending, error } = useMutate();
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null);

  const counts = useMemo(() => {
    const base = {
      todos: orders.length,
      pendiente: 0,
      contactado: 0,
      finalizado: 0,
      cancelado: 0,
    };
    for (const order of orders) base[order.status]++;
    return base;
  }, [orders]);

  const rows = orders.filter((o) => filter === "todos" || o.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["todos", ...STATUS_ORDER] as const).map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-[0.8125rem] transition-colors",
                active
                  ? "border-champagne/50 bg-champagne/15 text-cream"
                  : "border-champagne/8 bg-champagne/[0.02] text-ash hover:text-chalk",
              )}
            >
              {key === "todos" ? "Todos" : STATUS_META[key].label}
              <span className="numeric text-[0.625rem] text-ash">
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {rows.length === 0 ? (
        <EmptyRow>No hay pedidos en este estado.</EmptyRow>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((order) => {
            const open = expanded === order.id;
            const units = order.items.reduce((a, i) => a + i.qty, 0);
            const wa = order.customer.phone
              ? `https://wa.me/${normalizePhone(order.customer.phone)}`
              : null;

            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-2xl border border-champagne/[0.07] bg-champagne/[0.022]"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : order.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-champagne/[0.02]"
                >
                  <span className="numeric text-xs text-chalk">
                    {order.code}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] text-chalk">
                      {order.customer.name || "Sin nombre"}
                    </span>
                    <span className="block text-xs text-ash">
                      {formatDateTime(order.createdAt)} · {units}{" "}
                      {units === 1 ? "par" : "pares"}
                    </span>
                  </span>

                  <span className="numeric text-[0.8125rem] text-chalk">
                    {formatPrice(order.total)}
                  </span>

                  <Badge variant={STATUS_META[order.status].variant}>
                    {STATUS_META[order.status].label}
                  </Badge>

                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-ash transition-transform duration-300",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open && (
                  <div className="space-y-5 border-t border-champagne/[0.07] px-5 py-5">
                    <ul className="space-y-2.5">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3.5">
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-carbon">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="eyebrow block">{item.brand}</span>
                            <span className="block truncate text-[0.8125rem] text-chalk">
                              {item.name}
                            </span>
                          </span>
                          <span className="numeric text-[0.6875rem] text-ash">
                            Talle {item.size} · x{item.qty}
                          </span>
                          <span className="numeric text-[0.8125rem] text-chalk">
                            {formatPrice(item.unitPrice * item.qty)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {order.customer.note && (
                      <p className="rounded-xl border border-champagne/8 bg-champagne/[0.02] px-4 py-3 text-[0.8125rem] leading-relaxed text-mist">
                        <span className="eyebrow mb-1.5 block">Nota</span>
                        {order.customer.note}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 border-t border-champagne/[0.07] pt-5">
                      <label className="flex items-center gap-2.5">
                        <span className="numeric text-[0.625rem] uppercase tracking-[0.16em] text-ash">
                          Estado
                        </span>
                        <NativeSelect
                          value={order.status}
                          disabled={pending}
                          onChange={(e) =>
                            mutate(`/api/admin/orders/${order.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: e.target.value }),
                            })
                          }
                          className="h-10 w-44 rounded-full text-[0.8125rem]"
                        >
                          {STATUS_ORDER.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_META[status].label}
                            </option>
                          ))}
                        </NativeSelect>
                      </label>

                      {wa && (
                        <Button asChild variant="glass" size="sm">
                          <a href={wa} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="size-[1.1em]" />
                            Escribirle
                          </a>
                        </Button>
                      )}

                      <ConfirmAction
                        title={`¿Borrar el pedido ${order.code}?`}
                        description="Se elimina del historial y de las estadísticas. No se puede deshacer."
                        pending={pending}
                        className="ml-auto"
                        onConfirm={() =>
                          mutate(`/api/admin/orders/${order.id}`, {
                            method: "DELETE",
                          })
                        }
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Trash2 className="size-3.5" />
                            Borrar
                          </Button>
                        }
                      />
                    </div>

                    <p className="text-xs leading-relaxed text-ash">
                      {STATUS_META[order.status].help}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
