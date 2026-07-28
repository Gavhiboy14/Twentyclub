"use client";

import type { ExtractionResult } from "./types";
import { mergeResults, productsFromRows, rowsFromItems, type TextItem } from "./extract";

/* ==========================================================================
   Lectura del PDF en el navegador

   Pasa acá y no en el servidor por una razón concreta: las funciones de
   Netlify cortan a los diez segundos y un catálogo de 47 páginas no entra.
   Recorriendo las páginas del lado del cliente no hay ningún request largo —
   al servidor le llega la tabla ya interpretada, que pesa unos pocos kB.

   El costo es que hay que dejar la pestaña abierta mientras analiza. Para una
   importación por mes es una molestia menor frente a montar una cola.
   ========================================================================== */

/** Progreso página por página, para poder mostrar una barra honesta. */
export type ProgressFn = (done: number, total: number) => void;

let pdfjs: typeof import("pdfjs-dist") | null = null;

/**
 * Carga pdf.js sólo cuando hace falta.
 *
 * Es un megabyte largo de JavaScript: si se importara arriba, lo pagaría
 * cualquiera que entre al panel aunque nunca vaya a importar nada.
 */
async function loadPdfjs() {
  if (pdfjs) return pdfjs;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjs = lib;
  return lib;
}

export async function readCatalogPdf(
  file: File,
  onProgress?: ProgressFn,
): Promise<ExtractionResult> {
  const lib = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await lib.getDocument({ data }).promise;

  const parts: ExtractionResult[] = [];

  for (let page = 1; page <= doc.numPages; page++) {
    const content = await (await doc.getPage(page)).getTextContent();

    const items: TextItem[] = [];
    for (const item of content.items) {
      // Los marcadores de estructura no traen texto; se descartan.
      if (!("str" in item)) continue;
      items.push({
        str: item.str,
        x: item.transform[4] as number,
        y: item.transform[5] as number,
      });
    }

    const { products, issues } = productsFromRows(rowsFromItems(items), page);
    parts.push({ pages: 1, products, issues });
    onProgress?.(page, doc.numPages);
  }

  await doc.destroy();
  return mergeResults(parts);
}
