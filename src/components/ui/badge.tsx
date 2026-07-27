import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ProductTag } from "@/lib/types";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] leading-none",
  {
    variants: {
      variant: {
        neutral: "border-cream/12 bg-cream/[0.06] text-mist",
        /** Contorno crema: destaca sin gritar. */
        cream: "border-cream/40 bg-cream/12 text-cream",
        /** Crema sólido: sólo para la etiqueta más importante de la tarjeta. */
        solid: "border-cream bg-cream text-ink",
        ok: "border-ok/35 bg-ok/15 text-ok",
        warn: "border-warn/35 bg-warn/15 text-warn",
        bad: "border-bad/35 bg-bad/15 text-bad",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />;
}

export const TAG_META: Record<
  ProductTag,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  nuevo: { label: "Nuevo", variant: "cream" },
  "mas-vendido": { label: "Más vendido", variant: "solid" },
  "ultimos-pares": { label: "Últimos pares", variant: "warn" },
  oferta: { label: "Oferta", variant: "cream" },
};

export function TagBadge({ tag }: { tag: ProductTag }) {
  const meta = TAG_META[tag];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
