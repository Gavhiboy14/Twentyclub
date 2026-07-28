"use client";

import { useEffect, useState } from "react";
import type { ProductView } from "@/lib/types";

/**
 * Resuelve productos guardados en el navegador contra la API.
 *
 * Favoritos y "lo que viste recién" guardan en localStorage una lista de
 * referencias, no productos. Antes la página serializaba el catálogo entero
 * en el HTML para que el cliente buscara adentro, lo que hacía que el peso de
 * la home creciera con cada producto que se cargara al catálogo. Pedir sólo
 * las pocas referencias que hay guardadas deja ese peso constante.
 *
 * `ready` es la bandera de hidratación de cada store: sin esperarla se
 * dispararía un pedido con la lista vacía en el primer render.
 */
export function useLocalProducts(
  kind: "ids" | "slugs",
  refs: string[],
  ready: boolean,
) {
  // La clave es el contenido y no el array: en cada render llega otra
  // identidad con los mismos valores, y comparar por identidad dispararía un
  // pedido por render.
  const key = refs.join(",");
  const [resolved, setResolved] = useState<{
    key: string;
    products: ProductView[];
  } | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setResolved({ key: "", products: [] });
      return;
    }

    let cancelled = false;
    fetch(`/api/catalog?${kind}=${encodeURIComponent(key)}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data: { products?: ProductView[] }) => {
        if (!cancelled) setResolved({ key, products: data.products ?? [] });
      })
      .catch(() => {
        // Una lista lateral que no carga no es motivo para romper la página.
        if (!cancelled) setResolved({ key, products: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [kind, key, ready]);

  // Mientras la respuesta corresponda a otra lista, se devuelve null: es la
  // diferencia entre "todavía no sé" y "no hay nada", y cada componente decide
  // qué mostrar en cada caso.
  const settled = resolved?.key === key;
  return {
    products: settled ? resolved.products : null,
    loading: ready && !settled,
  };
}
