"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import type { Banner, ProductView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RevealWords } from "@/components/motion/reveal";
import { Sparkle } from "./logo";
import { formatPrice } from "@/lib/utils";

/**
 * Hero: el par flota entre dos capas de tipografía — la marca gigante detrás y
 * el titular adelante. Esa superposición es lo que da la profundidad; el resto
 * de la página es deliberadamente más quieto.
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

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const glowX = useSpring(pointerX, { stiffness: 60, damping: 22 });
  const glowY = useSpring(pointerY, { stiffness: 60, damping: 22 });

  const spotlightLeft = useTransform(glowX, (v) => `${v * 100}%`);
  const spotlightTop = useTransform(glowY, (v) => `${v * 100}%`);
  const tiltX = useTransform(glowY, [0, 1], [6, -6]);
  const tiltY = useTransform(glowX, [0, 1], [-8, 8]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const shoeY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const typeY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const image = banner.image ?? product.images[0].url;

  return (
    <section
      ref={sectionRef}
      onPointerMove={(event) => {
        if (reduced) return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width);
        pointerY.set((event.clientY - rect.top) / rect.height);
      }}
      className="relative isolate grain overflow-hidden px-5 pb-24 pt-10 sm:px-8 lg:min-h-[88vh] lg:pb-32 lg:pt-16"
    >
      {/* Foco que sigue al puntero */}
      {!reduced && (
        <motion.div
          aria-hidden
          style={{ left: spotlightLeft, top: spotlightTop }}
          className="pointer-events-none absolute -z-10 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[100px]"
        >
          <div className="size-full rounded-full bg-[radial-gradient(circle,rgba(201,160,99,0.34),transparent_65%)]" />
        </motion.div>
      )}

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        {/* Capa frontal: el mensaje */}
        <motion.div style={{ opacity: fade }} className="relative z-20 max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="eyebrow mb-6 flex items-center gap-2.5"
          >
            <Sparkle className="size-2.5 text-chalk" />
            {banner.eyebrow}
          </motion.p>

          <h1 className="display-xl text-[clamp(2.75rem,8.5vw,5.5rem)] text-chalk">
            <RevealWords text={banner.title} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-md text-base leading-relaxed text-mist sm:text-lg"
          >
            {banner.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg">
              <Link href={banner.ctaHref}>
                {banner.ctaLabel}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/ofertas">Ver ofertas</Link>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.8 }}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-5"
          >
            <Stat value="9" label="Marcas" />
            <Stat value="32" label="Modelos" />
            <Stat value="24 h" label="Envío CABA" />
          </motion.dl>
        </motion.div>

        {/* Capa media: el par. Capa trasera: la marca gigante. */}
        <div className="relative z-10 flex items-center justify-center lg:h-[38rem]">
          <motion.p
            aria-hidden
            style={{ y: typeY }}
            className="display-xl pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none text-center text-[clamp(6rem,22vw,17rem)] leading-none text-transparent"
          >
            <span
              className="bg-linear-to-b from-champagne/[0.11] to-champagne/[0.01] bg-clip-text"
              style={{ WebkitTextStroke: "1px rgba(232,220,196,0.05)" }}
            >
              20
            </span>
          </motion.p>

          <motion.div
            style={reduced ? undefined : { y: shoeY, rotateX: tiltX, rotateY: tiltY }}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg [perspective:1200px]"
          >
            <div className="animate-float">
              <Image
                src={image}
                alt={`${product.brand.name} ${product.name}`}
                width={1000}
                height={1000}
                priority
                sizes="(max-width: 1024px) 90vw, 42vw"
                className="w-full drop-shadow-[0_60px_80px_rgba(0,0,0,0.85)]"
              />
            </div>

            {/* Ficha flotante del par destacado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-2 left-2 border border-champagne/10 bg-graphite/85 backdrop-blur-2xl shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] flex items-center gap-4 rounded-2xl px-4 py-3 sm:bottom-6 sm:left-6"
            >
              <div>
                <p className="eyebrow">{product.brand.name}</p>
                <p className="text-sm font-semibold text-chalk">{product.name}</p>
              </div>
              <span className="h-8 w-px bg-cream/10" />
              <div className="text-right">
                <p className="font-display text-base font-bold text-chalk">
                  {formatPrice(product.finalPrice)}
                </p>
                <Link
                  href={`/producto/${product.slug}`}
                  className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-sand transition-colors hover:text-chalk"
                >
                  Ver ficha
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#coleccion"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{ opacity: fade }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-ash transition-colors hover:text-chalk lg:flex"
      >
        <ArrowDown className="size-3 animate-bounce" />
        Seguir
      </motion.a>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-2xl font-bold tracking-tight text-chalk">
        {value}
      </dd>
      <p className="eyebrow mt-1">{label}</p>
    </div>
  );
}
