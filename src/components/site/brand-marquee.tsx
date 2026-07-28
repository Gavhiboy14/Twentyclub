import Link from "next/link";
import type { Brand } from "@/lib/types";

/**
 * Carrusel de marcas. Se duplica la lista para que el loop no tenga costura;
 * la copia va oculta para lectores de pantalla.
 */
export function BrandMarquee({ brands }: { brands: Brand[] }) {
  return (
    <div className="relative overflow-hidden border-y border-champagne/[0.06] py-9">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-linear-to-r from-ink to-transparent sm:w-48"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-linear-to-l from-ink to-transparent sm:w-48"
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
                className="font-display text-lg font-bold tracking-[0.02em] text-ash/60 uppercase transition-colors duration-500 hover:text-chalk sm:text-xl"
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
