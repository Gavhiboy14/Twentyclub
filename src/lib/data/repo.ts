import type { Database, Order, Product, Settings } from "@/lib/types";
import type { CollectionName } from "@/lib/admin/schemas";
import type { ImportRun, ImportRunDetail } from "@/lib/sync/types";

/** Registro plano de una colección simple (marcas, categorías, banners, ofertas). */
export type Row = Record<string, unknown> & { id: string };

export type DeleteResult = "ok" | "missing" | "in-use";

/** El panel manda campos sueltos del cliente, no el objeto entero. */
export interface OrderPatch {
  status?: Order["status"];
  customer?: Partial<Order["customer"]>;
}

/**
 * Contrato de persistencia.
 *
 * Es el único punto del proyecto que sabe dónde viven los datos. Hay dos
 * implementaciones — archivo local y Supabase — y se elige con DATA_DRIVER.
 * Ninguna página ni route handler importa un driver directamente.
 */
export interface DataRepo {
  /**
   * La base entera. El catálogo son decenas de productos, así que traerlo
   * completo y filtrar en memoria es más simple y más rápido que armar una
   * query por vista. Si algún día pasás las 500 fichas, este es el método a
   * reemplazar por consultas puntuales; el resto del código no se entera.
   */
  snapshot(): Promise<Database>;

  createProduct(product: Product): Promise<Product>;
  /** El slug lo calcula quien llama: necesita ver el catálogo para no repetir. */
  updateProduct(id: string, patch: Partial<Product>): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;

  createRecord(collection: CollectionName, row: Row): Promise<Row>;
  updateRecord(
    collection: CollectionName,
    id: string,
    patch: Row,
  ): Promise<Row | null>;
  deleteRecord(collection: CollectionName, id: string): Promise<DeleteResult>;

  createOrder(order: Order): Promise<Order>;
  updateOrder(id: string, patch: OrderPatch): Promise<Order | null>;
  deleteOrder(id: string): Promise<boolean>;

  /**
   * Descuenta el stock de cada talle y suma las ventas. Se llama una sola vez,
   * cuando el pedido pasa a finalizado.
   */
  commitOrderStock(order: Order): Promise<void>;

  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  /* --- Sincronización de catálogo ----------------------------------------
     El historial vive aparte de `snapshot()` a propósito: cada corrida
     guarda el plan entero —cientos de líneas con su antes y su después— y
     la tienda no lo necesita nunca. Cargarlo en el snapshot sería pagar ese
     peso en cada visita a la home. */

  /** Sólo la cabecera de cada corrida, sin las líneas. Para el historial. */
  listImports(): Promise<ImportRun[]>;
  /** La corrida completa, con el plan. */
  getImport(id: string): Promise<ImportRunDetail | null>;
  createImport(run: ImportRunDetail): Promise<ImportRun>;
  updateImport(
    id: string,
    patch: Partial<ImportRunDetail>,
  ): Promise<ImportRun | null>;

  /** Vuelve al catálogo semilla. Sólo lo implementa el driver local. */
  reset?(): Promise<void>;
}

export type DriverName = "local" | "supabase";

export function driverName(): DriverName {
  return process.env.DATA_DRIVER === "supabase" ? "supabase" : "local";
}
