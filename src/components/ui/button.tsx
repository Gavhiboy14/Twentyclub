"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium " +
    "transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
    "disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] " +
    "[&_svg]:shrink-0 [&_svg]:size-[1.05em]",
  {
    variants: {
      variant: {
        // La acción principal es crema sólido sobre carbón: es el contraste
        // más alto que da la marca, así que se reserva para una por pantalla.
        primary:
          "bg-cream text-ink shadow-[0_10px_30px_-12px_rgba(247,244,224,0.45)] " +
          "hover:bg-white hover:shadow-[0_16px_44px_-14px_rgba(247,244,224,0.6)]",
        glass:
          "glass text-chalk hover:border-cream/25 hover:bg-cream/[0.08] hover:text-cream",
        outline:
          "border border-iron/80 bg-transparent text-mist hover:border-cream/50 hover:text-chalk",
        ghost: "text-mist hover:bg-cream/[0.07] hover:text-chalk",
        danger: "bg-bad/15 text-bad border border-bad/30 hover:bg-bad/25",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-[0.9375rem]",
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
