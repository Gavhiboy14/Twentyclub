"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { useCheckout } from "./use-checkout";
import { WhatsAppIcon } from "./social-icons";

export function CartPage({ freeShippingFrom }: { freeShippingFrom: number }) {
  const { items, setQty, remove, subtotal, count, hydrated } = useCart();
  const { checkout, sending, error } = useCheckout();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const missing = Math.max(0, freeShippingFrom - subtotal);

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-glass" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-glass" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-5 rounded-glass px-8 py-24 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-cream/5 text-ash">
          <ShoppingBag className="size-6" />
        </div>
        <div>
          <p className="font-display text-xl font-bold text-chalk">
            Tu carrito está vacío
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
            Elegí tu par, marcá el talle y volvé por acá para cerrar el pedido.
          </p>
        </div>
        <Button asChild>
          <Link href="/productos">Explorar colección</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
      {/* Líneas del pedido */}
      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.article
              key={`${item.productId}-${item.size}`}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 32, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass flex gap-4 rounded-glass p-4 sm:gap-6 sm:p-5"
            >
              <Link
                href={`/producto/${item.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-graphite sm:size-32"
              >
                <Image
                  src={item.image}
                  alt={`${item.brand} ${item.name}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow">{item.brand}</p>
                    <h2 className="truncate text-base font-semibold text-chalk">
                      <Link
                        href={`/producto/${item.slug}`}
                        className="transition-colors hover:text-cream"
                      >
                        {item.name}
                      </Link>
                    </h2>
                    <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ash">
                      Talle {item.size}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.productId, item.size)}
                    aria-label={`Quitar ${item.brand} ${item.name} talle ${item.size}`}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-ash transition-colors hover:bg-bad/12 hover:text-bad"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-1 rounded-full border border-cream/10 bg-cream/[0.03] p-1">
                    <button
                      type="button"
                      onClick={() => setQty(item.productId, item.size, item.qty - 1)}
                      aria-label="Restar uno"
                      className="grid size-8 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-6 text-center font-mono text-sm text-chalk">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      disabled={item.qty >= item.maxStock}
                      onClick={() => setQty(item.productId, item.size, item.qty + 1)}
                      aria-label="Sumar uno"
                      className="grid size-8 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk disabled:opacity-30"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-cream">
                      {formatPrice(item.unitPrice * item.qty)}
                    </p>
                    {item.qty > 1 && (
                      <p className="font-mono text-[0.6875rem] text-ash">
                        {formatPrice(item.unitPrice)} c/u
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="glass-strong edge-light space-y-6 rounded-glass p-6">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-chalk">
              Resumen
            </h2>
            <p className="eyebrow mt-1">
              {count} {count === 1 ? "producto" : "productos"}
            </p>
          </div>

          <div className="space-y-3 border-y border-cream/8 py-5">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row
              label="Envío"
              value={missing === 0 ? "Sin cargo" : "A coordinar"}
              highlight={missing === 0}
            />
            {missing > 0 && (
              <p className="rounded-xl border border-cream/20 bg-cream/8 px-3.5 py-2.5 text-xs leading-relaxed text-sand">
                Te faltan {formatPrice(missing)} para el envío sin cargo.
              </p>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-mist">Total</span>
            <span className="font-display text-2xl font-bold tracking-tight text-cream">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="space-y-4">
            <Field label="Tu nombre" hint="Opcional. Ayuda a identificar el pedido.">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cómo te llamás"
                autoComplete="name"
              />
            </Field>
            <Field label="Nota para el pedido">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Zona de entrega, horario, dudas de talle…"
                rows={3}
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-xl border border-bad/25 bg-bad/10 px-3.5 py-2.5 text-[0.8125rem] text-bad">
              {error}
            </p>
          )}

          <Button
            onClick={() => checkout({ name, note })}
            disabled={sending}
            size="lg"
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" />
                Armando el pedido…
              </>
            ) : (
              <>
                <WhatsAppIcon className="size-[1.15em]" />
                Finalizar por WhatsApp
              </>
            )}
          </Button>

          <p className="text-center text-xs leading-relaxed text-ash">
            No se cobra nada en el sitio. Se abre WhatsApp con el resumen y
            coordinamos el pago por ahí.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-mist">{label}</span>
      <span className={highlight ? "font-mono text-ok" : "font-mono text-chalk"}>
        {value}
      </span>
    </div>
  );
}
