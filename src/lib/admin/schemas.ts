import { z } from "zod";

export const sizeStockSchema = z.object({
  size: z.string().min(1).max(6),
  stock: z.number().int().min(0).max(9999),
  available: z.boolean(),
});

export const productImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().max(200).default(""),
});

export const productTagSchema = z.enum([
  "nuevo",
  "mas-vendido",
  "ultimos-pares",
  "oferta",
]);

export const productSchema = z.object({
  name: z.string().min(1, "El modelo no puede quedar vacío").max(120),
  brandId: z.string().min(1, "Elegí una marca"),
  categoryIds: z.array(z.string()).default([]),
  price: z.number().int().min(0).max(99_999_999),
  discount: z.number().int().min(0).max(90).default(0),
  description: z.string().max(4000).default(""),
  features: z.array(z.string().max(200)).default([]),
  color: z.string().max(60).default(""),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Usá un color en formato #rrggbb")
    .default("#b4b0a0"),
  materials: z.array(z.string().max(60)).default([]),
  tags: z.array(productTagSchema).default([]),
  sku: z.string().max(40).default(""),
  images: z.array(productImageSchema).default([]),
  sizes: z.array(sizeStockSchema).default([]),
  featured: z.boolean().default(false),
  /** Sólo se toca desde el panel para corregir datos históricos. */
  sold: z.number().int().min(0).optional(),
  views: z.number().int().min(0).optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1, "La marca necesita un nombre").max(60),
  description: z.string().max(600).default(""),
  logo: z.string().nullable().default(null),
  banner: z.string().nullable().default(null),
  order: z.number().int().min(0).max(999).default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1, "La categoría necesita un nombre").max(60),
  description: z.string().max(600).default(""),
  cover: z.string().nullable().default(null),
});

export const bannerSchema = z.object({
  placement: z.enum(["hero", "promo", "secondary"]),
  eyebrow: z.string().max(60).default(""),
  title: z.string().min(1, "El banner necesita un título").max(160),
  subtitle: z.string().max(400).default(""),
  image: z.string().nullable().default(null),
  ctaLabel: z.string().max(40).default("Ver más"),
  ctaHref: z.string().max(200).default("/productos"),
  active: z.boolean().default(true),
  order: z.number().int().min(0).max(999).default(0),
});

export const offerSchema = z.object({
  title: z.string().min(1, "La oferta necesita un título").max(120),
  description: z.string().max(600).default(""),
  discount: z.number().int().min(0).max(90).default(0),
  productIds: z.array(z.string()).default([]),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  active: z.boolean().default(true),
});

/**
 * Regla de clasificación de la sincronización.
 *
 * `value` es lo que se busca dentro del modelo del PDF; el resto es lo que se
 * asigna cuando acierta. Sin marca no alcanza para crear un producto, así que
 * una regla sin `brandId` sólo sirve para sumar categorías o etiquetas.
 */
export const syncRuleSchema = z.object({
  field: z.enum(["marca", "modelo"]).default("modelo"),
  operator: z.enum(["es", "contiene"]).default("contiene"),
  value: z.string().min(1, "Escribí qué texto tiene que aparecer").max(80),
  brandId: z.string().nullable().default(null),
  categoryIds: z.array(z.string()).default([]),
  tags: z.array(productTagSchema).default([]),
  active: z.boolean().default(true),
  order: z.number().int().min(0).max(999).default(0),
});

export const syncSettingsSchema = z.object({
  pricingMode: z.enum(["margen", "fijo", "manual"]).default("margen"),
  marginPercent: z.number().min(0).max(500).default(35),
  marginFixed: z.number().int().min(0).max(9_999_999).default(15000),
  roundTo: z.number().int().min(0).max(100_000).default(100),
});

export const orderPatchSchema = z.object({
  status: z.enum(["pendiente", "contactado", "finalizado", "cancelado"]).optional(),
  customer: z
    .object({
      name: z.string().max(80).optional(),
      phone: z.string().max(40).optional(),
      note: z.string().max(500).optional(),
    })
    .optional(),
});

export const settingsSchema = z.object({
  storeName: z.string().min(1).max(60),
  whatsappNumber: z
    .string()
    .min(8, "Poné el número con código de país")
    .max(20),
  email: z.string().email("Revisá el email"),
  instagram: z.string().max(40).default(""),
  tiktok: z.string().max(40).default(""),
  address: z.string().max(120).default(""),
  freeShippingFrom: z.number().int().min(0).max(99_999_999),
  sync: syncSettingsSchema.optional(),
});

export const COLLECTION_SCHEMAS = {
  brands: brandSchema,
  categories: categorySchema,
  banners: bannerSchema,
  offers: offerSchema,
  syncRules: syncRuleSchema,
} as const;

export type CollectionName = keyof typeof COLLECTION_SCHEMAS;

export const COLLECTION_NAMES = Object.keys(
  COLLECTION_SCHEMAS,
) as CollectionName[];
