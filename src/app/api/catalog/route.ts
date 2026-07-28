import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

/** Tope de seguridad: nadie necesita resolver más que esto de una sola vez. */
const MAX_REFS = 48;

/**
 * Resuelve una lista de productos por id o por slug.
 *
 * Existe para que favoritos y "lo que viste recién" dejen de recibir el
 * catálogo entero. Esas listas viven en el navegador —el servidor no las
 * puede saber al renderizar— y la solución anterior era mandarle todos los
 * productos al cliente para que buscara adentro. Con 31 productos eso ya eran
 * 428 kB de HTML en la home; con el catálogo del proveedor cargado pasaría de
 * dos megas. Ahora el navegador pide sólo los pocos que le hacen falta.
 *
 *   GET /api/catalog?ids=a,b,c
 *   GET /api/catalog?slugs=x,y,z
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const ids = split(searchParams.get("ids"));
  const slugs = split(searchParams.get("slugs"));
  if (!ids.length && !slugs.length) {
    return NextResponse.json({ products: [] });
  }

  const catalog = await getAllProducts();
  const byId = new Map(catalog.map((product) => [product.id, product]));
  const bySlug = new Map(catalog.map((product) => [product.slug, product]));

  // Se respeta el orden pedido: en favoritos y en el historial ese orden es
  // información, no un detalle — es el orden en que el visitante los tocó.
  const refs = ids.length ? ids : slugs;
  const source = ids.length ? byId : bySlug;
  const products = refs
    .map((ref) => source.get(ref))
    .filter((product) => product !== undefined);

  return NextResponse.json({ products });
}

function split(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, MAX_REFS);
}
