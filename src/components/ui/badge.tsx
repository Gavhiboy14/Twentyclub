import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ProductTag } from "@/lib/types";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.18em] leading-none",
  {
    variants: {
      variant: {
        neutral: "border-champagne/12 bg-champagne/[0.05] text-mist",
        /** Contorno champagne: destaca sin gritar. */
        cream: "border-champagne/35 bg-champagne/10 text-champagne",
        /** Marfil sólido: sólo para la etiqueta más importante de una tarjeta. */
        solid: "border-ivory bg-ivory text-ink",
        ok: "border-ok/30 bg-ok/12 text-ok",
        warn: "border-warn/30 bg-warn/12 text-warn",
        bad: "border-bad/30 bg-bad/12 text-bad",
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
