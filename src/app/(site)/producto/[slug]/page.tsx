import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
  getSettings,
} from "@/lib/data/queries";
import { ProductGallery } from "@/components/product/gallery";
import { BuyPanel } from "@/components/product/buy-panel";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { TrackRecentView } from "@/store/recent";
import { Section, SectionHeader } from "@/components/site/section";
import { Reveal } from "@/components/motion/reveal";
import { TagBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  const title = `${product.brand.name} ${product.name}`;
  return {
    title,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} · Twenty Club`,
      description: product.description.slice(0, 200),
      images: [{ url: product.images[0].url, width: 1000, height: 1000 }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, catalog, settings] = await Promise.all([
    getRelatedProducts(product, 4),
    getAllProducts(),
    getSettings(),
  ]);

  const title = `${product.brand.name} ${product.name}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: product.description,
    sku: product.sku,
    color: product.color,
    material: product.materials.join(", "),
    brand: { "@type": "Brand", name: product.brand.name },
    image: product.images.map((i) => `${siteUrl}${i.url}`),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/producto/${product.slug}`,
      priceCurrency: "ARS",
      price: product.finalPrice,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Twenty Club" },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: product.brand.name,
        item: `${siteUrl}/marca/${product.brand.slug}`,
      },
      { "@type": "ListItem", position: 3, name: title },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TrackRecentView slug={product.slug} />

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <nav aria-label="Migas de pan" className="mb-8 flex items-center gap-1.5 text-xs">
          <Link href="/" className="text-ash transition-colors hover:text-chalk">
            Inicio
          </Link>
          <ChevronRight className="size-3 text-iron" />
          <Link
            href={`/marca/${product.brand.slug}`}
            className="text-ash transition-colors hover:text-chalk"
          >
            {product.brand.name}
          </Link>
          <ChevronRight className="size-3 text-iron" />
          <span className="truncate text-mist">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal y={20}>
            <div className="lg:sticky lg:top-28">
              <ProductGallery images={product.images} alt={title} />
            </div>
          </Reveal>

          <Reveal y={20} delay={0.1}>
            <div className="space-y-8">
              <div>
                {product.tags.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                )}

                <Link
                  href={`/marca/${product.brand.slug}`}
                  className="eyebrow transition-colors hover:text-sand"
                >
                  {product.brand.name}
                </Link>
                <h1 className="display-xl mt-3 text-[clamp(2rem,5.5vw,3.25rem)] text-cream">
                  {product.name}
                </h1>

                <div className="mt-6 flex flex-wrap items-baseline gap-4">
                  <span className="font-display text-3xl font-bold tracking-tight text-cream">
                    {formatPrice(product.finalPrice)}
                  </span>
                  {product.discount > 0 && (
                    <>
                      <span className="text-lg text-ash line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="rounded-full border border-champagne/35 bg-champagne/15 px-2.5 py-1 numeric text-[0.6875rem] text-sand">
                        −{product.discount}%
                      </span>
                    </>
                  )}
                </div>

                <p className="mt-6 text-[0.9375rem] leading-relaxed text-mist">
                  {product.description}
                </p>
              </div>

              <BuyPanel product={product} />

              {/* Garantías */}
              <ul className="grid gap-3 border-y border-champagne/8 py-6 sm:grid-cols-3">
                <Perk icon={<Truck className="size-4" />} title="Envío sin cargo">
                  Desde {formatPrice(settings.freeShippingFrom)}
                </Perk>
                <Perk icon={<ShieldCheck className="size-4" />} title="Original">
                  Verificado antes de publicar
                </Perk>
                <Perk icon={<RotateCcw className="size-4" />} title="Cambio de talle">
                  15 días, sin costo en CABA
                </Perk>
              </ul>

              {/* Ficha técnica */}
              <div className="space-y-6">
                <div>
                  <h2 className="eyebrow mb-4">Características</h2>
                  <ul className="space-y-2.5">
                    {product.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-[0.9375rem] text-mist"
                      >
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-sand" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-champagne/8 pt-6">
                  <Spec label="Color" value={product.color} />
                  <Spec label="Materiales" value={product.materials.join(" · ")} />
                  <Spec label="SKU" value={product.sku} mono />
                  <Spec
                    label="Stock total"
                    value={`${product.totalStock} pares`}
                    mono
                  />
                </dl>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {related.length > 0 && (
        <Section>
          <SectionHeader
            eyebrow="Relacionados"
            title="También te puede servir"
            description="Misma marca o misma vuelta. Elegidos por parecido real, no al azar."
          />
          <ProductGrid products={related} priorityCount={0} />
        </Section>
      )}

      <RecentlyViewed catalog={catalog} excludeSlug={product.slug} />
    </>
  );
}

function Perk({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-cream">{icon}</span>
      <span>
        <span className="block text-[0.8125rem] font-medium text-chalk">
          {title}
        </span>
        <span className="block text-xs text-ash">{children}</span>
      </span>
    </li>
  );
}

function Spec({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="eyebrow mb-1.5">{label}</dt>
      <dd
        className={
          mono ? "numeric text-[0.8125rem] text-mist" : "text-sm text-mist"
        }
      >
        {value}
      </dd>
    </div>
  );
}
