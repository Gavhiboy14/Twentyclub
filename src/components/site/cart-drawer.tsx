"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import {
  Dialog,
  SheetContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useCheckout } from "./use-checkout";
import { WhatsAppIcon } from "./social-icons";

export function CartDrawer() {
  const { items, isOpen, closeCart, setQty, remove, subtotal, count } = useCart();
  const { checkout, sending, error } = useCheckout();

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent side="right" className="gap-0 p-0">
        <header className="flex items-center justify-between border-b border-champagne/8 px-6 py-5">
          <div>
            <DialogTitle className="font-display text-xl font-medium tracking-tight text-chalk">
              Tu carrito
            </DialogTitle>
            <DialogDescription className="eyebrow mt-1">
              {count === 0
                ? "Vacío"
                : `${count} ${count === 1 ? "producto" : "productos"}`}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="grid size-10 place-items-center rounded-full text-ash transition-colors hover:bg-champagne/8 hover:text-chalk"
          >
            <X className="size-4" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="grid size-16 place-items-center rounded-2xl border border-champagne/[0.07] bg-graphite/60 text-ash">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-chalk">
                Todavía no elegiste nada
              </p>
              <p className="mt-1.5 text-sm text-ash">
                Buscá tu par y agregalo con el talle que uses.
              </p>
            </div>
            <Button asChild variant="glass" onClick={closeCart}>
              <Link href="/productos">Explorar colección</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.size}`}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-2 flex gap-4 rounded-2xl p-2.5 transition-colors hover:bg-champagne/[0.03]"
                  >
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={closeCart}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-carbon"
                    >
                      <Image
                        src={item.image}
                        alt={`${item.brand} ${item.name}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">{item.brand}</p>
                      <p className="truncate text-sm font-medium text-chalk">
                        {item.name}
                      </p>
                      <p className="mt-0.5 numeric text-[0.6875rem] text-ash">
                        Talle {item.size}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex items-center gap-1 rounded-full border border-champagne/10 bg-champagne/[0.03] p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setQty(item.productId, item.size, item.qty - 1)
                            }
                            aria-label="Restar uno"
                            className="grid size-6 place-items-center rounded-full text-ash transition-colors hover:bg-champagne/8 hover:text-chalk"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="min-w-5 text-center numeric text-xs text-chalk">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            disabled={item.qty >= item.maxStock}
                            onClick={() =>
                              setQty(item.productId, item.size, item.qty + 1)
                            }
                            aria-label="Sumar uno"
                            className="grid size-6 place-items-center rounded-full text-ash transition-colors hover:bg-champagne/8 hover:text-chalk disabled:opacity-30"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        <span className="ml-auto font-display text-sm font-medium text-chalk">
                          {formatPrice(item.unitPrice * item.qty)}
                        </span>

                        <button
                          type="button"
                          onClick={() => remove(item.productId, item.size)}
                          aria-label={`Quitar ${item.brand} ${item.name} talle ${item.size}`}
                          className="grid size-7 place-items-center rounded-full text-ash transition-colors hover:bg-bad/12 hover:text-bad"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <footer className="space-y-4 border-t border-champagne/8 bg-champagne/[0.02] p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-mist">
                  <span>Subtotal</span>
                  <span className="numeric">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-mist">Total</span>
                  <span className="font-display text-2xl font-medium tracking-tight text-chalk">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-bad/25 bg-bad/10 px-3.5 py-2.5 text-[0.8125rem] text-bad">
                  {error}
                </p>
              )}

              <Button
                onClick={() => checkout()}
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

              <Link
                href="/carrito"
                onClick={closeCart}
                className="block text-center text-[0.8125rem] text-ash transition-colors hover:text-chalk"
              >
                Ver el carrito completo
              </Link>
            </footer>
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
