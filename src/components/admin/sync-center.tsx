"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleAlert,
  FileText,
  Link2,
  Loader2,
  Minus,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "./ui";
import { readCatalogPdf } from "@/lib/sync/read-pdf";
import type { ChangeKind, ImportRunDetail, ImportItem } from "@/lib/sync/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Phase = "listo" | "leyendo" | "analizando" | "revisando" | "aplicando";

/**
 * Centro de sincronización.
 *
 * El PDF se lee en el navegador y al servidor le llega la tabla ya
 * interpretada; después nada se escribe hasta que alguien aprieta confirmar.
 * Esas dos cosas son la razón de que el componente tenga estados: leyendo,
 * analizando y revisando son momentos distintos y el usuario tiene que ver en
 * cuál está.
 */
/** Lo mínimo del catálogo para poder elegir un producto al vincular. */
export interface CatalogOption {
  id: string;
  label: string;
}

export function SyncCenter({ catalog }: { catalog: CatalogOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("listo");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<ImportRunDetail | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<ChangeKind>("nuevo");

  const busy = phase !== "listo" && phase !== "revisando";

  /* ------------------------------ análisis ------------------------------- */

  const analyze = useCallback(async (file: File) => {
    setError(null);
    setRun(null);
    setSkipped(new Set());

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("El archivo tiene que ser un PDF.");
      return;
    }

    try {
      setPhase("leyendo");
      setProgress({ done: 0, total: 0 });
      const extraction = await readCatalogPdf(file, (done, total) =>
        setProgress({ done, total }),
      );

      if (!extraction.products.length) {
        setPhase("listo");
        setError(
          "No se reconoció ningún producto. ¿Es el catálogo del proveedor?",
        );
        return;
      }

      setPhase("analizando");
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, ...extraction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase("listo");
        setError((data as { error?: string }).error ?? "No se pudo analizar.");
        return;
      }

      const detail = data as ImportRunDetail;
      setRun(detail);
      setSkipped(
        new Set(detail.items.filter((i) => !i.approved).map((i) => i.id)),
      );
      setTab(firstTabWithItems(detail.items));
      setPhase("revisando");
    } catch (cause) {
      setPhase("listo");
      setError(
        cause instanceof Error
          ? `No se pudo leer el PDF: ${cause.message}`
          : "No se pudo leer el PDF.",
      );
    }
  }, []);

  /* ------------------------------- vincular ------------------------------ */

  /**
   * Ata una línea "nuevo" a un producto que ya existe. El servidor recalcula
   * la línea como modificación y devuelve el plan entero, así que el resumen
   * de arriba se actualiza solo.
   */
  async function link(itemId: string, productId: string) {
    if (!run) return;
    setError(null);

    const res = await fetch(`/api/admin/sync/${run.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vincular", itemId, productId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError((data as { error?: string }).error ?? "No se pudo vincular.");
      return;
    }

    const { item } = data as { item: ImportItem };
    setRun((current) =>
      current
        ? {
            ...current,
            items: current.items.map((i) => (i.id === item.id ? item : i)),
          }
        : current,
    );
  }

  /* ------------------------------ confirmar ------------------------------ */

  async function confirm() {
    if (!run) return;
    setPhase("aplicando");
    setError(null);

    const itemIds = run.items
      .filter((item) => item.patch && !skipped.has(item.id))
      .map((item) => item.id);

    const res = await fetch(`/api/admin/sync/${run.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "aplicar", itemIds }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setPhase("revisando");
      setError((data as { error?: string }).error ?? "No se pudo aplicar.");
      return;
    }

    setRun(null);
    setPhase("listo");
    router.refresh();
  }

  /* -------------------------------- vista -------------------------------- */

  const groups = useMemo(() => groupItems(run?.items ?? []), [run]);
  const pendingCount = run
    ? run.items.filter((i) => i.patch && !skipped.has(i.id)).length
    : 0;

  return (
    <div className="space-y-5">
      {!run && (
        <Dropzone
          dragging={dragging}
          busy={busy}
          phase={phase}
          progress={progress}
          onPick={() => inputRef.current?.click()}
          onDrop={(file) => {
            setDragging(false);
            void analyze(file);
          }}
          onDragState={setDragging}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void analyze(file);
        }}
      />

      <ErrorNote>{error}</ErrorNote>

      <AnimatePresence>
        {run && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="space-y-5"
          >
            <Summary run={run} />

            <div className="rounded-2xl border border-champagne/[0.07] bg-champagne/[0.022]">
              <div className="flex flex-wrap gap-1 border-b border-champagne/[0.07] p-2">
                {TABS.map((entry) => (
                  <button
                    key={entry.kind}
                    type="button"
                    onClick={() => setTab(entry.kind)}
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-[0.8125rem] transition-colors duration-300",
                      tab === entry.kind
                        ? "bg-champagne/12 text-chalk"
                        : "text-ash hover:text-chalk",
                    )}
                  >
                    {entry.label}
                    <span className="numeric ml-2 text-[0.6875rem] text-ash">
                      {groups[entry.kind].length}
                    </span>
                  </button>
                ))}
              </div>

              <ItemList
                items={groups[tab]}
                skipped={skipped}
                catalog={catalog}
                onToggle={(id) =>
                  setSkipped((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onLink={link}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-champagne/[0.07] bg-champagne/[0.022] p-5">
              <p className="text-[0.8125rem] text-mist">
                Se van a aplicar{" "}
                <span className="numeric font-semibold text-chalk">
                  {pendingCount}
                </span>{" "}
                {pendingCount === 1 ? "cambio" : "cambios"}. El resto queda como
                está.
              </p>
              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRun(null);
                    setPhase("listo");
                  }}
                  disabled={phase === "aplicando"}
                >
                  Descartar
                </Button>
                <Button
                  onClick={confirm}
                  disabled={phase === "aplicando" || pendingCount === 0}
                >
                  {phase === "aplicando" ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Aplicando…
                    </>
                  ) : (
                    <>
                      Confirmar importación
                      <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- Dropzone --------------------------------- */

function Dropzone({
  dragging,
  busy,
  phase,
  progress,
  onPick,
  onDrop,
  onDragState,
}: {
  dragging: boolean;
  busy: boolean;
  phase: Phase;
  progress: { done: number; total: number };
  onPick: () => void;
  onDrop: (file: File) => void;
  onDragState: (value: boolean) => void;
}) {
  const pct = progress.total
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) onDragState(true);
      }}
      onDragLeave={() => onDragState(false)}
      onDrop={(event) => {
        event.preventDefault();
        if (busy) return;
        const file = event.dataTransfer.files?.[0];
        if (file) onDrop(file);
      }}
      className={cn(
        "glass edge-light relative grid place-items-center rounded-[1.75rem] px-6 py-16 text-center",
        "transition-colors duration-400",
        dragging && "border-champagne/30 bg-champagne/[0.07]",
      )}
    >
      {busy ? (
        <div className="w-full max-w-sm space-y-4">
          <Loader2 className="mx-auto size-6 animate-spin stroke-[1.5] text-chalk" />
          <p className="font-display text-lg font-bold text-chalk">
            {phase === "leyendo" ? "Leyendo el catálogo" : "Comparando con la tienda"}
          </p>
          {phase === "leyendo" && progress.total > 0 && (
            <>
              <div className="h-1 overflow-hidden rounded-full bg-champagne/10">
                <motion.div
                  className="h-full rounded-full bg-chalk"
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, ease: EASE }}
                />
              </div>
              <p className="numeric text-[0.6875rem] uppercase tracking-[0.18em] text-ash">
                Página {progress.done} de {progress.total}
              </p>
            </>
          )}
          <p className="text-[0.8125rem] text-ash">
            No cierres esta pestaña: el PDF se procesa acá, en tu navegador.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <span className="mx-auto grid size-14 place-items-center rounded-full border border-champagne/12 bg-champagne/[0.04] text-chalk">
            <Upload className="size-5 stroke-[1.25]" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-chalk">
              Arrastrá el PDF del proveedor
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[0.875rem] leading-relaxed text-ash">
              Se analiza en tu navegador y se te muestra el resumen. No se
              modifica nada de la tienda hasta que lo confirmes.
            </p>
          </div>
          <Button variant="glass" onClick={onPick}>
            <FileText />
            Elegir archivo
          </Button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Resumen --------------------------------- */

const SUMMARY_ROWS = [
  { key: "found", label: "Productos encontrados" },
  { key: "created", label: "Productos nuevos" },
  { key: "updated", label: "Productos modificados" },
  { key: "removed", label: "Dados de baja" },
  { key: "priceChanges", label: "Precios modificados" },
  { key: "sizeChanges", label: "Talles modificados" },
  { key: "errors", label: "Errores encontrados" },
] as const;

function Summary({ run }: { run: ImportRunDetail }) {
  return (
    <div className="rounded-2xl border border-champagne/[0.07] bg-champagne/[0.022] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <Check className="size-4 stroke-[1.5] text-ok" />
        <p className="font-display text-base font-semibold text-chalk">
          Catálogo analizado correctamente
        </p>
        <span className="numeric ml-auto text-[0.6875rem] uppercase tracking-[0.18em] text-ash">
          {run.fileName} · {run.pages} páginas
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {SUMMARY_ROWS.map((row) => {
          const value = run.summary[row.key];
          const alarming = row.key === "errors" && value > 0;
          return (
            <div
              key={row.key}
              className="rounded-xl border border-champagne/[0.07] bg-ink/40 p-3.5"
            >
              <dd
                className={cn(
                  "font-display text-2xl font-bold tracking-tight",
                  alarming ? "text-warn" : "text-chalk",
                )}
              >
                {value}
              </dd>
              <dt className="mt-1 text-[0.6875rem] leading-tight text-ash">
                {row.label}
              </dt>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ------------------------------- Diferencias ------------------------------ */

const TABS: { kind: ChangeKind; label: string }[] = [
  { kind: "nuevo", label: "Nuevos" },
  { kind: "modificado", label: "Modificados" },
  { kind: "ausente", label: "Dados de baja" },
  { kind: "error", label: "Errores" },
  { kind: "sin-cambios", label: "Sin cambios" },
];

function groupItems(items: ImportItem[]): Record<ChangeKind, ImportItem[]> {
  const groups: Record<ChangeKind, ImportItem[]> = {
    nuevo: [],
    modificado: [],
    ausente: [],
    error: [],
    "sin-cambios": [],
  };
  for (const item of items) groups[item.kind].push(item);
  return groups;
}

function firstTabWithItems(items: ImportItem[]): ChangeKind {
  const groups = groupItems(items);
  return TABS.find((tab) => groups[tab.kind].length)?.kind ?? "nuevo";
}

function ItemList({
  items,
  skipped,
  catalog,
  onToggle,
  onLink,
}: {
  items: ImportItem[];
  skipped: Set<string>;
  catalog: CatalogOption[];
  onToggle: (id: string) => void;
  onLink: (itemId: string, productId: string) => void;
}) {
  if (!items.length) {
    return (
      <p className="px-5 py-12 text-center text-[0.8125rem] text-ash">
        Nada en esta categoría.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-champagne/[0.05]">
      {items.map((item) => {
        const off = skipped.has(item.id);
        const actionable = Boolean(item.patch);
        return (
          <li
            key={item.id}
            className={cn(
              "flex flex-wrap items-start gap-4 px-5 py-4 transition-opacity duration-300",
              off && "opacity-45",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="eyebrow">
                {item.brand || "sin marca"}
                {item.page > 0 && ` · pág. ${item.page}`}
              </p>
              <p className="mt-1 truncate text-[0.875rem] font-medium text-chalk">
                {item.model}
              </p>

              {item.reason && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[0.75rem] text-warn">
                  <CircleAlert className="mt-0.5 size-3 shrink-0 stroke-[1.5]" />
                  {item.reason}
                </p>
              )}

              {item.changes.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {item.changes.map((change, i) => (
                    <li
                      key={`${change.field}-${i}`}
                      className="flex flex-wrap items-center gap-2 text-[0.75rem]"
                    >
                      <span className="numeric uppercase tracking-[0.16em] text-ash">
                        {change.field}
                      </span>
                      <span className="numeric rounded-md bg-bad/10 px-1.5 py-0.5 text-bad line-through decoration-bad/40">
                        {change.before}
                      </span>
                      <ArrowRight className="size-3 shrink-0 stroke-[1.5] text-ash" />
                      <span className="numeric rounded-md bg-ok/12 px-1.5 py-0.5 text-ok">
                        {change.after}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {item.kind === "nuevo" && (
              <LinkPicker
                catalog={catalog}
                onPick={(productId) => onLink(item.id, productId)}
              />
            )}

            {actionable && (
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={!off}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.75rem] transition-colors duration-300",
                  off
                    ? "border-champagne/12 text-ash hover:text-chalk"
                    : "border-ok/30 bg-ok/10 text-ok",
                )}
              >
                {off ? <Plus className="size-3" /> : <Minus className="size-3" />}
                {off ? "Incluir" : "Excluir"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Selector para atar un borrador a un producto que ya existe.
 *
 * Es un `<select>` nativo y no un buscador con dropdown propio: con 31
 * productos el nativo se abre más rápido, filtra escribiendo y funciona igual
 * con teclado en cualquier navegador.
 */
function LinkPicker({
  catalog,
  onPick,
}: {
  catalog: CatalogOption[];
  onPick: (productId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-full border border-champagne/12 px-3.5 py-2 text-[0.75rem] text-ash transition-colors duration-300 hover:border-champagne/25 hover:text-chalk"
      >
        <Link2 className="size-3 stroke-[1.5]" />
        Ya lo tengo
      </button>
    );
  }

  return (
    <select
      autoFocus
      defaultValue=""
      onBlur={() => setOpen(false)}
      onChange={(event) => {
        if (event.target.value) onPick(event.target.value);
        setOpen(false);
      }}
      aria-label="Elegí el producto de tu tienda"
      className="h-9 shrink-0 rounded-full border border-champagne/20 bg-graphite px-3 text-[0.75rem] text-chalk"
    >
      <option value="">Elegí el producto…</option>
      {catalog.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
