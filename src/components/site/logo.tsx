import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * La chispa de cuatro puntas del logo. Es el único adorno de la marca, así que
 * se usa con cuentagotas: el lockup, el antetítulo del hero y poco más.
 */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 0c0 6.63 5.37 12 12 12-6.63 0-12 5.37-12 12 0-6.63-5.37-12-12-12C6.63 12 12 6.63 12 0Z" />
    </svg>
  );
}

/**
 * Lockup de marca.
 *
 * Es una reconstrucción tipográfica del logo. Si tenés el original vectorizado,
 * guardalo en `public/logo.svg` y reemplazá el bloque de texto por:
 *   <Image src="/logo.svg" alt="Twenty Club" width={132} height={34} priority />
 */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Twenty Club — inicio"
      className={cn("group flex items-center gap-2.5", className)}
    >
      <span className="relative grid size-8 shrink-0 place-items-center">
        <Sparkle className="size-[1.15rem] text-chalk transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90" />
        <Sparkle className="absolute -bottom-px -right-px size-2 text-champagne/70 transition-transform duration-700 group-hover:scale-125" />
      </span>

      {!compact && (
        <span className="font-display text-[1.0625rem] font-medium leading-none tracking-[-0.045em] text-chalk">
          Twenty
          <span className="text-ash transition-colors duration-500 group-hover:text-champagne">
            {" "}
            Club
          </span>
        </span>
      )}
    </Link>
  );
}
