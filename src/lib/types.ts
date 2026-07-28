export type ProductTag = "nuevo" | "mas-vendido" | "ultimos-pares" | "oferta";

/**
 * Estado de publicación.
 *
 * `borrador` es donde caen los productos que trae una importación nueva: no se
 * ven en la tienda hasta que alguien los revisa. `no-disponible` es donde caen
 * los que dejaron de aparecer en el catálogo del proveedor — no se borran
 * nunca, porque los pedidos viejos los siguen referenciando.
 */
export type ProductStatus = "publicado" | "borrador" | "no-disponible";

/**
 * Cómo se calcula el precio de venta.
 *
 * `manual` es el único modo en el que la sincronización no toca el precio.
 * Es el estado de los productos cargados a mano antes de que existiera el
 * módulo, para que ninguna importación les mueva el precio por sorpresa.
 */
export type PricingMode = "margen" | "fijo" | "manual";

export type OrderStatus =
  | "pendiente"
  | "contactado"
  | "finalizado"
  | "cancelado";

export interface SizeStock {
  size: string;
  stock: number;
  /** El admin puede ocultar un talle aunque tenga stock. */
  available: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  /** Modelo, sin la marca. Ej: "Air Max 95". */
  name: string;
  brandId: string;
  categoryIds: string[];
  price: number;
  /** Porcentaje 0–90. 0 = sin descuento. */
  discount: number;
  description: string;
  features: string[];
  color: string;
  colorHex: string;
  materials: string[];
  tags: ProductTag[];
  sku: string;
  images: ProductImage[];
  sizes: SizeStock[];
  featured: boolean;
  views: number;
  sold: number;
  createdAt: string;
  updatedAt: string;

  /* --- Sincronización con el proveedor -----------------------------------
     `price` sigue siendo el precio publicado y la única fuente para el
     carrito y los pedidos: lo de abajo es cómo se llegó a ese número, no un
     segundo precio en competencia. */

  status: ProductStatus;
  pricingMode: PricingMode;
  /** Lo que cuesta en el PDF del proveedor. 0 = todavía no vino de ningún PDF. */
  supplierPrice: number;
  /** Clave con la que se lo vuelve a encontrar en el próximo PDF. */
  supplierRef: string;
  /** Porcentaje sobre el costo. Se usa cuando pricingMode es "margen". */
  marginPercent: number;
  /** Monto fijo sobre el costo. Se usa cuando pricingMode es "fijo". */
  marginFixed: number;
  lastSyncAt: string | null;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  /** Texto corto que se dibuja como marca denominativa en el carrusel. */
  wordmark: string;
  logo: string | null;
  banner: string | null;
  description: string;
  order: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  cover: string | null;
  description: string;
}

export type BannerPlacement = "hero" | "promo" | "secondary";

export interface Banner {
  id: string;
  placement: BannerPlacement;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string | null;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
  order: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  productIds: string[];
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  qty: number;
  unitPrice: number;
  image: string;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  customer: { name: string; phone: string; note: string };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}

/** Cómo se calculan por defecto los precios que trae una importación. */
export interface SyncSettings {
  pricingMode: PricingMode;
  marginPercent: number;
  marginFixed: number;
  /** Redondea el precio publicado al múltiplo más cercano. 0 = sin redondeo. */
  roundTo: number;
}

export interface Settings {
  storeName: string;
  whatsappNumber: string;
  email: string;
  instagram: string;
  tiktok: string;
  address: string;
  freeShippingFrom: number;
  sync: SyncSettings;
}

export interface Database {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  banners: Banner[];
  offers: Offer[];
  orders: Order[];
  settings: Settings;
  /** Reglas de clasificación de la sincronización. */
  syncRules: SyncRule[];
}

/** Regla de clasificación automática de la importación. */
export interface SyncRule {
  id: string;
  field: "marca" | "modelo";
  operator: "es" | "contiene";
  value: string;
  /** Marca a asignar cuando acierta. null = no la toca. */
  brandId: string | null;
  categoryIds: string[];
  tags: ProductTag[];
  active: boolean;
  order: number;
}

/** Producto con marca resuelta y precio final calculado. */
export interface ProductView extends Product {
  brand: Brand;
  finalPrice: number;
  inStock: boolean;
  totalStock: number;
  visibleSizes: SizeStock[];
}
