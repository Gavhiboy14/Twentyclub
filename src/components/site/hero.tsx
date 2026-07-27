"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Banner, ProductView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Sparkle } from "./logo";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Hero.
 *
 * La suspensión la da la placa marfil, no un recorte: una lámina clara
 * flotando sobre el negro, con halo champagne detrás y una sombra muy amplia
 * debajo. Funciona con cualquier foto y no depende de que el producto venga
 * con fondo transparente.
 */
export function Hero({
  banner,
  product,
}: {
  banner: Banner;
  product: ProductView;
}) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const plateY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const image = banner.image ?? product.images[0].url;

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden px-5 pb-32 pt-14 sm:px-8 lg:min-h-[92vh] lg:pb-44 lg:pt-24"
    >
      <div className="mx-auto grid max-w-[86rem] items-center gap-20 lg:grid-cols-[1.05fr_0.95fr]">
        {/* El mensaje */}
        <motion.div
          style={reduced ? undefined : { y: copyY, opacity: fade }}
          className="relative z-10 max-w-xl"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="eyebrow mb-8 flex items-center gap-2.5"
          >
            <Sparkle className="size-2.5 text-champagne" />
            {banner.eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, delay: 0.08, ease: EASE }}
            className="display-xl text-[clamp(2.75rem,7.5vw,5.25rem)] text-chalk"
          >
            {banner.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.34, ease: EASE }}
            className="mt-9 max-w-md text-[1.0625rem] leading-[1.7] text-mist"
          >
            {banner.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.46, ease: EASE }}
            className="mt-12 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="xl">
              <Link href={banner.ctaHref}>
                {banner.ctaLabel}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="/ofertas">Ver ofertas</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* La placa suspendida */}
        <motion.div
          style={reduced ? undefined : { y: plateY }}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.2, ease: EASE }}
          className="halo relative mx-auto w-full max-w-md lg:max-w-lg"
        >
          <div className="animate-float">
            <div className="plate relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
              <Image
                src={image}
                alt={`${product.brand.name} ${product.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 88vw, 42vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Ficha del par destacado, montada sobre el borde de la placa */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
            className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-5 rounded-2xl border border-champagne/10 bg-graphite/85 px-6 py-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <div>
              <p className="eyebrow">{product.brand.name}</p>
              <p className="mt-1 whitespace-nowrap text-sm font-medium text-chalk">
                {product.name}
              </p>
            </div>
            <span className="h-9 w-px bg-champagne/12" />
            <div className="text-right">
              <p className="numeric text-[0.9375rem] font-medium text-linen">
                {formatPrice(product.finalPrice)}
              </p>
              <Link
                href={`/producto/${product.slug}`}
                className="text-[0.6875rem] uppercase tracking-[0.18em] text-ash transition-colors duration-300 hover:text-champagne"
              >
                Ver ficha
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
