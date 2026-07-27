import { getAllProducts, getCategories } from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import {
  CollectionManager,
  type Entry,
  type FieldSpec,
} from "@/components/admin/collection-manager";

export const metadata = { title: "Categorías" };
export const dynamic = "force-dynamic";

const FIELDS: FieldSpec[] = [
  { key: "name", type: "text", label: "Nombre", placeholder: "Running" },
  {
    key: "description",
    type: "textarea",
    label: "Descripción",
    hint: "Una línea que explique qué entra en esta colección.",
  },
  {
    key: "cover",
    type: "image",
    label: "Portada",
    hint: "Se usa como fondo cuando la categoría aparece destacada.",
  },
];

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  const countByCategory = new Map<string, number>();
  for (const product of products) {
    for (const id of product.categoryIds) {
      countByCategory.set(id, (countByCategory.get(id) ?? 0) + 1);
    }
  }

  const entries: Entry[] = categories.map((category) => {
    const count = countByCategory.get(category.id) ?? 0;
    return {
      record: { ...category },
      card: {
        cover: category.cover,
        title: category.name,
        meta: `${count} ${count === 1 ? "producto" : "productos"}`,
        body: category.description,
      },
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Categorías"
        description="Colecciones que cruzan marcas: running, skate, retro. Un producto puede estar en varias."
      />

      <CollectionManager
        collection="categories"
        entries={entries}
        fields={FIELDS}
        singular="Categoría"
        plural="Categorías"
        defaults={{ name: "", description: "", cover: null }}
      />
    </>
  );
}
