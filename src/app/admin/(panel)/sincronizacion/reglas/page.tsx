import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readDb } from "@/lib/data/store";
import { PageHeader, Panel } from "@/components/admin/ui";
import {
  CollectionManager,
  type Entry,
  type FieldSpec,
} from "@/components/admin/collection-manager";
import { defaultRules } from "@/lib/sync/rules";
import { SeedRulesButton } from "@/components/admin/seed-rules-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reglas de clasificación" };

const OPERATORS: Record<string, string> = {
  es: "es exactamente",
  contiene: "contiene",
};

export default async function RulesPage() {
  const db = await readDb();

  const brandOptions = db.brands.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }));
  const categoryOptions = db.categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const fields: FieldSpec[] = [
    {
      key: "value",
      type: "text",
      label: "Texto a buscar",
      hint: 'Se busca dentro del modelo del PDF. Ej: "dunk", "air force", "samba".',
      placeholder: "dunk",
    },
    {
      key: "operator",
      type: "select",
      label: "Cómo comparar",
      options: [
        { value: "contiene", label: "Contiene el texto" },
        { value: "es", label: "Es exactamente el texto" },
      ],
    },
    {
      key: "brandId",
      type: "select",
      label: "Marca a asignar",
      hint: "Sin marca no se puede crear el producto. La primera regla que acierta es la que manda.",
      options: [{ value: "", label: "No asignar marca" }, ...brandOptions],
    },
    {
      key: "categoryIds",
      type: "products",
      label: "Categorías a asignar",
      hint: "Se acumulan: si el producto cae en varias reglas, se queda con las categorías de todas.",
      options: categoryOptions,
    },
    {
      key: "order",
      type: "number",
      label: "Orden",
      hint: "Se evalúan de menor a mayor. Poné primero las más específicas.",
    },
    { key: "active", type: "switch", label: "Activa" },
  ];

  const brandName = new Map(db.brands.map((b) => [b.id, b.name]));
  const categoryName = new Map(db.categories.map((c) => [c.id, c.name]));

  const entries: Entry[] = [...db.syncRules]
    .sort((a, b) => a.order - b.order)
    .map((rule) => ({
      record: { ...rule } as unknown as Entry["record"],
      card: {
        eyebrow: `Si el modelo ${OPERATORS[rule.operator] ?? rule.operator}`,
        title: rule.value,
        meta: rule.brandId
          ? `→ ${brandName.get(rule.brandId) ?? "marca borrada"}`
          : "→ sin marca",
        body: rule.categoryIds.length
          ? rule.categoryIds
              .map((id) => categoryName.get(id) ?? id)
              .join(" · ")
          : undefined,
        badges: rule.active
          ? []
          : [{ label: "Inactiva", variant: "neutral" as const }],
      },
    }));

  const suggested = defaultRules(db.brands);

  return (
    <>
      <PageHeader
        eyebrow="Sincronización"
        title="Reglas de clasificación"
        description="El PDF no trae columna de marca: viene metida en el modelo. Estas reglas son las que la deducen."
      >
        <Link
          href="/admin/sincronizacion"
          className="flex items-center gap-2 rounded-full border border-champagne/12 px-4 py-2 text-[0.8125rem] text-mist transition-colors hover:text-chalk"
        >
          <ArrowLeft className="size-3.5 stroke-[1.5]" />
          Volver
        </Link>
      </PageHeader>

      {db.syncRules.length === 0 && (
        <Panel
          title="Estás usando las reglas de fábrica"
          description={`Hay ${suggested.length} reglas incorporadas, deducidas de tus ${db.brands.length} marcas, y funcionan sin que configures nada. Si querés ajustarlas, guardalas primero como reglas propias y editalas desde acá.`}
          className="mb-4"
        >
          <SeedRulesButton rules={suggested} />
        </Panel>
      )}

      <CollectionManager
        collection="syncRules"
        entries={entries}
        fields={fields}
        singular="Regla"
        plural="Reglas"
        defaults={{
          field: "modelo",
          operator: "contiene",
          value: "",
          brandId: "",
          categoryIds: [],
          order: db.syncRules.length,
          active: true,
        }}
      />
    </>
  );
}
