"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import type { ProductView } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { Badge, TagBadge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";

/**
 * La tarjeta es el elemento que más se repite del sitio, así que es donde se
 * decide si la tienda se siente cara o barata.
 *
 * La estructura es: panel de vidrio ahumado → foco cálido → foto. La máscara
 * radial funde el fondo de la foto con el panel, así que funciona igual con
 * una foto de estudio que con un recorte.
 */
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
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "group relative flex h-full flex-col rounded-[1.75rem] p-4",
        "border border-champagne/[0.07] bg-graphite/70 backdrop-blur-xl",
        "shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)]",
        "transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-champagne/16 hover:shadow-[0_40px_90px_-40px_rgba(0,0,0,1),0_0_60px_-30px_rgba(232,220,196,0.22)]",
        !product.inStock && "opacity-55",
      )}
    >
      {/* El producto, suspendido en el foco */}
      <Link
        href={`/producto/${product.slug}`}
        className="spotlight relative block aspect-[4/5] overflow-hidden rounded-[1.35rem]"
        aria-label={`Ver ${label}`}
      >
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 24vw"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={cn(
            "object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            hovered ? "scale-[1.06] opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Image
          src={secondImage.url}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 24vw"
          loading="lazy"
          className={cn(
            "object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            hovered ? "scale-[1.06] opacity-100" : "scale-[1.12] opacity-0",
          )}
        />

        {product.tags.length > 0 && product.inStock && (
          <div className="absolute left-3 top-3">
            <TagBadge tag={product.tags[0]} />
          </div>
        )}
        {!product.inStock && (
          <div className="absolute left-3 top-3">
            <Badge variant="bad">Agotado</Badge>
          </div>
        )}
      </Link>

      <FavoriteButton
        productId={product.id}
        label={label}
        className="absolute right-6 top-6 z-20"
      />

      {/* Datos */}
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-6">
        <p className="eyebrow">{product.brand.name}</p>

        <h3 className="mt-2.5 text-[1.0625rem] font-medium leading-snug tracking-[-0.015em] text-chalk">
          <Link
            href={`/producto/${product.slug}`}
            className="transition-colors duration-300 hover:text-linen"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="numeric text-[1.0625rem] font-medium tracking-[-0.01em] text-linen">
            {formatPrice(product.finalPrice)}
          </span>
          {product.discount > 0 && (
            <span className="numeric text-[0.8125rem] text-ash line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Talles y compra. Se revelan al hover en desktop; en touch van
            siempre visibles, porque ahí el hover no existe. */}
        {product.inStock ? (
          <div className="mt-5 space-y-3 opacity-100 transition-opacity duration-500 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
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
                    "numeric relative z-10 min-w-9 rounded-lg border px-2 py-1.5 text-[0.6875rem] transition-all duration-300",
                    s.size === size
                      ? "border-ivory bg-ivory text-ink"
                      : "border-champagne/10 bg-champagne/[0.03] text-mist hover:border-champagne/28 hover:text-chalk",
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
                "relative z-10 flex h-11 w-full items-center justify-center rounded-xl text-[0.8125rem] font-medium transition-all duration-300",
                needsSize
                  ? "bg-warn/12 text-warn"
                  : size
                    ? "bg-ivory text-ink hover:bg-linen"
                    : "border border-champagne/10 bg-champagne/[0.04] text-mist hover:border-champagne/22 hover:text-chalk",
              )}
            >
              {needsSize
                ? "Elegí un talle"
                : size
                  ? `Agregar talle ${size}`
                  : "Agregar al carrito"}
            </motion.button>
          </div>
        ) : (
          <p className="mt-5 text-[0.6875rem] uppercase tracking-[0.2em] text-ash">
            Sin talles
          </p>
        )}
      </div>
    </motion.article>
  );
}
