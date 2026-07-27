import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product, ProductView, Brand } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return priceFormatter.format(Math.round(value));
}

/** Igual que formatPrice pero sin el símbolo, para tablas del panel. */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function finalPrice(product: Pick<Product, "price" | "discount">) {
  if (!product.discount) return product.price;
  return Math.round(product.price * (1 - product.discount / 100));
}

/** Un talle sólo se muestra en el sitio si está habilitado y tiene stock. */
export function visibleSizes(product: Product) {
  return product.sizes.filter((s) => s.available && s.stock > 0);
}

/** Un producto recién creado puede no tener fotos todavía. */
export const PLACEHOLDER_IMAGE = "/products/placeholder.svg";

export function toProductView(product: Product, brands: Brand[]): ProductView {
  const brand =
    brands.find((b) => b.id === product.brandId) ??
    ({
      id: product.brandId,
      slug: "sin-marca",
      name: "Sin marca",
      wordmark: "—",
      logo: null,
      banner: null,
      description: "",
      order: 99,
    } satisfies Brand);

  const sizes = visibleSizes(product);
  const totalStock = sizes.reduce((acc, s) => acc + s.stock, 0);

  // Se garantiza al menos una imagen para que ninguna vista tenga que
  // preguntarse si el array está vacío.
  const images = product.images.length
    ? product.images
    : [
        {
          id: `${product.id}-placeholder`,
          url: PLACEHOLDER_IMAGE,
          alt: `${brand.name} ${product.name} — sin foto cargada`,
        },
      ];

  return {
    ...product,
    images,
    brand,
    finalPrice: finalPrice(product),
    visibleSizes: sizes,
    totalStock,
    inStock: totalStock > 0,
  };
}

export function fullName(product: { name: string }, brand: { name: string }) {
  return `${brand.name} ${product.name}`;
}

/** Título accesible y estable para las imágenes de producto. */
export function imageAlt(brandName: string, productName: string, i: number) {
  return `${brandName} ${productName} — vista ${i + 1}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
