"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Loader2, Search, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";

interface Result {
  slug: string;
  name: string;
  brand: string;
  color: string;
  price: number;
  image: string;
  inStock: boolean;
}

const SUGGESTIONS = ["Air Max", "Samba", "New Balance 9060", "Jordan", "negro"];

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setCursor(0);
      } catch {
        // Búsqueda cancelada por una tecla más nueva: no es un error.
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function go(slug: string) {
    onOpenChange(false);
    router.push(`/producto/${slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[cursor]) go(results[cursor].slug);
      else if (query.trim()) {
        onOpenChange(false);
        router.push(`/productos?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="top-[12%] max-w-2xl translate-y-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Buscar productos</DialogTitle>
        <DialogDescription className="sr-only">
          Buscá por marca, modelo, nombre o color.
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-cream/8 px-5">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-cream" />
          ) : (
            <Search className="size-4 shrink-0 text-ash" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscá por marca, modelo o color…"
            className="h-16 w-full bg-transparent text-[0.9375rem] text-chalk placeholder:text-ash focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-cream/10 bg-cream/5 px-1.5 py-0.5 font-mono text-[0.625rem] text-ash sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[min(26rem,55vh)] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="p-4">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <TrendingUp className="size-3" />
                Búsquedas frecuentes
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-cream/10 bg-cream/[0.03] px-3.5 py-1.5 text-[0.8125rem] text-mist transition-colors hover:border-cream/40 hover:text-chalk"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist">
                No encontramos nada para «{query.trim()}».
              </p>
              <p className="mt-1 text-[0.8125rem] text-ash">
                Probá con la marca o el modelo solo.
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Resultados">
              {results.map((r, i) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === cursor}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(r.slug)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl p-2.5 text-left transition-colors duration-150",
                      i === cursor ? "bg-cream/[0.07]" : "hover:bg-cream/[0.04]",
                    )}
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-graphite">
                      <Image
                        src={r.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">{r.brand}</p>
                      <p className="truncate text-sm font-medium text-chalk">
                        {r.name}
                      </p>
                      <p className="truncate text-xs text-ash">{r.color}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-sm font-bold text-cream">
                        {formatPrice(r.price)}
                      </p>
                      {!r.inStock && (
                        <p className="font-mono text-[0.625rem] uppercase tracking-widest text-ash">
                          Agotado
                        </p>
                      )}
                    </div>
                    {i === cursor && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-ash" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
