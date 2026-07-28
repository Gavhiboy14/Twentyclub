"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/store/favorites";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "./product-grid";
import { useLocalProducts } from "./use-local-products";

/** La lista vive en el navegador; los productos se piden por id a la API. */
export function FavoritesList() {
  const { ids, hydrated, clear } = useFavorites();
  const { products } = useLocalProducts("ids", ids, hydrated);

  return (
    <>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4">Tu lista</p>
          <h1 className="display-xl text-[clamp(2.25rem,6vw,4rem)] text-chalk">
            Favoritos
          </h1>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ash">
            Se guardan en este dispositivo. No hace falta crear una cuenta.
          </p>
        </div>

        {products && products.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Vaciar lista
          </Button>
        )}
      </div>

      {!products ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-6 rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 backdrop-blur-xl px-8 py-24 text-center">
          <div className="grid size-16 place-items-center rounded-2xl border border-champagne/[0.08] bg-champagne/[0.03] text-ash">
            <Heart className="size-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-chalk">
              Todavía no guardaste nada
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
              Tocá el corazón en cualquier par y vuelve a aparecer acá.
            </p>
          </div>
          <Button asChild variant="glass">
            <Link href="/productos">Explorar colección</Link>
          </Button>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </>
  );
}
