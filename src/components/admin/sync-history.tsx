"use client";

import { Loader2, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction, EmptyRow, ErrorNote, useMutate } from "./ui";
import type { ImportRun } from "@/lib/sync/types";
import { cn, formatDateTime } from "@/lib/utils";

const STATUS: Record<ImportRun["status"], { label: string; className: string }> = {
  analizado: { label: "Sin aplicar", className: "border-warn/30 bg-warn/10 text-warn" },
  aplicado: { label: "Aplicada", className: "border-ok/30 bg-ok/10 text-ok" },
  revertido: { label: "Revertida", className: "border-champagne/12 text-ash" },
};

/**
 * Historial de importaciones.
 *
 * Deshacer sólo aparece en las aplicadas. Es una operación real —reescribe el
 * catálogo con los valores anteriores— así que pasa por confirmación y avisa
 * lo que no puede saber: si alguien editó un precio a mano después de
 * importar, revertir se lo lleva puesto.
 */
export function SyncHistory({ runs }: { runs: ImportRun[] }) {
  const { mutate, pending, error } = useMutate();

  if (!runs.length) {
    return (
      <EmptyRow>
        Todavía no hiciste ninguna importación. Cuando subas el primer PDF, cada
        corrida queda registrada acá.
      </EmptyRow>
    );
  }

  return (
    <div className="space-y-3">
      <ErrorNote>{error}</ErrorNote>

      <ul className="divide-y divide-champagne/[0.05]">
        {runs.map((run) => {
          const status = STATUS[run.status];
          return (
            <li
              key={run.id}
              className="flex flex-wrap items-center gap-4 py-4 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="numeric text-[0.8125rem] text-chalk">
                    {formatDateTime(run.createdAt)}
                  </p>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[0.625rem] uppercase tracking-[0.14em]",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="mt-1 truncate text-[0.8125rem] text-mist">
                  {run.fileName || "Sin nombre"}
                </p>

                <p className="mt-1.5 text-[0.75rem] text-ash">
                  <span className="numeric text-mist">{run.summary.found}</span>{" "}
                  productos ·{" "}
                  <span className="numeric text-mist">{run.summary.created}</span>{" "}
                  nuevos ·{" "}
                  <span className="numeric text-mist">{run.summary.updated}</span>{" "}
                  modificados
                  {run.summary.removed > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="numeric text-mist">
                        {run.summary.removed}
                      </span>{" "}
                      dados de baja
                    </>
                  )}
                  {" · importado por "}
                  {run.user}
                </p>
              </div>

              {run.status === "aplicado" && (
                <ConfirmAction
                  title="¿Deshacer esta importación?"
                  description="Se borran los productos que creó y se les devuelve el precio y los talles anteriores a los que modificó. Si después de importar editaste algo a mano, ese cambio se pierde."
                  confirmLabel="Deshacer"
                  pending={pending}
                  className="shrink-0"
                  onConfirm={() =>
                    mutate(`/api/admin/sync/${run.id}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "revertir" }),
                    })
                  }
                  trigger={
                    <Button variant="outline" size="sm" disabled={pending}>
                      {pending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Undo2 />
                      )}
                      Deshacer
                    </Button>
                  }
                />
              )}

              {run.status === "revertido" && (
                <span className="flex shrink-0 items-center gap-2 text-[0.75rem] text-ash">
                  <RotateCcw className="size-3 stroke-[1.5]" />
                  Sin efecto
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
