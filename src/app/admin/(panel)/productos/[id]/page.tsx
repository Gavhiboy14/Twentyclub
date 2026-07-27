import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  getAdminProduct,
  getBrands,
  getCategories,
} from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  return { title: product ? `Editar ${product.name}` : "Producto" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    getAdminProduct(id),
    getBrands(),
    getCategories(),
  ]);

  if (!product) notFound();

  const brandName = brands.find((b) => b.id === product.brandId)?.name ?? "";

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
        eyebrow={brandName}
        title={product.name}
        description={`SKU ${product.sku} · /producto/${product.slug}`}
      >
        <Button asChild variant="glass">
          <Link href={`/producto/${product.slug}`} target="_blank">
            <ExternalLink />
            Ver en la tienda
          </Link>
        </Button>
      </PageHeader>

      <ProductForm
        product={product}
        brands={brands}
        categories={categories}
      />
    </>
  );
}
