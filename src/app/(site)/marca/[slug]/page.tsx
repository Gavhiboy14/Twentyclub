import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getBrandBySlug,
  getBrands,
  getCategories,
  getFilterFacets,
  getProducts,
} from "@/lib/data/queries";
import type { SortKey } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { CatalogControls, FilterPanel } from "@/components/product/filters";
import { RevealWords } from "@/components/motion/reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Marca no encontrada" };

  return {
    title: `Zapatillas ${brand.name}`,
    description: `${brand.description} Comprá ${brand.name} original en Twenty Club.`,
    alternates: { canonical: `/marca/${brand.slug}` },
    openGraph: {
      title: `${brand.name} · Twenty Club`,
      description: brand.description,
      images: brand.banner ? [{ url: brand.banner }] : undefined,
    },
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const asList = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.split(",").filter(Boolean) : [];

const asOne = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [products, brands, categories, facets] = await Promise.all([
    getProducts({
      brands: [brand.slug],
      categories: asList(sp.cat),
      sizes: asList(sp.talle),
      colors: asList(sp.color),
      minPrice: sp.min ? Number(sp.min) : undefined,
      maxPrice: sp.max ? Number(sp.max) : undefined,
      available: Boolean(sp.disp),
      offers: Boolean(sp.oferta),
      sort: (asOne(sp.orden) as SortKey) ?? "vendidos",
    }),
    getBrands(),
    getCategories(),
    getFilterFacets(),
  ]);

  return (
    <div>
      {/* Portada de marca */}
      <header className="relative isolate grain overflow-hidden">
        {brand.banner && (
          <Image
            src={brand.banner}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/75 to-ink/40" />

        <div className="mx-auto max-w-[86rem] px-5 pb-20 pt-20 sm:px-8 lg:pb-28 lg:pt-32">
          <p className="eyebrow mb-5">Marca</p>
          <h1 className="display-xl text-[clamp(2.5rem,9vw,6rem)] text-chalk">
            <RevealWords text={brand.name} />
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-mist">
            {brand.description}
          </p>
          <p className="eyebrow mt-8">
            {products.length} {products.length === 1 ? "modelo" : "modelos"} en
            stock
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <Suspense fallback={null}>
                <FilterPanel
                  brands={brands}
                  categories={categories}
                  facets={facets}
                  lockedBrand={brand.slug}
                  resultCount={products.length}
                />
              </Suspense>
            </div>
          </aside>

          <div className="min-w-0">
            <Suspense fallback={<ProductGridSkeleton count={6} />}>
              <CatalogControls
                brands={brands}
                categories={categories}
                facets={facets}
                lockedBrand={brand.slug}
                resultCount={products.length}
              />
            </Suspense>

            {products.length === 0 ? (
              <div className="rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 backdrop-blur-xl px-8 py-20 text-center">
                <p className="font-display text-lg font-bold text-chalk">
                  Nada de {brand.name} con esos filtros
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
                  Sacá algún filtro para ver el resto de la selección.
                </p>
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
