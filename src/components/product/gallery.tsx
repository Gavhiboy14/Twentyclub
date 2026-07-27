"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Galería con lupa: al pasar el puntero sobre la imagen principal se amplía la
 * zona exacta que estás mirando. En touch no hay hover, así que el zoom se
 * activa tocando y se desactiva al soltar.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: ProductImage[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  const current = images[index] ?? images[0];

  function track(clientX: number, clientY: number) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="space-y-4">
      <div
        ref={frameRef}
        onPointerEnter={() => setZooming(true)}
        onPointerLeave={() => setZooming(false)}
        onPointerMove={(e) => track(e.clientX, e.clientY)}
        className="spotlight group relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={current.url}
              alt={current.alt || alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 92vw, 46vw"
              style={{
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transform: zooming ? "scale(2.1)" : "scale(1)",
              }}
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.16em] text-mist opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <ZoomIn className="size-3" />
          Zoom
        </div>
      </div>

      <div className="flex gap-3">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ver imagen ${i + 1} de ${images.length}`}
            aria-current={i === index}
            className={cn(
              "spotlight relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl border transition-all duration-300 sm:w-[5.5rem]",
              i === index
                ? "border-ivory opacity-100 ring-1 ring-ivory/40"
                : "border-transparent opacity-45 hover:opacity-80",
            )}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
