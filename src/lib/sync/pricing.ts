import type { PricingMode, Product, SyncSettings } from "@/lib/types";

/* ==========================================================================
   Precio publicado

   Regla del módulo: el precio de venta nunca se escribe a mano. Sale del
   costo del proveedor más el margen configurado, y se recalcula solo cada vez
   que el costo cambia.

   La única excepción es `manual`, que existe para los productos que ya
   estaban cargados antes de que existiera este módulo: ahí el precio queda
   como está y ninguna importación lo mueve.
   ========================================================================== */

/** Configuración de precio de un producto, o los valores por defecto. */
export interface PricingConfig {
  pricingMode: PricingMode;
  marginPercent: number;
  marginFixed: number;
}

export function pricingOf(product: Product): PricingConfig {
  return {
    pricingMode: product.pricingMode,
    marginPercent: product.marginPercent,
    marginFixed: product.marginFixed,
  };
}

/**
 * Redondea hacia arriba al múltiplo pedido.
 *
 * Hacia arriba y no al más cercano a propósito: redondear para abajo comería
 * parte del margen, y un peso de más nunca duele tanto como uno de menos.
 */
export function roundUpTo(value: number, multiple: number): number {
  if (multiple <= 1) return Math.round(value);
  return Math.ceil(value / multiple) * multiple;
}

/**
 * Precio publicado a partir del costo.
 *
 * Devuelve `null` cuando el modo es `manual` o cuando no hay costo: en los dos
 * casos significa "no toques el precio que ya tiene".
 */
export function publishedPrice(
  supplierPrice: number,
  config: PricingConfig,
  settings: SyncSettings,
): number | null {
  if (config.pricingMode === "manual") return null;
  if (supplierPrice <= 0) return null;

  const raw =
    config.pricingMode === "fijo"
      ? supplierPrice + config.marginFixed
      : supplierPrice * (1 + config.marginPercent / 100);

  return roundUpTo(raw, settings.roundTo);
}

/** Cuánto se le suma al costo, en pesos. Para mostrarlo en el panel. */
export function appliedMargin(product: Product): number {
  if (product.supplierPrice <= 0) return 0;
  return product.price - product.supplierPrice;
}

/** El mismo margen en porcentaje, para la columna del panel. */
export function appliedMarginPercent(product: Product): number {
  if (product.supplierPrice <= 0) return 0;
  return Math.round((product.price / product.supplierPrice - 1) * 100);
}
