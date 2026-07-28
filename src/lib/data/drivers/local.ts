import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import type { Database, Order, Product, Settings } from "@/lib/types";
import type { CollectionName } from "@/lib/admin/schemas";
import type { ImportRun, ImportRunDetail } from "@/lib/sync/types";
import {
  DEFAULT_SYNC_SETTINGS,
  PRODUCT_SYNC_DEFAULTS,
} from "@/lib/sync/defaults";
import { createSeedDatabase } from "../seed";
import type { DataRepo, DeleteResult, Row } from "../repo";

/**
 * Driver de archivo. Guarda la base entera en `.data/db.json`.
 *
 * Es el default (DATA_DRIVER=local) para que el proyecto arranque sin
 * credenciales de nada. Funciona en desarrollo y en un VPS con disco propio;
 * NO funciona en Netlify ni en ningún serverless, donde el filesystem es de
 * sólo lectura. Para eso está el driver de Supabase.
 */

const DB_PATH = resolve(process.cwd(), ".data/db.json");
/** El historial va en su propio archivo: no tiene por qué crecerle al catálogo. */
const IMPORTS_PATH = resolve(process.cwd(), ".data/imports.json");

let cache: Database | null = null;
let loading: Promise<Database> | null = null;
/** Serializa las escrituras: dos requests simultáneos no se pisan. */
let queue: Promise<unknown> = Promise.resolve();

async function persist(db: Database) {
  await mkdir(dirname(DB_PATH), { recursive: true });
  // Escritura atómica con nombre único: si dos writers coinciden, ninguno pisa
  // el temporal del otro y el .json nunca queda a medio escribir.
  const tmp = `${DB_PATH}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, DB_PATH);
  cache = db;
}

/**
 * Completa una base guardada antes de que existieran los campos nuevos.
 *
 * Es el equivalente local de la migración de Supabase: el archivo en disco
 * puede tener meses y no hay nadie que le corra un ALTER TABLE. Sin esto, un
 * `.data/db.json` viejo rompe el panel apenas se lee `settings.sync`, y la
 * única salida sería borrar el catálogo de desarrollo.
 */
function migrate(db: Database): Database {
  return {
    ...db,
    products: (db.products ?? []).map((product) => ({
      ...PRODUCT_SYNC_DEFAULTS,
      ...product,
    })),
    settings: {
      ...db.settings,
      sync: { ...DEFAULT_SYNC_SETTINGS, ...(db.settings?.sync ?? {}) },
    },
    syncRules: db.syncRules ?? [],
  };
}

async function loadFromDisk(): Promise<Database> {
  try {
    const raw = JSON.parse(await readFile(DB_PATH, "utf8")) as Database;
    return migrate(raw);
  } catch {
    const seed = createSeedDatabase();
    await persist(seed);
    return seed;
  }
}

async function read(): Promise<Database> {
  if (cache) return cache;
  loading ??= loadFromDisk().finally(() => {
    loading = null;
  });
  cache = await loading;
  return cache;
}

/** Aplica una mutación sobre una copia y la guarda. Todas van en fila. */
function write<T>(mutator: (db: Database) => T): Promise<T> {
  const run = queue.then(async () => {
    const draft = structuredClone(await read());
    const result = mutator(draft);
    await persist(draft);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function listOf(db: Database, collection: CollectionName) {
  return db[collection] as unknown as Row[];
}

/* ------------------------- Historial de importaciones ---------------------- */

let importsQueue: Promise<unknown> = Promise.resolve();

async function readImports(): Promise<ImportRunDetail[]> {
  try {
    return JSON.parse(await readFile(IMPORTS_PATH, "utf8")) as ImportRunDetail[];
  } catch {
    return [];
  }
}

/** Misma escritura atómica y en fila que la base, sobre el otro archivo. */
function writeImports<T>(
  mutator: (runs: ImportRunDetail[]) => T,
): Promise<T> {
  const run = importsQueue.then(async () => {
    const runs = await readImports();
    const result = mutator(runs);
    await mkdir(dirname(IMPORTS_PATH), { recursive: true });
    const tmp = `${IMPORTS_PATH}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(runs, null, 2), "utf8");
    await rename(tmp, IMPORTS_PATH);
    return result;
  });
  importsQueue = run.catch(() => undefined);
  return run;
}

/** Cabecera sin las líneas del plan. */
function headerOf({ items: _items, ...header }: ImportRunDetail): ImportRun {
  return header;
}

export const localRepo: DataRepo = {
  snapshot: read,

  createProduct(product) {
    return write((db) => {
      db.products.push(product);
      return product;
    });
  },

  updateProduct(id, patch) {
    return write((db) => {
      const index = db.products.findIndex((p) => p.id === id);
      if (index === -1) return null;
      const updated: Product = { ...db.products[index], ...patch };
      db.products[index] = updated;
      return updated;
    });
  },

  deleteProduct(id) {
    return write((db) => {
      const index = db.products.findIndex((p) => p.id === id);
      if (index === -1) return false;
      db.products.splice(index, 1);
      // Las ofertas que lo incluían quedarían con un id fantasma.
      for (const offer of db.offers) {
        offer.productIds = offer.productIds.filter((pid) => pid !== id);
      }
      return true;
    });
  },

  createRecord(collection, row) {
    return write((db) => {
      listOf(db, collection).push(row);
      return row;
    });
  },

  updateRecord(collection, id, patch) {
    return write((db) => {
      const list = listOf(db, collection);
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const merged = { ...list[index], ...patch };
      list[index] = merged;
      return merged;
    });
  },

  deleteRecord(collection, id): Promise<DeleteResult> {
    return write((db) => {
      // Una marca con productos no se puede borrar: dejaría el catálogo huérfano.
      if (collection === "brands" && db.products.some((p) => p.brandId === id)) {
        return "in-use";
      }

      const list = listOf(db, collection);
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return "missing";
      list.splice(index, 1);

      if (collection === "categories") {
        for (const product of db.products) {
          product.categoryIds = product.categoryIds.filter((c) => c !== id);
        }
      }

      return "ok";
    });
  },

  createOrder(order) {
    return write((db) => {
      db.orders.push(order);
      return order;
    });
  },

  updateOrder(id, patch) {
    return write((db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) return null;
      if (patch.status) order.status = patch.status;
      if (patch.customer) order.customer = { ...order.customer, ...patch.customer };
      return order;
    });
  },

  deleteOrder(id) {
    return write((db) => {
      const index = db.orders.findIndex((o) => o.id === id);
      if (index === -1) return false;
      db.orders.splice(index, 1);
      return true;
    });
  },

  commitOrderStock(order: Order) {
    return write((db) => {
      const now = new Date().toISOString();
      for (const line of order.items) {
        const product = db.products.find((p) => p.id === line.productId);
        if (!product) continue;
        const size = product.sizes.find((s) => s.size === line.size);
        if (size) size.stock = Math.max(0, size.stock - line.qty);
        product.sold += line.qty;
        product.updatedAt = now;
      }
    });
  },

  updateSettings(patch: Partial<Settings>) {
    return write((db) => {
      db.settings = { ...db.settings, ...patch };
      return db.settings;
    });
  },

  async listImports() {
    const runs = await readImports();
    return runs
      .map(headerOf)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getImport(id) {
    const runs = await readImports();
    return runs.find((run) => run.id === id) ?? null;
  },

  createImport(run) {
    return writeImports((runs) => {
      runs.push(run);
      return headerOf(run);
    });
  },

  updateImport(id, patch) {
    return writeImports((runs) => {
      const index = runs.findIndex((run) => run.id === id);
      if (index === -1) return null;
      runs[index] = { ...runs[index], ...patch };
      return headerOf(runs[index]);
    });
  },

  async reset() {
    await persist(createSeedDatabase());
    await writeImports((runs) => runs.splice(0, runs.length));
  },
};
