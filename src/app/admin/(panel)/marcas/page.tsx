import { getAllProducts, getBrands } from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import {
  CollectionManager,
  type Entry,
  type FieldSpec,
} from "@/components/admin/collection-manager";

export const metadata = { title: "Marcas" };
export const dynamic = "force-dynamic";

const FIELDS: FieldSpec[] = [
  { key: "name", type: "text", label: "Nombre", placeholder: "New Balance" },
  {
    key: "description",
    type: "textarea",
    label: "Descripción",
    hint: "Se muestra en la portada de la marca y en la home.",
  },
  {
    key: "banner",
    type: "image",
    label: "Banner",
    hint: "Fondo de la página de la marca. Ideal 1600×700.",
  },
  { key: "logo", type: "image", label: "Logo", aspect: "aspect-square" },
  {
    key: "order",
    type: "number",
    label: "Orden",
    hint: "Menor número, más arriba en los listados.",
  },
];

export default async function AdminBrandsPage() {
  const [brands, products] = await Promise.all([getBrands(), getAllProducts()]);

  const countByBrand = new Map<string, number>();
  for (const product of products) {
    countByBrand.set(
      product.brandId,
      (countByBrand.get(product.brandId) ?? 0) + 1,
    );
  }

  const entries: Entry[] = brands.map((brand) => {
    const count = countByBrand.get(brand.id) ?? 0;
    return {
      record: { ...brand },
      card: {
        cover: brand.banner,
        title: brand.name,
        meta: `/marca/${brand.slug} · ${count} ${count === 1 ? "modelo" : "modelos"}`,
        body: brand.description,
        blockedReason:
          count > 0 ? `${count} productos usan esta marca` : null,
      },
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Marcas"
        description="Cada marca tiene su propia página pública en /marca/su-nombre. El slug se genera solo."
      />

      <CollectionManager
        collection="brands"
        entries={entries}
        fields={FIELDS}
        singular="Marca"
        plural="Marcas"
        defaults={{
          name: "",
          description: "",
          banner: null,
          logo: null,
          order: brands.length,
        }}
      />
    </>
  );
}
