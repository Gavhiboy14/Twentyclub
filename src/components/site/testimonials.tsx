import { Quote } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const TESTIMONIALS = [
  {
    quote:
      "Pregunté por el talle un martes a la noche y me contestaron en diez minutos. Las Samba llegaron el jueves.",
    name: "Martina R.",
    detail: "Palermo, CABA",
    purchase: "Adidas Samba OG · Talle 39",
  },
  {
    quote:
      "Es la primera vez que compro zapatillas sin probármelas y no me equivoqué. La ficha del producto tenía todo.",
    name: "Bruno C.",
    detail: "Rosario",
    purchase: "New Balance 9060 · Talle 43",
  },
  {
    quote:
      "Me avisaron que quedaba un solo par en mi talle antes de que lo pague. Eso no lo hace nadie.",
    name: "Sol A.",
    detail: "Córdoba",
    purchase: "Jordan 1 Low · Talle 40",
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
      {TESTIMONIALS.map((item, i) => (
        <Reveal key={item.name} delay={i * 0.1}>
          <figure className="flex h-full flex-col rounded-[1.75rem] border border-champagne/[0.07] bg-graphite/50 p-9 backdrop-blur-xl">
            <Quote className="size-5 text-cream/70" />
            <blockquote className="mt-6 flex-1 text-[0.9375rem] leading-[1.75] text-mist">
              {item.quote}
            </blockquote>
            <figcaption className="mt-8 border-t border-champagne/[0.08] pt-6">
              <p className="text-sm font-semibold text-chalk">{item.name}</p>
              <p className="mt-0.5 text-xs text-ash">{item.detail}</p>
              <p className="eyebrow mt-3">{item.purchase}</p>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
