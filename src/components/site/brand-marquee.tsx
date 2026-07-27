import Link from "next/link";
import type { Brand } from "@/lib/types";

/**
 * Carrusel de marcas. Se duplica la lista para que el loop no tenga costura;
 * la copia va oculta para lectores de pantalla.
 */
export function BrandMarquee({ brands }: { brands: Brand[] }) {
  return (
    <div className="relative overflow-hidden border-y border-cream/[0.07] py-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-ink to-transparent sm:w-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-ink to-transparent sm:w-40"
      />

      <div className="flex w-max animate-marquee items-center gap-14 pr-14 hover:[animation-play-state:paused] sm:gap-20 sm:pr-20">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex items-center gap-14 sm:gap-20"
            aria-hidden={copy === 1}
          >
            {brands.map((brand) => (
              <Link
                key={`${copy}-${brand.id}`}
                href={`/marca/${brand.slug}`}
                tabIndex={copy === 1 ? -1 : undefined}
                className="font-display text-xl font-bold tracking-[-0.03em] text-ash/70 transition-colors duration-300 hover:text-chalk sm:text-2xl"
              >
                {brand.wordmark}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
