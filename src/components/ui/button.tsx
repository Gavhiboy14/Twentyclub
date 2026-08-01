"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Dos botones de verdad y tres apoyos.
 *
 * `primary` es crema sólido sobre negro: el contraste más alto que da la
 * paleta, así que va uno solo por pantalla. `glass` es el secundario para
 * todo lo demás. El resto son variantes de bajo peso.
 */
const button = cva(
  "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-medium " +
    "transition-[transform,background-color,border-color,box-shadow,color] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] " +
    "disabled:pointer-events-none disabled:opacity-35 " +
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-champagne " +
    "[&_svg]:shrink-0 [&_svg]:size-[1.05em] [&_svg]:stroke-[1.75]",
  {
    variants: {
      variant: {
        primary:
          "bg-ivory text-ink shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5),0_16px_36px_-16px_rgba(239,233,213,0.35)] " +
          "hover:-translate-y-0.5 hover:bg-linen hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),0_24px_50px_-18px_rgba(239,233,213,0.45)] " +
          "active:translate-y-0 active:shadow-[0_2px_6px_-2px_rgba(0,0,0,0.5)]",
        glass:
          "glass text-chalk hover:-translate-y-0.5 hover:border-champagne/22 hover:bg-champagne/[0.07] hover:text-chalk " +
          "active:translate-y-0",
        /** Sólido en el acento de autoridad: para el único CTA que tiene que
         *  ganarle la vista a todo lo demás en la pantalla. */
        accent:
          "bg-ember text-linen shadow-[0_4px_18px_-4px_rgba(232,98,63,0.55),0_22px_46px_-20px_rgba(232,98,63,0.5)] " +
          "hover:-translate-y-0.5 hover:bg-ember-dim hover:shadow-[0_6px_20px_-4px_rgba(232,98,63,0.6),0_28px_54px_-18px_rgba(232,98,63,0.6)] " +
          "active:translate-y-0 active:shadow-[0_2px_8px_-2px_rgba(232,98,63,0.5)]",
        outline:
          "border border-iron/70 bg-transparent text-mist " +
          "hover:border-champagne/35 hover:bg-champagne/[0.04] hover:text-chalk",
        ghost: "text-mist hover:bg-champagne/[0.06] hover:text-chalk",
        danger:
          "border border-bad/30 bg-bad/12 text-bad hover:border-bad/45 hover:bg-bad/20",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-9 text-[0.9375rem]",
        xl: "h-16 px-11 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(button({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { button as buttonVariants };
