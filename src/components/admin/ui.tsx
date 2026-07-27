"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-cream">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-ash">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-cream/[0.07] bg-cream/[0.022] p-5 sm:p-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="font-display text-base font-semibold tracking-tight text-chalk">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-ash">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Envuelve un fetch mutante: bloquea el botón, guarda el error y refresca. */
export function useMutate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      input: RequestInfo,
      init?: RequestInit,
      options?: { onDone?: (data: unknown) => void; skipRefresh?: boolean },
    ) => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch(input, init);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            (data as { error?: string }).error ?? "No se pudo guardar el cambio.",
          );
          return null;
        }
        if (!options?.skipRefresh) router.refresh();
        options?.onDone?.(data);
        return data;
      } catch {
        setError("Sin conexión con el servidor.");
        return null;
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  return { mutate, pending, error, setError } as const;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-bad/25 bg-bad/10 px-3.5 py-2.5 text-[0.8125rem] text-bad"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      {children}
    </p>
  );
}

/** Botón que pide confirmación antes de una acción destructiva. */
export function ConfirmAction({
  title,
  description,
  confirmLabel = "Sí, borrar",
  onConfirm,
  trigger,
  pending,
  className,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  trigger: React.ReactElement<ButtonProps>;
  pending?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span className={className} onClick={() => setOpen(true)}>
        {trigger}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-display text-xl font-bold tracking-tight text-cream">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2.5 text-sm leading-relaxed text-mist">
            {description}
          </DialogDescription>

          <div className="mt-7 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={async () => {
                await onConfirm();
                setOpen(false);
              }}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream/10 px-6 py-14 text-center">
      <p className="text-sm text-ash">{children}</p>
    </div>
  );
}
