import { cache } from "react";
import type { Database, Order, Product, Settings } from "@/lib/types";
import { DEFAULT_SYNC_SETTINGS } from "@/lib/sync/defaults";
import { supabaseAdmin } from "../supabase-client";
import {
  ROW_MAPPERS,
  bannerFromRow,
  brandFromRow,
  categoryFromRow,
  offerFromRow,
  orderFromRow,
  orderToRow,
  productFromRow,
  productToRow,
  recordToRow,
  syncRuleFromRow,
} from "../mapping";
import type { DataRepo, DeleteResult } from "../repo";

/**
 * Driver de Supabase. Es el que se usa en producción (DATA_DRIVER=supabase).
 *
 * Las escrituras son puntuales — un insert, un update, un delete — así que no
 * hay read-modify-write de la base entera y dos administradores editando a la
 * vez no se pisan.
 */

const DEFAULT_SETTINGS: Settings = {
  storeName: "Twenty Club",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  email: "",
  instagram: "",
  tiktok: "",
  address: "",
  freeShippingFrom: 0,
  sync: DEFAULT_SYNC_SETTINGS,
};

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`Supabase — ${context}: ${error?.message ?? "error desconocido"}`);
}

/**
 * Trae la base completa. `cache` la deduplica dentro de un mismo request, así
 * que una página que llama a seis queries distintas hace una sola ida a la base.
 */
const loadSnapshot = cache(async (): Promise<Database> => {
  const db = supabaseAdmin();

  const [products, brands, categories, banners, offers, orders, settings, rules] =
    await Promise.all([
      db.from("products").select("*"),
      db.from("brands").select("*"),
      db.from("categories").select("*"),
      db.from("banners").select("*"),
      db.from("offers").select("*"),
      db.from("orders").select("*"),
      db.from("settings").select("data").eq("id", 1).maybeSingle(),
      db.from("sync_rules").select("*"),
    ]);

  if (products.error) fail("leer productos", products.error);
  if (brands.error) fail("leer marcas", brands.error);
  if (categories.error) fail("leer categorías", categories.error);
  if (banners.error) fail("leer banners", banners.error);
  if (offers.error) fail("leer ofertas", offers.error);
  if (orders.error) fail("leer pedidos", orders.error);
  if (settings.error) fail("leer ajustes", settings.error);

  return {
    products: (products.data ?? []).map(productFromRow),
    brands: (brands.data ?? []).map(brandFromRow),
    categories: (categories.data ?? []).map(categoryFromRow),
    banners: (banners.data ?? []).map(bannerFromRow),
    offers: (offers.data ?? []).map(offerFromRow),
    orders: (orders.data ?? []).map(orderFromRow),
    settings: {
      ...DEFAULT_SETTINGS,
      ...((settings.data?.data ?? {}) as Partial<Settings>),
      sync: {
        ...DEFAULT_SYNC_SETTINGS,
        ...((settings.data?.data as { sync?: object } | null)?.sync ?? {}),
      },
    },
    /* La tabla es nueva: si todavía no se corrió la migración, `rules.error`
       viene con "relation does not exist" y el sitio tiene que seguir
       andando igual, sin reglas. */
    syncRules: rules.error ? [] : (rules.data ?? []).map(syncRuleFromRow),
  };
});

export const supabaseRepo: DataRepo = {
  snapshot: loadSnapshot,

  async createProduct(product: Product) {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .insert(productToRow(product))
      .select()
      .single();
    if (error) fail("crear producto", error);
    return productFromRow(data);
  },

  async updateProduct(id, patch) {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .update(productToRow(patch))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("editar producto", error);
    return data ? productFromRow(data) : null;
  },

  async deleteProduct(id) {
    const db = supabaseAdmin();

    // Las ofertas que lo incluían quedarían con un id fantasma.
    const { data: offers, error: offersError } = await db
      .from("offers")
      .select("id, product_ids")
      .contains("product_ids", [id]);
    if (offersError) fail("buscar ofertas del producto", offersError);

    for (const offer of offers ?? []) {
      const next = (offer.product_ids as string[]).filter((pid) => pid !== id);
      const { error } = await db
        .from("offers")
        .update({ product_ids: next })
        .eq("id", offer.id);
      if (error) fail("sacar el producto de una oferta", error);
    }

    const { data, error } = await db
      .from("products")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail("borrar producto", error);
    return (data ?? []).length > 0;
  },

  async createRecord(collection, row) {
    const { data, error } = await supabaseAdmin()
      .from(collection)
      .insert(recordToRow(collection, row))
      .select()
      .single();
    if (error) fail(`crear en ${collection}`, error);
    return ROW_MAPPERS[collection](data);
  },

  async updateRecord(collection, id, patch) {
    const { data, error } = await supabaseAdmin()
      .from(collection)
      .update(recordToRow(collection, patch))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail(`editar en ${collection}`, error);
    return data ? ROW_MAPPERS[collection](data) : null;
  },

  async deleteRecord(collection, id): Promise<DeleteResult> {
    const db = supabaseAdmin();

    if (collection === "brands") {
      const { count, error } = await db
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", id);
      if (error) fail("contar productos de la marca", error);
      if ((count ?? 0) > 0) return "in-use";
    }

    if (collection === "categories") {
      const { data: products, error } = await db
        .from("products")
        .select("id, category_ids")
        .contains("category_ids", [id]);
      if (error) fail("buscar productos de la categoría", error);

      for (const product of products ?? []) {
        const next = (product.category_ids as string[]).filter((c) => c !== id);
        const { error: updateError } = await db
          .from("products")
          .update({ category_ids: next })
          .eq("id", product.id);
        if (updateError) fail("sacar la categoría de un producto", updateError);
      }
    }

    const { data, error } = await db
      .from(collection)
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail(`borrar de ${collection}`, error);
    return (data ?? []).length > 0 ? "ok" : "missing";
  },

  async createOrder(order: Order) {
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .insert(orderToRow(order))
      .select()
      .single();
    if (error) fail("registrar pedido", error);
    return orderFromRow(data);
  },

  async updateOrder(id, patch) {
    const db = supabaseAdmin();
    const row = orderToRow({ status: patch.status });

    // El cliente se mergea, no se reemplaza: el panel manda campos sueltos.
    if (patch.customer) {
      const { data: current, error } = await db
        .from("orders")
        .select("customer")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("leer el pedido", error);
      if (!current) return null;
      row.customer = { ...(current.customer ?? {}), ...patch.customer };
    }

    const { data, error } = await db
      .from("orders")
      .update(row)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("editar pedido", error);
    return data ? orderFromRow(data) : null;
  },

  async deleteOrder(id) {
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail("borrar pedido", error);
    return (data ?? []).length > 0;
  },

  async commitOrderStock(order: Order) {
    // Restar de un array JSON con read-modify-write abriría una carrera si dos
    // pedidos se cierran a la vez, así que la resta la hace Postgres.
    const { error } = await supabaseAdmin().rpc("commit_order_stock", {
      order_id: order.id,
    });
    if (error) fail("descontar stock", error);
  },

  async updateSettings(patch: Partial<Settings>) {
    const db = supabaseAdmin();

    const { data: current, error: readError } = await db
      .from("settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (readError) fail("leer ajustes", readError);

    const merged: Settings = {
      ...DEFAULT_SETTINGS,
      ...((current?.data ?? {}) as Partial<Settings>),
      ...patch,
    };

    const { error } = await db
      .from("settings")
      .upsert({ id: 1, data: merged });
    if (error) fail("guardar ajustes", error);

    return merged;
  },
};
