import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBrands, getCategories } from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Nuevo producto" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    getBrands(),
    getCategories(),
  ]);

  return (
    <>
      <Link
        href="/admin/productos"
        className="mb-6 inline-flex items-center gap-2 text-[0.8125rem] text-ash transition-colors hover:text-chalk"
      >
        <ArrowLeft className="size-3.5" />
        Volver a productos
      </Link>

      <PageHeader
        eyebrow="Catálogo"
        title="Nuevo producto"
        description="El slug y la URL se generan solos a partir de la marca y el modelo."
      />

      <ProductForm brands={brands} categories={categories} />
    </>
  );
}
