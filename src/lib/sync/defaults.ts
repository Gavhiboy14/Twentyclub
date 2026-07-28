import type { Product, SyncSettings } from "@/lib/types";

/**
 * Valores de sincronización para un producto que no vino de una importación.
 *
 * `pricingMode: "manual"` es la decisión importante: todo lo que se cargó a
 * mano —el catálogo entero de antes de que existiera este módulo— queda fuera
 * del cálculo automático de precio. Ninguna importación se lo puede mover
 * hasta que alguien lo pase a margen desde el panel, a propósito.
 *
 * `supplierRef` vacío tiene el mismo efecto del otro lado: un producto sin
 * referencia nunca se marca "no disponible" por no aparecer en el PDF, porque
 * nunca dependió de ese PDF.
 */
export const PRODUCT_SYNC_DEFAULTS = {
  status: "publicado",
  pricingMode: "manual",
  supplierPrice: 0,
  supplierRef: "",
  marginPercent: 0,
  marginFixed: 0,
  lastSyncAt: null,
} as const satisfies Pick<
  Product,
  | "status"
  | "pricingMode"
  | "supplierPrice"
  | "supplierRef"
  | "marginPercent"
  | "marginFixed"
  | "lastSyncAt"
>;

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  pricingMode: "margen",
  marginPercent: 35,
  marginFixed: 15000,
  roundTo: 100,
};

/** Completa un producto viejo con los campos de sincronización que le falten. */
export function withSyncDefaults<T extends object>(
  product: T,
): T & typeof PRODUCT_SYNC_DEFAULTS {
  return { ...PRODUCT_SYNC_DEFAULTS, ...product };
}
