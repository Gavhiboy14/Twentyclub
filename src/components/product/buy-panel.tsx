"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { cn, formatPrice } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";

/** Debajo de este número mostramos cuántos pares quedan del talle. */
const LOW_STOCK = 3;

export function BuyPanel({ product }: { product: ProductView }) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(
    product.visibleSizes.length === 1 ? product.visibleSizes[0].size : null,
  );
  const [qty, setQty] = useState(1);
  const [warn, setWarn] = useState(false);

  const selected = product.visibleSizes.find((s) => s.size === size);
  const label = `${product.brand.name} ${product.name}`;

  function handleAdd() {
    if (!selected) {
      setWarn(true);
      window.setTimeout(() => setWarn(false), 2000);
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand.name,
      size: selected.size,
      qty,
      unitPrice: product.finalPrice,
      image: product.images[0].url,
      maxStock: selected.stock,
    });
    setQty(1);
  }

  if (!product.inStock) {
    return (
      <div className="glass rounded-glass p-6 text-center">
        <p className="font-display text-lg font-bold text-chalk">
          Sin talles disponibles
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ash">
          Este modelo se agotó. Escribinos y te avisamos apenas vuelva a entrar.
        </p>
        <Button asChild variant="glass" className="mt-5">
          <a href="/contacto">Avisarme cuando vuelva</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Talles */}
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">Talle argentino</p>
          {selected && selected.stock <= LOW_STOCK && (
            <p className="font-mono text-[0.6875rem] text-warn">
              Quedan {selected.stock}
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {product.visibleSizes.map((s) => {
            const active = s.size === size;
            return (
              <button
                key={s.size}
                type="button"
                onClick={() => {
                  setSize(s.size);
                  setQty(1);
                  setWarn(false);
                }}
                aria-pressed={active}
                className={cn(
                  "relative h-12 rounded-xl border font-mono text-sm transition-all duration-300",
                  active
                    ? "border-cream bg-cream text-ink shadow-[0_8px_24px_-10px_rgba(247,244,224,0.6)]"
                    : "border-cream/10 bg-cream/[0.03] text-mist hover:border-cream/25 hover:text-chalk",
                )}
              >
                {s.size}
                {active && (
                  <Check className="absolute right-1 top-1 size-3 text-sand" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-ash">
          Sólo listamos los talles que están en depósito ahora mismo.
        </p>
      </div>

      {/* Cantidad + acciones */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.03] px-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Restar uno"
            className="grid size-10 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-7 text-center font-mono text-sm text-chalk">
            {qty}
          </span>
          <button
            type="button"
            onClick={() =>
              setQty((q) => Math.min(selected?.stock ?? 1, q + 1))
            }
            disabled={!selected || qty >= selected.stock}
            aria-label="Sumar uno"
            className="grid size-10 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <motion.div
          animate={warn ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.42 }}
          className="min-w-56 flex-1"
        >
          <Button
            onClick={handleAdd}
            size="lg"
            variant={warn ? "outline" : "primary"}
            className={cn("w-full", warn && "border-warn/50 text-warn")}
          >
            {warn ? (
              "Elegí un talle primero"
            ) : (
              <>
                <ShoppingBag />
                Agregar al carrito
                {selected && (
                  <span className="ml-1 font-mono text-[0.8125rem] opacity-80">
                    {formatPrice(product.finalPrice * qty)}
                  </span>
                )}
              </>
            )}
          </Button>
        </motion.div>

        <FavoriteButton
          productId={product.id}
          label={label}
          className="size-14"
        />
      </div>
    </div>
  );
}
