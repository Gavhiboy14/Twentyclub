"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { useFavorites } from "@/store/favorites";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "./product-grid";

export function FavoritesList({ catalog }: { catalog: ProductView[] }) {
  const { ids, hydrated, clear } = useFavorites();

  const products = ids
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is ProductView => Boolean(p));

  return (
    <>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4">Tu lista</p>
          <h1 className="display-wide text-[clamp(2.25rem,6vw,4rem)] text-cream">
            Favoritos
          </h1>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ash">
            Se guardan en este dispositivo. No hace falta crear una cuenta.
          </p>
        </div>

        {hydrated && products.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Vaciar lista
          </Button>
        )}
      </div>

      {!hydrated ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <div className="glass flex flex-col items-center gap-5 rounded-glass px-8 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-cream/5 text-ash">
            <Heart className="size-6" />
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
