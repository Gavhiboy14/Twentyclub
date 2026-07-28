import { readDb } from "@/lib/data/store";
import { repo } from "@/lib/data/store";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SyncCenter } from "@/components/admin/sync-center";
import { SyncHistory } from "@/components/admin/sync-history";
import { MarginForm } from "@/components/admin/margin-form";
import { defaultRules } from "@/lib/sync/rules";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sincronización de catálogo" };

export default async function SyncPage() {
  const [db, runs] = await Promise.all([readDb(), repo().listImports()]);

  const sync = db.settings.sync;
  const ruleCount = db.syncRules.length || defaultRules(db.brands).length;
  const lastApplied = runs.find((run) => run.status === "aplicado");
  const fromSupplier = db.products.filter((p) => p.supplierRef).length;
  /* Un costo real del catálogo para la vista previa del margen: con un número
     inventado no se ve si el redondeo hace lo que uno espera. */
  const sampleCost =
    db.products.find((p) => p.supplierPrice > 0)?.supplierPrice ?? 0;

  /* Sólo los que todavía no están atados a una fila del PDF: los que ya
     tienen referencia se cruzan solos y ofrecerlos sería invitar a un choque. */
  const brandName = new Map(db.brands.map((brand) => [brand.id, brand.name]));
  const catalog = db.products
    .filter((product) => !product.supplierRef)
    .map((product) => ({
      id: product.id,
      label: `${brandName.get(product.brandId) ?? ""} ${product.name}`.trim(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

  return (
    <>
      <PageHeader
        eyebrow="Proveedor"
        title="Sincronización de catálogo"
        description="Subí el PDF del proveedor y revisá los cambios antes de que toquen la tienda. Nada se publica solo."
      />

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <SyncCenter catalog={catalog} />

          <Panel
            title="Historial"
            description="Cada corrida guarda qué cambió y qué había antes, así se puede deshacer."
          >
            <SyncHistory runs={runs} />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Estado">
            <dl className="space-y-3.5 text-[0.8125rem]">
              <Row
                label="Última sincronización"
                value={
                  lastApplied ? formatDateTime(lastApplied.appliedAt ?? lastApplied.createdAt) : "Nunca"
                }
              />
              <Row
                label="Importado por"
                value={lastApplied?.user ?? "—"}
              />
              <Row
                label="Productos del proveedor"
                value={`${fromSupplier} de ${db.products.length}`}
              />
              <Row label="Reglas activas" value={String(ruleCount)} />
            </dl>
          </Panel>

          <MarginForm settings={sync} sampleCost={sampleCost} />

          <p className="rounded-xl border border-champagne/[0.07] bg-ink/40 p-3.5 text-[0.75rem] leading-relaxed text-ash">
            Los productos cargados a mano quedan en{" "}
            <span className="text-mist">precio personalizado</span> y ninguna
            importación se los mueve. Para pasarlos al margen automático hay que
            hacerlo desde la ficha del producto.
          </p>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ash">{label}</dt>
      <dd className="numeric text-right text-chalk">{value}</dd>
    </div>
  );
}
