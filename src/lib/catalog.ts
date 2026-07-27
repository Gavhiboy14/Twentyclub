/**
 * Tipos y etiquetas del catálogo. Vive separado de `data/queries` porque los
 * componentes de cliente (filtros, orden) necesitan estas constantes y no
 * pueden arrastrar el store de servidor al bundle del navegador.
 */

export type SortKey = "vendidos" | "nuevos" | "precio-asc" | "precio-desc";

export const SORT_LABELS: Record<SortKey, string> = {
  vendidos: "Más vendidos",
  nuevos: "Más nuevos",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
};

export interface ProductQuery {
  q?: string;
  brands?: string[];
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  /** Sólo pares con al menos un talle en stock. */
  available?: boolean;
  /** Sólo pares con descuento. */
  offers?: boolean;
  sort?: SortKey;
}

export interface Facets {
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  minPrice: number;
  maxPrice: number;
}
