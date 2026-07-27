"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { Badge, TagBadge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductView;
  priority?: boolean;
}) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [needsSize, setNeedsSize] = useState(false);
  const [hovered, setHovered] = useState(false);

  const label = `${product.brand.name} ${product.name}`;
  const secondImage = product.images[1] ?? product.images[0];

  function handleAdd() {
    if (!product.inStock) return;
    if (!size) {
      setNeedsSize(true);
      window.setTimeout(() => setNeedsSize(false), 1800);
      return;
    }
    const stock = product.visibleSizes.find((s) => s.size === size);
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand.name,
      size,
      qty: 1,
      unitPrice: product.finalPrice,
      image: product.images[0].url,
      maxStock: stock?.stock ?? 1,
    });
    setSize(null);
  }

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass edge-light group relative flex flex-col rounded-glass p-3",
        "transition-shadow duration-500",
        "hover:border-cream/20 hover:shadow-[0_40px_80px_-40px_rgba(247,244,224,0.22)]",
        !product.inStock && "opacity-60",
      )}
    >
      {/* Imagen */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-[1.15rem] bg-graphite"
        aria-label={`Ver ${label}`}
      >
        <div
          aria-hidden
          className="absolute inset-x-6 bottom-4 h-24 rounded-full bg-cream/35 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        />
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 23vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={cn(
            "object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            hovered ? "scale-105 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Image
          src={secondImage.url}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 23vw"
          loading="lazy"
          className={cn(
            "object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            hovered ? "scale-105 opacity-100" : "scale-110 opacity-0",
          )}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          {!product.inStock && <Badge variant="bad">Agotado</Badge>}
        </div>
      </Link>

      <FavoriteButton
        productId={product.id}
        label={label}
        className="absolute right-5 top-5 z-20"
      />

      {/* Datos */}
      <div className="flex flex-1 flex-col gap-3 px-2 pb-1 pt-4">
        <div className="space-y-1">
          <p className="eyebrow">{product.brand.name}</p>
          <h3 className="text-[0.975rem] font-semibold leading-tight tracking-tight text-chalk">
            <Link
              href={`/producto/${product.slug}`}
              className="transition-colors hover:text-cream"
            >
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-lg font-bold tracking-tight text-cream">
            {formatPrice(product.finalPrice)}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-sm text-ash line-through">
                {formatPrice(product.price)}
              </span>
              <span className="font-mono text-[0.6875rem] text-sand">
                −{product.discount}%
              </span>
            </>
          )}
        </div>

        {/* Talles: son datos, van en mono */}
        {product.inStock ? (
          <div className="mt-auto space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {product.visibleSizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => {
                    setSize(s.size === size ? null : s.size);
                    setNeedsSize(false);
                  }}
                  aria-pressed={s.size === size}
                  className={cn(
                    "relative z-10 rounded-lg border px-2 py-1 font-mono text-[0.6875rem] transition-all duration-200",
                    s.size === size
                      ? "border-cream bg-cream/20 text-cream"
                      : "border-cream/10 bg-cream/[0.03] text-mist hover:border-cream/25 hover:text-chalk",
                  )}
                >
                  {s.size}
                </button>
              ))}
            </div>

            <motion.button
              type="button"
              onClick={handleAdd}
              animate={needsSize ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "relative z-10 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[0.8125rem] font-medium transition-all duration-300",
                needsSize
                  ? "bg-warn/15 text-warn"
                  : size
                    ? "bg-cream text-ink shadow-[0_10px_28px_-14px_rgba(247,244,224,0.5)] hover:bg-white"
                    : "border border-cream/10 bg-cream/[0.04] text-mist hover:border-cream/20 hover:text-chalk",
              )}
            >
              {needsSize ? (
                "Elegí un talle"
              ) : (
                <>
                  <Plus className="size-3.5" />
                  {size ? `Agregar talle ${size}` : "Agregar al carrito"}
                </>
              )}
            </motion.button>
          </div>
        ) : (
          <p className="mt-auto pt-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ash">
            Sin talles disponibles
          </p>
        )}
      </div>
    </motion.article>
  );
}
