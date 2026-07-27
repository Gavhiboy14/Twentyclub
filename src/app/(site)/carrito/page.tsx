import type { Metadata } from "next";
import { getSettings } from "@/lib/data/queries";
import { CartPage } from "@/components/site/cart-page";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisá tu pedido y cerralo por WhatsApp.",
  robots: { index: false, follow: true },
};

export default async function CarritoPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
      <header className="mb-12">
        <p className="eyebrow mb-4">Paso final</p>
        <h1 className="display-xl text-[clamp(2.25rem,6vw,4rem)] text-chalk">
          Tu carrito
        </h1>
        <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ash">
          Revisá talles y cantidades. Al finalizar se abre WhatsApp con el
          pedido ya escrito.
        </p>
      </header>

      <CartPage freeShippingFrom={settings.freeShippingFrom} />
    </div>
  );
}
