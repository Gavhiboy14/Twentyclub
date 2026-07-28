"use client";

import { useRecent } from "@/store/recent";
import { Section, SectionHeader } from "@/components/site/section";
import { ProductRail } from "./product-grid";
import { useLocalProducts } from "./use-local-products";

/**
 * Resuelve contra la API los slugs guardados en el navegador.
 *
 * No se renderiza nada hasta tener la respuesta: la sección va abajo de todo
 * y aparecer tarde no molesta, pero reservar espacio para algo que quizá no
 * exista sí correría el resto de la página.
 */
export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const { slugs, hydrated } = useRecent();
  const wanted = slugs.filter((slug) => slug !== excludeSlug);
  const { products } = useLocalProducts("slugs", wanted, hydrated);

  if (!products || products.length < 2) return null;

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
