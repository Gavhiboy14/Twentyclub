import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import {
  getBrands,
  getCategories,
  getFilterFacets,
  getProducts,
} from "@/lib/data/queries";
import type { SortKey } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { CatalogControls, FilterPanel } from "@/components/product/filters";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Colección completa",
  description:
    "Todas las zapatillas de Twenty Club: nueve marcas, filtros por talle, color, precio y disponibilidad.",
  alternates: { canonical: "/productos" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const asList = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.split(",").filter(Boolean) : [];

const asOne = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const query = {
    q: asOne(sp.q),
    brands: asList(sp.marca),
    categories: asList(sp.cat),
    sizes: asList(sp.talle),
    colors: asList(sp.color),
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    available: Boolean(sp.disp),
    offers: Boolean(sp.oferta),
    sort: (asOne(sp.orden) as SortKey) ?? "vendidos",
  };

  const [products, brands, categories, facets] = await Promise.all([
    getProducts(query),
    getBrands(),
    getCategories(),
    getFilterFacets(),
  ]);

  return (
    <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
      <Reveal className="mb-12">
        <p className="eyebrow mb-4">Catálogo</p>
        <h1 className="display-xl text-[clamp(2.25rem,6vw,4rem)] text-chalk">
          {query.q ? `«${query.q}»` : "Toda la colección"}
        </h1>
        <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-ash">
          {query.q
            ? "Resultados de tu búsqueda por marca, modelo, nombre o color."
            : "Filtrá por talle y quedate sólo con los pares que existen en el tuyo."}
        </p>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Suspense fallback={null}>
              <FilterPanel
                brands={brands}
                categories={categories}
                facets={facets}
                resultCount={products.length}
              />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0">
          <Suspense fallback={<ProductGridSkeleton />}>
            <CatalogControls
              brands={brands}
              categories={categories}
              facets={facets}
              resultCount={products.length}
            />
          </Suspense>

          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 backdrop-blur-xl px-8 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-champagne/5 text-ash">
        <PackageSearch className="size-6" />
      </div>
      <div>
        <p className="font-display text-xl font-medium text-chalk">
          Ningún par entra en esos filtros
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
          Probá aflojando el rango de precio o sacando el talle. Si buscás algo
          puntual, escribinos y lo conseguimos.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="glass">
          <Link href="/productos">Limpiar todo</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contacto">Pedir un modelo</Link>
        </Button>
      </div>
    </div>
  );
}
