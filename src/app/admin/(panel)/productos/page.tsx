import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProducts } from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Productos" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [products, { q }] = await Promise.all([
    getAdminProducts(),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        description="Cargá, editá y duplicá modelos. El stock por talle se maneja adentro de cada producto."
      >
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus />
            Nuevo producto
          </Link>
        </Button>
      </PageHeader>

      <ProductsTable products={products} initialQuery={q ?? ""} />
    </>
  );
}
