import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

/**
 * El aire entre secciones es una decisión de marca, no un detalle: a
 * py-36 en desktop cada bloque se lee como una página aparte, que es
 * exactamente lo que separa una vidriera de un catálogo.
 */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto max-w-[86rem] px-5 py-24 sm:px-8 lg:py-36",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <Reveal className={cn("mb-14 lg:mb-20", className)}>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-2xl">
          <p className="eyebrow mb-5">{eyebrow}</p>
          <h2 className="display text-[clamp(1.9rem,4.2vw,3.15rem)] text-chalk">
            {title}
          </h2>
          {description && (
            <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.75] text-ash">
              {description}
            </p>
          )}
        </div>

        {action && (
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-champagne/10 px-6 py-3 text-[0.8125rem] text-mist transition-all duration-400 hover:border-champagne/28 hover:bg-champagne/[0.04] hover:text-chalk"
          >
            {action.label}
            <ArrowRight className="size-3.5 stroke-[1.5] transition-transform duration-400 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </Reveal>
  );
}
