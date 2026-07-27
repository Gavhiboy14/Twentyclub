"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

const Overlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "tc-overlay fixed inset-0 z-50 bg-ink/70 backdrop-blur-md",
      className,
    )}
    {...props}
  />
));
Overlay.displayName = "DialogOverlay";
export { Overlay as DialogOverlay };

/** Modal centrado. */
export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean;
  }
>(({ className, children, hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "tc-modal glass-strong grain edge-light fixed left-1/2 top-1/2 z-50",
        "w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
        "rounded-[1.75rem] p-7",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-ash transition-colors hover:bg-cream/10 hover:text-chalk"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

/** Panel lateral — carrito y filtros en mobile. */
export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "right" | "left" | "bottom";
  }
>(({ className, children, side = "right", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "glass-strong grain fixed z-50 flex flex-col",
        side === "right" &&
          "tc-sheet-right inset-y-0 right-0 w-[min(28rem,100vw)] rounded-l-[1.75rem]",
        side === "left" &&
          "tc-sheet-left inset-y-0 left-0 w-[min(24rem,100vw)] rounded-r-[1.75rem]",
        side === "bottom" &&
          "tc-sheet-bottom inset-x-0 bottom-0 max-h-[85vh] rounded-t-[1.75rem]",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
