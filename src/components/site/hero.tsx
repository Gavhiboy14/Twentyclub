"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowDown, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import type { Banner, ProductView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RevealWords } from "@/components/motion/reveal";
import { HeroAtmosphere } from "./hero-atmosphere";
import { WhatsAppIcon } from "./social-icons";
import { Sparkle } from "./logo";
import { cn, formatPrice } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Blando y con poco rebote: el par tiene que sentirse pesado, no elástico. */
const SPRING = { stiffness: 55, damping: 24, mass: 1.1 } as const;

/**
 * Hero.
 *
 * Una sola pieza suspendida en un eclipse de luz cálida, con la tipografía a
 * un costado y cuatro fichas de vidrio orbitándola. Toda la profundidad sale
 * del paralaje: cada capa responde al puntero con una amplitud distinta —el
 * halo se mueve al revés que el par, las fichas a mitad de camino— y eso es lo
 * que hace que la escena se lea como un volumen y no como un collage.
 *
 * Al scrollear el par sube, se achica y se apaga: no desaparece, entrega la
 * pantalla a la colección.
 *
 * El `-mt-20` cancela el `pt-20` del <main>: el hero arranca por debajo de la
 * barra flotante, no por debajo del hueco que la barra deja.
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

  // Puntero normalizado a -0.5…0.5 desde el centro de la sección.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const px = useSpring(pointerX, SPRING);
  const py = useSpring(pointerY, SPRING);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const shoeY = useTransform(scrollYProgress, [0, 1], [0, -130]);
  const shoeScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const shoeFade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const haloScale = useTransform(scrollYProgress, [0, 1], [1, 1.22]);
  const haloFade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const copyFade = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  // El par gira apenas; pasado un punto deja de ser peso y se vuelve juguete.
  const shoeRotateX = useTransform(py, (v) => v * -11);
  const shoeRotateY = useTransform(px, (v) => v * 17);
  const shoeShiftX = useTransform(px, (v) => v * 26);
  const shoeShiftY = useTransform(py, (v) => v * 16);

  // El halo va al revés que el par: es lo que despega una capa de la otra.
  const haloX = useTransform(px, (v) => v * -40);
  const haloY = useTransform(py, (v) => v * -26);

  const image = banner.image ?? product.images[0]?.url ?? "";

  return (
    <section
      ref={sectionRef}
      onPointerMove={(event) => {
        if (reduced) return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className="grain relative isolate -mt-20 flex min-h-[100svh] items-center overflow-hidden px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-28 lg:pb-24 lg:pt-32"
    >
      <HeroAtmosphere />

      <div className="mx-auto grid w-full max-w-[86rem] items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        {/* ---------------------------------------------------------------
            Escena. En mobile va primero: el par es el argumento de venta,
            no el remate.
            --------------------------------------------------------------- */}
        <div className="relative order-first flex h-[38svh] w-full items-center justify-center sm:h-[50svh] lg:order-last lg:h-[64svh]">
          {/* Eclipse: núcleo oscuro, anillo encendido y derrame cálido. La
              zapatilla se recorta contra el anillo, como una pieza en vitrina. */}
          <motion.div
            aria-hidden
            style={
              reduced
                ? undefined
                : { x: haloX, y: haloY, scale: haloScale, opacity: haloFade }
            }
            className="pointer-events-none absolute aspect-square w-[112%] max-w-[32rem] lg:w-[95%] lg:max-w-[38rem]"
          >
            <div
              className="absolute inset-0 rounded-full blur-[70px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(232,220,196,0.20) 0%, rgba(201,160,99,0.13) 42%, transparent 68%)",
              }}
            />
            <div className="absolute inset-[13%] rounded-full border border-champagne/22 shadow-[0_0_70px_-10px_rgba(232,220,196,0.35),inset_0_0_60px_-20px_rgba(201,160,99,0.5)]" />
            <div
              className="absolute inset-[16%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, var(--color-ink) 40%, rgba(15,15,16,0.6) 72%, transparent 100%)",
              }}
            />
          </motion.div>

          {/* El par desborda su caja a propósito: las fotos de estudio son
              verticales y traen mucho aire arriba y abajo, así que se agranda
              hasta que la zapatilla manda y la máscara se come el sobrante. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              style={
                reduced
                  ? undefined
                  : { y: shoeY, scale: shoeScale, opacity: shoeFade }
              }
              className="w-full max-w-[26rem] sm:max-w-[30rem] lg:max-w-[38rem] [perspective:1400px]"
            >
              <motion.div
                style={
                  reduced
                    ? undefined
                    : {
                        rotateX: shoeRotateX,
                        rotateY: shoeRotateY,
                        x: shoeShiftX,
                        y: shoeShiftY,
                      }
                }
                initial={{ opacity: 0, scale: 0.92, filter: "blur(20px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.3, delay: 0.15, ease: EASE }}
              >
                <div className="animate-float">
                  <Image
                    src={image}
                    alt={`${product.brand.name} ${product.name}`}
                    width={1200}
                    height={1200}
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 70vw, 46vw"
                    className="hero-cutout h-auto w-full drop-shadow-[0_70px_90px_rgba(0,0,0,0.9)]"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Fichas en órbita. Cuelgan de la escena y no del par, así se
              apoyan en el borde visible y no en el aire de la foto. En mobile
              queda sólo la del producto: cuatro paneles sobre 375px tapan
              justo lo que hay que mirar. */}
          <motion.div
            style={reduced ? undefined : { y: cardsY, opacity: shoeFade }}
            className="pointer-events-none absolute inset-0"
          >
            <OrbitCard
              px={px}
              py={py}
              depth={0.55}
              delay={0.9}
              reduced={reduced}
              className="-left-2 top-[3%] lg:-left-10"
            >
              <Link
                href={`/producto/${product.slug}`}
                className="flex items-center gap-4"
              >
                <div>
                  <p className="eyebrow text-gold">Nuevo ingreso</p>
                  <p className="mt-1 text-[0.8125rem] font-semibold text-chalk">
                    {product.brand.name} {product.name}
                  </p>
                </div>
                <span className="h-8 w-px bg-champagne/12" />
                <span className="font-display text-sm font-bold text-chalk">
                  {formatPrice(product.finalPrice)}
                </span>
              </Link>
            </OrbitCard>

            <OrbitCard
              px={px}
              py={py}
              depth={0.85}
              delay={1.05}
              reduced={reduced}
              className="-right-2 top-[30%] hidden sm:flex lg:right-0 xl:-right-6"
            >
              <OrbitLine
                icon={<Truck className="size-4 stroke-[1.25] text-gold" />}
                label="Envíos a todo el país"
                value="24–48 hs"
              />
            </OrbitCard>

            <OrbitCard
              px={px}
              py={py}
              depth={0.35}
              delay={1.2}
              reduced={reduced}
              className="bottom-[18%] hidden lg:flex lg:-left-12 xl:-left-16"
            >
              <OrbitLine
                icon={<ShieldCheck className="size-4 stroke-[1.25] text-gold" />}
                label="Compra por pedido"
                value="Productos originales"
              />
            </OrbitCard>

            <OrbitCard
              px={px}
              py={py}
              depth={0.7}
              delay={1.35}
              reduced={reduced}
              className="-bottom-2 right-0 hidden lg:flex"
            >
              <OrbitLine
                icon={<WhatsAppIcon className="size-4 text-gold" />}
                label="Atención personalizada"
                value="WhatsApp"
              />
            </OrbitCard>
          </motion.div>
        </div>

        {/* ---------------------------------------------------------------
            Mensaje
            --------------------------------------------------------------- */}
        <motion.div
          style={reduced ? undefined : { y: copyY, opacity: copyFade }}
          className="relative z-10 max-w-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="glass-soft inline-flex items-center gap-2.5 rounded-full py-2 pl-3.5 pr-4.5"
          >
            <Sparkle className="size-2.5 text-gold" />
            <span className="eyebrow text-mist">{banner.eyebrow}</span>
          </motion.div>

          <h1 className="display-xl mt-6 text-[clamp(2.5rem,7.2vw,5.5rem)] text-chalk">
            <RevealWords text={banner.title} delay={0.12} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
            className="mt-6 max-w-md text-[0.9375rem] leading-[1.75] text-mist sm:text-[1.0625rem]"
          >
            {banner.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.68, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-3"
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
        </motion.div>
      </div>

      <motion.a
        href="#coleccion"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.9 }}
        style={reduced ? undefined : { opacity: copyFade }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2.5 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-ash transition-colors duration-300 hover:text-chalk lg:flex"
      >
        <ArrowDown className="size-3 animate-bounce stroke-[1.5]" />
        Seguir
      </motion.a>
    </section>
  );
}

/**
 * Ficha en órbita.
 *
 * `depth` es lo único que la distingue de sus hermanas: 0 la deja clavada al
 * par y 1 la despega del todo. Repartir valores distintos entre las cuatro es
 * lo que produce el paralaje.
 */
function OrbitCard({
  px,
  py,
  depth,
  delay,
  reduced,
  className,
  children,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  depth: number;
  delay: number;
  reduced: boolean | null;
  className?: string;
  children: ReactNode;
}) {
  const x = useTransform(px, (v) => v * 46 * depth);
  const y = useTransform(py, (v) => v * 30 * depth);

  return (
    <motion.div
      style={reduced ? undefined : { x, y }}
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, delay, ease: EASE }}
      className={cn("pointer-events-auto absolute z-20", className)}
    >
      <div
        className="animate-bob glass edge-light flex items-center rounded-[1.5rem] px-4 py-3"
        style={{ animationDelay: `${-delay * 3}s` }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function OrbitLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-champagne/10 bg-champagne/[0.04]">
        {icon}
      </span>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="mt-1 text-[0.8125rem] font-semibold text-chalk">{value}</p>
      </div>
    </div>
  );
}
