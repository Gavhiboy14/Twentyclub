import { cn } from "@/lib/utils";
import { Sparkle } from "./logo";

/**
 * Anillo de carga.
 *
 * Es CSS puro y sin estado: un `loading.tsx` se manda en el primer flush del
 * stream, antes de que el servidor haya resuelto los datos, así que cualquier
 * JavaScript acá llegaría tarde para lo único que tiene que hacer.
 *
 * Dos anillos superpuestos: la pista fija marca el círculo completo y el arco
 * dorado gira encima. Sin la pista, un arco solo en un fondo negro se lee como
 * un destello suelto y no como algo que está cargando.
 */
export function Loader({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "size-7" : "size-12";

  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn("relative grid place-items-center", box, className)}
    >
      <span className="absolute inset-0 rounded-full border border-champagne/12" />
      <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-gold [animation-duration:0.9s]" />
      {size === "md" && <Sparkle className="size-2.5 text-champagne/35" />}
    </span>
  );
}

/**
 * Pantalla de carga de una ruta.
 *
 * El alto sale de `svh` menos la barra: centrado en el viewport real y no en
 * el documento, así el anillo no queda a mitad de camino en mobile cuando el
 * navegador esconde su propia barra.
 */
export function RouteLoader({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="grid min-h-[calc(100svh-9rem)] place-items-center px-5">
      <div className="flex flex-col items-center gap-6">
        <Loader />
        <p className="eyebrow animate-pulse">{label}</p>
      </div>
    </div>
  );
}
