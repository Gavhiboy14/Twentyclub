"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  priorityCount = 4,
}: {
  products: ProductView[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <Stagger
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, i) => (
        <StaggerItem key={product.id} className="h-full">
          <ProductCard product={product} priority={i < priorityCount} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Separación entre tarjetas del rail (gap-5). Se usa para calcular el paso. */
const RAIL_GAP = 20;

/**
 * Rail horizontal: se usa cuando la sección es una selección, no un catálogo.
 *
 * La barra de scroll va oculta a propósito, así que el rail tiene que avisar
 * por otro lado que hay más a la derecha: las flechas aparecen sólo cuando
 * queda camino para ese lado y los bordes se desvanecen contra el fondo. En
 * touch no hay flechas —se arrastra— y el desvanecido alcanza como pista.
 *
 * El `scroll-px` tiene que igualar al `px`: sin él el snap obligatorio deja
 * la primera tarjeta 32px a la izquierda del título de la sección, porque el
 * snapport arranca en el borde del padding y no en el del contenido.
 */
export function ProductRail({ products }: { products: ProductView[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [more, setMore] = useState({ before: false, after: false });

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    // El margen de 4px evita que el redondeo subpíxel deje una flecha
    // encendida sin nada para mostrar.
    setMore({ before: track.scrollLeft > 4, after: track.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, [sync, products.length]);

  /** Avanza de a una tarjeta para que el rail quede siempre en un snap. */
  const nudge = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + RAIL_GAP : track.clientWidth * 0.8;
    track.scrollBy({
      left: direction * step,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={sync}
        tabIndex={0}
        role="group"
        aria-label="Carrusel de productos"
        className="hide-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8"
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[78vw] shrink-0 snap-start sm:w-[20rem] lg:w-[21.5rem]"
          >
            <ProductCard product={product} priority={i < 2} />
          </div>
        ))}
      </div>

      <RailEdge side="left" visible={more.before} />
      <RailEdge side="right" visible={more.after} />

      <RailArrow side="left" visible={more.before} onClick={() => nudge(-1)} />
      <RailArrow side="right" visible={more.after} onClick={() => nudge(1)} />
    </div>
  );
}

function RailEdge({ side, visible }: { side: "left" | "right"; visible: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 w-16 transition-opacity duration-500 sm:w-24",
        side === "left"
          ? "-left-5 bg-linear-to-r from-ink to-transparent sm:-left-8"
          : "-right-5 bg-linear-to-l from-ink to-transparent sm:-right-8",
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

/** Va a la altura de la foto, no del centro de la tarjeta: más abajo taparía
 *  los talles y el botón de compra. */
function RailArrow({
  side,
  visible,
  onClick,
}: {
  side: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={visible ? 0 : -1}
      aria-label={side === "left" ? "Ver anteriores" : "Ver siguientes"}
      className={cn(
        "glass absolute top-[32%] hidden size-11 -translate-y-1/2 place-items-center rounded-full text-chalk",
        "transition-[opacity,transform,background-color] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:bg-champagne/[0.09] active:scale-95 lg:grid",
        side === "left" ? "-left-4" : "-right-4",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Icon className="size-4 stroke-[1.5]" />
    </button>
  );
}
