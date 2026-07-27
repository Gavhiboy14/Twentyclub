import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  getAllProducts,
  getBanners,
  getBestSellers,
  getBrands,
  getFeaturedProducts,
  getHeroBanner,
  getNewArrivals,
  getSettings,
} from "@/lib/data/queries";
import { Hero } from "@/components/site/hero";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { Section, SectionHeader } from "@/components/site/section";
import { ProductGrid, ProductRail } from "@/components/product/product-grid";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Testimonials } from "@/components/site/testimonials";
import { Faq } from "@/components/site/faq";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default async function HomePage() {
  const [
    heroBanner,
    promos,
    brands,
    featured,
    newArrivals,
    bestSellers,
    catalog,
    settings,
  ] = await Promise.all([
    getHeroBanner(),
    getBanners("promo"),
    getBrands(),
    getFeaturedProducts(8),
    getNewArrivals(8),
    getBestSellers(8),
    getAllProducts(),
    getSettings(),
  ]);

  const heroProduct =
    catalog.find((p) => p.slug === "nike-air-max-plus") ?? featured[0];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Datos propios, no entrada de usuario.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {heroBanner && heroProduct && (
        <Hero banner={heroBanner} product={heroProduct} />
      )}

      <BrandMarquee brands={brands} />

      <Section id="coleccion">
        <SectionHeader
          eyebrow="Nuevos ingresos"
          title="Recién llegadas"
          description="Los últimos pares que entraron al depósito. Talles completos, por ahora."
          action={{ label: "Ver todo", href: "/productos?orden=nuevos" }}
        />
        <ProductRail products={newArrivals} />
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Selección"
          title="Los que elegimos nosotros"
          description="Ocho pares que valen lo que cuestan. Si tuviéramos que quedarnos con pocos, serían estos."
          action={{ label: "Toda la colección", href: "/productos" }}
        />
        <ProductGrid products={featured} />
      </Section>

      {/* Marcas */}
      <Section>
        <SectionHeader
          eyebrow="Nueve marcas"
          title="Elegí por dónde empezar"
          description="Cada marca tiene su propia página, con su historia y su selección."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand, i) => {
            const count = catalog.filter((p) => p.brandId === brand.id).length;
            return (
              <Reveal key={brand.id} delay={(i % 3) * 0.08}>
                <Link
                  href={`/marca/${brand.slug}`}
                  className="group relative block h-full overflow-hidden rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/60 p-8 backdrop-blur-xl transition-all duration-500 hover:border-champagne/18 hover:bg-graphite/80"
                >
                  {brand.banner && (
                    <Image
                      src={brand.banner}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 92vw, 30vw"
                      className="object-cover opacity-20 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:opacity-35"
                    />
                  )}
                  <div className="relative flex h-full min-h-40 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-display text-2xl font-medium tracking-[-0.04em] text-chalk transition-colors group-hover:text-cream">
                        {brand.name}
                      </p>
                      <ArrowUpRight className="size-4 shrink-0 text-ash transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sand" />
                    </div>
                    <p className="mt-2.5 max-w-xs text-[0.8125rem] leading-relaxed text-ash">
                      {brand.description}
                    </p>
                    <p className="eyebrow mt-auto pt-6">
                      {count} {count === 1 ? "modelo" : "modelos"}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Promos */}
      {promos.length > 0 && (
        <Section className="py-10 lg:py-14">
          <div className="grid gap-4 lg:grid-cols-2">
            {promos.map((banner, i) => (
              <Reveal key={banner.id} delay={i * 0.1}>
                <div className="relative flex min-h-72 flex-col justify-end overflow-hidden rounded-[1.75rem] border border-champagne/[0.07] p-10">
                  {banner.image && (
                    <Image
                      src={banner.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 92vw, 46vw"
                      className="object-cover opacity-45"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/75 to-ink/25" />
                  <div className="relative">
                    <p className="eyebrow mb-3">{banner.eyebrow}</p>
                    <h3 className="max-w-sm font-display text-2xl font-medium tracking-[-0.035em] text-chalk">
                      {banner.title}
                    </h3>
                    <p className="mt-2.5 max-w-md text-sm text-mist">
                      {banner.subtitle}
                    </p>
                    <Button asChild variant="glass" size="sm" className="mt-6">
                      <Link href={banner.ctaHref}>{banner.ctaLabel}</Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <SectionHeader
          eyebrow="Ranking"
          title="Los más vendidos"
          description="Ordenados por pares que salieron, no por lo que nos gustaría vender."
          action={{ label: "Ver ranking", href: "/productos?orden=vendidos" }}
        />
        <ProductRail products={bestSellers} />
      </Section>

      <RecentlyViewed catalog={catalog} />

      <Section>
        <SectionHeader
          eyebrow="Clientes"
          title="Lo que dicen los que ya compraron"
        />
        <Testimonials />
      </Section>

      <Section id="preguntas">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <SectionHeader
              eyebrow="Preguntas frecuentes"
              title="Todo lo que suelen preguntar"
              description="Si te queda alguna duda, escribinos por WhatsApp y te contestamos."
              className="mb-8"
            />
            <Button asChild variant="glass">
              <Link href="/contacto">Hablar con nosotros</Link>
            </Button>
          </div>
          <Reveal delay={0.1}>
            <Faq />
          </Reveal>
        </div>
      </Section>

      {/* Cierre */}
      <Section className="pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-champagne/[0.08] bg-graphite/50 px-8 py-24 text-center backdrop-blur-2xl sm:px-16 lg:py-32">
            <div
              aria-hidden
              className="absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-champagne/[0.12] blur-[130px]"
            />
            <div className="relative">
              <p className="eyebrow mb-5">Envío sin cargo</p>
              <h2 className="display mx-auto max-w-2xl text-[clamp(1.9rem,4.6vw,3.25rem)] text-chalk">
                Desde {formatPrice(settings.freeShippingFrom)} el envío lo
                ponemos nosotros.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-[0.9375rem] leading-[1.75] text-mist">
                A todo el país. Y si tenés dudas con el talle, escribinos antes
                de comprar: preferimos que aciertes.
              </p>
              <div className="mt-11 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/productos">Explorar colección</Link>
                </Button>
                <Button asChild variant="glass" size="lg">
                  <Link href="/contacto">Consultar un talle</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
