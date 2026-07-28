import { RouteLoader } from "@/components/site/loader";

/**
 * Cubre toda la tienda. Next lo manda en el primer flush del stream, así que
 * el visitante ve la barra y el anillo mientras el servidor todavía está
 * resolviendo el catálogo, en vez de una pantalla en blanco.
 */
export default function Loading() {
  return <RouteLoader />;
}
