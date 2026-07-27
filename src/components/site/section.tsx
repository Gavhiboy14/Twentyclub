import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

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
      className={cn("mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28", className)}
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
    <Reveal className={cn("mb-10 lg:mb-14", className)}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 className="display-wide text-[clamp(1.85rem,4.5vw,3rem)] text-chalk">
            {title}
          </h2>
          {description && (
            <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-ash">
              {description}
            </p>
          )}
        </div>

        {action && (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.03] px-5 py-2.5 text-[0.8125rem] text-mist transition-all duration-300 hover:border-cream/40 hover:text-chalk"
          >
            {action.label}
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </Reveal>
  );
}
