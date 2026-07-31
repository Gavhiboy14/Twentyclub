import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Footprints, Ruler } from "lucide-react";
import { getSettings } from "@/lib/data/queries";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/social-icons";
import { normalizePhone } from "@/lib/whatsapp";
import { MEASURE_STEPS, SIZE_TABLE } from "@/lib/content/sizes";

export const metadata: Metadata = {
  title: "Guía de talles",
  description:
    "Nuestras zapatillas son de origen brasilero: la numeración corre un punto abajo de la argentina. Tabla de equivalencias BR–AR y cómo medir tu pie en casa.",
  alternates: { canonical: "/guia-de-talles" },
};

export default async function SizeGuidePage() {
  const settings = await getSettings();
  const wa = `https://wa.me/${normalizePhone(settings.whatsappNumber)}`;

  return (
    <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
      <Reveal className="mb-14 max-w-2xl">
        <p className="eyebrow mb-4">Guía de talles</p>
        <h1 className="display-xl text-[clamp(2.25rem,6.5vw,4.5rem)] text-chalk">
          <RevealWords text="Un talle menos del que usás." />
        </h1>
        <p className="mt-6 text-base leading-relaxed text-mist">
          Trabajamos con zapatillas de origen brasilero, y ahí está el detalle:
          los talles no coinciden exactamente con los que usamos en Argentina.
        </p>
      </Reveal>

      {/* La regla. Es lo único que la mayoría necesita leer, así que va sola,
          grande y antes que cualquier tabla. */}
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-champagne/[0.09] bg-graphite/60 p-8 backdrop-blur-xl sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-champagne/[0.07] blur-[90px]"
          />
          <div className="relative">
            <p className="eyebrow mb-5 text-chalk">Recomendación clave</p>
            <p className="display text-[clamp(1.6rem,3.6vw,2.5rem)] text-chalk">
              Pedí un talle menos del que usás normalmente y te va a calzar
              perfecto.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5 rounded-[1.5rem] border border-champagne/[0.07] bg-ink/40 px-6 py-5">
              <div>
                <p className="eyebrow mb-1.5">Usás en Argentina</p>
                <p className="numeric font-display text-3xl font-bold text-mist">
                  41
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 stroke-[1.25] text-chalk" />
              <div>
                <p className="eyebrow mb-1.5 text-chalk">Pedís en Twenty</p>
                <p className="numeric font-display text-3xl font-bold text-chalk">
                  40
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Medir el pie */}
      <section className="mt-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <span className="mb-6 grid size-12 place-items-center rounded-full border border-champagne/12 bg-champagne/[0.04] text-chalk">
              <Footprints className="size-5 stroke-[1.25]" />
            </span>
            <h2 className="display-xl text-[clamp(1.85rem,4.5vw,3rem)] text-chalk">
              ¿Querés asegurarte del todo?
            </h2>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ash">
              Medí tu pie en casa. Te lleva dos minutos y no falla: el
              centímetro manda más que el número.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="space-y-3">
              {MEASURE_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-5 rounded-[1.5rem] border border-champagne/[0.07] bg-graphite/50 px-6 py-5 backdrop-blur-xl"
                >
                  <span className="numeric shrink-0 text-sm tracking-[0.18em] text-chalk">
                    0{i + 1}
                  </span>
                  <p className="text-[0.9375rem] leading-[1.7] text-mist">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Tabla */}
      <section className="mt-28">
        <Reveal className="mb-10">
          <span className="mb-6 grid size-12 place-items-center rounded-full border border-champagne/12 bg-champagne/[0.04] text-chalk">
            <Ruler className="size-5 stroke-[1.25]" />
          </span>
          <h2 className="display-xl text-[clamp(1.85rem,4.5vw,3rem)] text-chalk">
            Tabla de conversión
          </h2>
          <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-ash">
            Buscá el talle que usás en Argentina y fijate cuál te toca pedir.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 backdrop-blur-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-champagne/[0.07] bg-champagne/[0.02]">
                  <Th>Usás (AR)</Th>
                  <Th accent>Pedís (BR)</Th>
                  <Th>Largo del pie</Th>
                </tr>
              </thead>
              <tbody>
                {SIZE_TABLE.map((row) => (
                  <tr
                    key={row.br}
                    className="border-b border-champagne/[0.04] transition-colors last:border-0 hover:bg-champagne/[0.03]"
                  >
                    <td className="px-5 py-4 sm:px-8">
                      <span className="numeric text-base text-mist">
                        {row.ar}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-8">
                      <span className="numeric font-display text-lg font-bold text-chalk">
                        {row.br}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-8">
                      <span className="numeric text-base text-ash">
                        {row.cm} cm
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* Cierre */}
      <Reveal className="mt-24">
        <div className="rounded-[2rem] border border-champagne/[0.08] bg-graphite/50 px-8 py-14 text-center backdrop-blur-2xl sm:px-16">
          <h2 className="display mx-auto max-w-xl text-[clamp(1.5rem,3.4vw,2.25rem)] text-chalk">
            ¿Seguís con dudas entre dos talles?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[0.9375rem] leading-[1.75] text-mist">
            Escribinos antes de comprar y lo vemos juntos. Preferimos que
            aciertes a la primera.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-[1.15em]" />
                Consultar por WhatsApp
              </a>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/productos">Ver la colección</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Th({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`px-5 py-4 font-mono text-[0.6875rem] uppercase tracking-[0.18em] sm:px-8 ${
        accent ? "text-chalk" : "text-ash"
      }`}
    >
      {children}
    </th>
  );
}
