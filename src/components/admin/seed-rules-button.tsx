"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "./ui";
import type { SyncRule } from "@/lib/types";

/**
 * Copia las reglas de fábrica a la base para poder editarlas.
 *
 * Mientras la tabla está vacía, la importación usa las reglas incorporadas.
 * En cuanto se guarda la primera, la base manda: por eso esto se guarda de una
 * sola vez y no de a una regla, para que no quede un estado intermedio en el
 * que el catálogo se clasifica con la mitad de las reglas.
 */
export function SeedRulesButton({ rules }: { rules: SyncRule[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setPending(true);
    setError(null);

    for (const rule of rules) {
      const res = await fetch("/api/admin/collections/syncRules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: rule.field,
          operator: rule.operator,
          value: rule.value,
          brandId: rule.brandId,
          categoryIds: rule.categoryIds,
          tags: rule.tags,
          active: rule.active,
          order: rule.order,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          `Se cortó en "${rule.value}": ${data.error ?? "error del servidor"}. Las que ya se guardaron quedaron.`,
        );
        setPending(false);
        router.refresh();
        return;
      }
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button onClick={seed} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Download />}
        {pending ? "Guardando…" : `Guardar las ${rules.length} reglas`}
      </Button>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
