"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/*
 * Cristal oscuro con foco champagne. El anillo de foco es la única
 * iluminación de acento del formulario, así que no compite con nada.
 */
const controlBase =
  "w-full rounded-2xl border border-champagne/10 bg-champagne/[0.03] px-4 text-sm text-chalk " +
  "backdrop-blur-xl placeholder:text-ash " +
  "transition-[border-color,background-color,box-shadow] duration-300 " +
  "hover:border-champagne/18 " +
  "focus:border-champagne/45 focus:bg-champagne/[0.055] focus:outline-none " +
  "focus:shadow-[0_0_0_3px_rgba(239,233,213,0.09)] " +
  "disabled:cursor-not-allowed disabled:opacity-45";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, "h-12", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlBase, "min-h-28 resize-y py-3.5 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      controlBase,
      "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23807d76%22 stroke-width=%221.75%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[position:right_1.1rem_center] bg-no-repeat pr-11",
      "[&>option]:bg-graphite [&>option]:text-chalk",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
NativeSelect.displayName = "NativeSelect";

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ash",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn("space-y-2.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
        : children}
      {hint ? <p className="text-xs leading-relaxed text-ash">{hint}</p> : null}
    </div>
  );
}
