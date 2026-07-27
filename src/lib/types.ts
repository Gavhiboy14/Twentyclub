export type ProductTag = "nuevo" | "mas-vendido" | "ultimos-pares" | "oferta";

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

export interface Settings {
  storeName: string;
  whatsappNumber: string;
  email: string;
  instagram: string;
  tiktok: string;
  address: string;
  freeShippingFrom: number;
}

export interface Database {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  banners: Banner[];
  offers: Offer[];
  orders: Order[];
  settings: Settings;
}

/** Producto con marca resuelta y precio final calculado. */
export interface ProductView extends Product {
  brand: Brand;
  finalPrice: number;
  inStock: boolean;
  totalStock: number;
  visibleSizes: SizeStock[];
}
