import type { Metadata } from "next";
import Link from "next/link";
import { getDiscountedProducts, getOffers } from "@/lib/data/queries";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Pares con descuento real en Twenty Club. Mientras queden talles disponibles.",
  alternates: { canonical: "/ofertas" },
};

export default async function OffersPage() {
  const [products, offers] = await Promise.all([
    getDiscountedProducts(),
    getOffers(),
  ]);

  const biggest = products[0]?.discount ?? 0;
  const offer = offers[0];

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
      <Reveal className="mb-14">
        <p className="eyebrow mb-4">Descuentos vigentes</p>
        <h1 className="display-wide text-[clamp(2.25rem,6.5vw,4.5rem)] text-cream">
          <RevealWords text={`Hasta ${biggest}% menos`} />
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-mist">
          {offer
            ? `${offer.description} Termina el ${formatDate(offer.endsAt)}.`
            : "Descuentos directos, sin cupones ni letra chica."}
        </p>
      </Reveal>

      {products.length === 0 ? (
        <div className="glass rounded-glass px-8 py-20 text-center">
          <p className="font-display text-xl font-bold text-chalk">
            Ahora mismo no hay ofertas
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ash">
            Entran cada dos semanas. Mientras tanto, mirá la colección completa.
          </p>
          <Button asChild variant="glass" className="mt-6">
            <Link href="/productos">Ver colección</Link>
          </Button>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
