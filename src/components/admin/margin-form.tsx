"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Save, SlidersHorizontal } from "lucide-react";
import type { SyncSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/field";
import { ErrorNote, Panel, useMutate } from "./ui";
import { publishedPrice } from "@/lib/sync/pricing";
import { formatPrice } from "@/lib/utils";

/**
 * Configuración del margen.
 *
 * El precio de venta no se escribe nunca a mano: sale de esto. Por eso el
 * formulario muestra un ejemplo en vivo con un costo real del catálogo — sin
 * verlo aplicado, un 35% y un redondeo al múltiplo de 100 son dos números
 * abstractos y es fácil equivocarse en un cero.
 */
export function MarginForm({
  settings,
  sampleCost,
}: {
  settings: SyncSettings;
  /** Un costo del catálogo, para la vista previa. 0 si todavía no hay. */
  sampleCost: number;
}) {
  const { mutate, pending, error } = useMutate();
  const [draft, setDraft] = useState<SyncSettings>(settings);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    const result = await mutate("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sync: draft }),
    });
    if (result) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
  }

  const cost = sampleCost || 30000;
  /* El modo manual no calcula nada: es la forma de decir "no me toques el
     precio". La vista previa lo dice con palabras en vez de un número. */
  const preview =
    draft.pricingMode === "manual"
      ? null
      : publishedPrice(cost, draft, draft);

  return (
    <Panel
      title="Margen"
      description="Los precios publicados se calculan con esto. Nunca se escriben a mano."
      action={
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : saved ? <Check /> : <Save />}
          {saved ? "Guardado" : "Guardar"}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field
          label="Cómo se calcula"
          hint="Se aplica a los productos que entran por el PDF. Los cargados a mano quedan en precio personalizado."
        >
          <NativeSelect
            value={draft.pricingMode}
            onChange={(e) =>
              set("pricingMode", e.target.value as SyncSettings["pricingMode"])
            }
          >
            <option value="margen">Margen porcentual sobre el costo</option>
            <option value="fijo">Monto fijo sobre el costo</option>
            <option value="manual">Precio personalizado (no calcular)</option>
          </NativeSelect>
        </Field>

        {draft.pricingMode !== "manual" && (
          <div className="grid gap-5 sm:grid-cols-2">
            {draft.pricingMode === "margen" ? (
              <Field label="Porcentaje" hint="Sobre el costo del proveedor.">
                <Input
                  type="number"
                  min={0}
                  max={500}
                  value={draft.marginPercent}
                  onChange={(e) =>
                    set("marginPercent", Number(e.target.value) || 0)
                  }
                />
              </Field>
            ) : (
              <Field label="Monto" hint="Se suma al costo del proveedor.">
                <Input
                  type="number"
                  min={0}
                  value={draft.marginFixed}
                  onChange={(e) => set("marginFixed", Number(e.target.value) || 0)}
                />
              </Field>
            )}

            <Field
              label="Redondeo"
              hint="Al múltiplo más cercano hacia arriba. 0 = sin redondear."
            >
              <Input
                type="number"
                min={0}
                step={50}
                value={draft.roundTo}
                onChange={(e) => set("roundTo", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
        )}

        <div className="rounded-xl border border-champagne/[0.07] bg-ink/40 p-4">
          <p className="eyebrow mb-2.5">Ejemplo</p>
          {preview === null ? (
            <p className="text-[0.8125rem] leading-relaxed text-ash">
              Con precio personalizado, la importación registra el costo del
              proveedor pero no toca el precio de venta.
            </p>
          ) : (
            <p className="flex flex-wrap items-baseline gap-2 text-[0.8125rem] text-ash">
              Un par que te cuesta{" "}
              <span className="numeric text-mist">{formatPrice(cost)}</span> se
              publica a{" "}
              <span className="numeric font-display text-base font-bold text-chalk">
                {formatPrice(preview)}
              </span>
              <span className="text-ash">
                ({formatPrice(preview - cost)} de ganancia)
              </span>
            </p>
          )}
          {preview !== null && draft.roundTo > 1 && (
            <p className="mt-2 text-[0.75rem] text-ash">
              Sin redondeo daría{" "}
              <span className="numeric">
                {formatPrice(
                  draft.pricingMode === "fijo"
                    ? cost + draft.marginFixed
                    : Math.round(cost * (1 + draft.marginPercent / 100)),
                )}
              </span>
              .
            </p>
          )}
        </div>

        <ErrorNote>{error}</ErrorNote>

        <Link
          href="/admin/sincronizacion/reglas"
          className="flex items-center gap-2.5 text-[0.8125rem] text-mist transition-colors hover:text-chalk"
        >
          <SlidersHorizontal className="size-3.5 stroke-[1.5]" />
          Reglas de clasificación
        </Link>
      </div>
    </Panel>
  );
}
