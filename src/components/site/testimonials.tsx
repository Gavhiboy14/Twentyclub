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
    <div className="grid gap-5 md:grid-cols-3">
      {TESTIMONIALS.map((item, i) => (
        <Reveal key={item.name} delay={i * 0.1}>
          <figure className="glass edge-light flex h-full flex-col rounded-glass p-7">
            <Quote className="size-5 text-cream/70" />
            <blockquote className="mt-5 flex-1 text-[0.9375rem] leading-relaxed text-mist">
              {item.quote}
            </blockquote>
            <figcaption className="mt-7 border-t border-cream/8 pt-5">
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
