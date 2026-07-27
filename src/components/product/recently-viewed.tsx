"use client";

import type { ProductView } from "@/lib/types";
import { useRecent } from "@/store/recent";
import { Section, SectionHeader } from "@/components/site/section";
import { ProductRail } from "./product-grid";

/**
 * Recibe el catálogo completo y resuelve contra los slugs guardados en el
 * navegador. No se renderiza nada hasta hidratar, para no romper el HTML del
 * servidor con contenido que sólo existe en el cliente.
 */
export function RecentlyViewed({
  catalog,
  excludeSlug,
}: {
  catalog: ProductView[];
  excludeSlug?: string;
}) {
  const { slugs, hydrated } = useRecent();
  if (!hydrated) return null;

  const products = slugs
    .filter((slug) => slug !== excludeSlug)
    .map((slug) => catalog.find((p) => p.slug === slug))
    .filter((p): p is ProductView => Boolean(p));

  if (products.length < 2) return null;

  return (
    <Section>
      <SectionHeader
        eyebrow="Tu recorrido"
        title="Lo que viste recién"
        description="Se guarda sólo en este dispositivo. Nadie más lo ve."
      />
      <ProductRail products={products} />
    </Section>
  );
}
