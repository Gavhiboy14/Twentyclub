import { Layers, Tag, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * Banda de cifras, justo debajo del hero.
 *
 * Es el aterrizaje de la escena: después de una pantalla entera de atmósfera,
 * tres datos concretos. Las cifras salen del catálogo real —no son copy— así
 * que la banda se actualiza sola cuando entra una marca o un modelo nuevo.
 */
export function HeroBand({
  brandCount,
  modelCount,
}: {
  brandCount: number;
  modelCount: number;
}) {
  return (
    <section className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
      <div className="grid gap-4 sm:grid-cols-3">
        <BandCard
          icon={<Tag className="size-[1.15rem] stroke-[1.25]" />}
          value={String(brandCount)}
          label="Marcas"
          note="Elegidas de a una, no por catálogo"
          delay={0}
        />
        <BandCard
          icon={<Layers className="size-[1.15rem] stroke-[1.25]" />}
          value={String(modelCount)}
          label="Modelos"
          note="Con talles reales y stock al día"
          delay={0.08}
        />
        <BandCard
          icon={<Truck className="size-[1.15rem] stroke-[1.25]" />}
          value="24 h"
          label="Envío CABA"
          note="Al resto del país, 24 a 48 hs"
          delay={0.16}
        />
      </div>
    </section>
  );
}

function BandCard({
  icon,
  value,
  label,
  note,
  delay,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  note: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="glass edge-light group h-full rounded-[1.75rem] p-8 transition-colors duration-500 hover:bg-champagne/[0.05] lg:p-10">
        <span className="grid size-11 place-items-center rounded-full border border-champagne/10 bg-champagne/[0.04] text-gold transition-colors duration-500 group-hover:border-champagne/22">
          {icon}
        </span>
        <p className="display mt-9 text-4xl text-chalk lg:text-5xl">{value}</p>
        <p className="eyebrow mt-3">{label}</p>
        <p className="mt-5 max-w-[18rem] text-[0.8125rem] leading-relaxed text-ash">
          {note}
        </p>
      </div>
    </Reveal>
  );
}
