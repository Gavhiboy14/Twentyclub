"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import type { Brand, Category } from "@/lib/types";
import { SORT_LABELS, type Facets, type SortKey } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Checkbox, Slider, Switch } from "@/components/ui/controls";
import { NativeSelect } from "@/components/ui/field";
import { Dialog, SheetContent, DialogTitle } from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";

interface FiltersProps {
  brands: Brand[];
  categories: Category[];
  facets: Facets;
  /** Se oculta el filtro de marca en las páginas de marca. */
  lockedBrand?: string;
  resultCount: number;
}

/** Lee y escribe el estado de filtros en la URL: es compartible y navegable. */
function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const list = useCallback(
    (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [],
    [params],
  );

  const apply = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        const serialized = Array.isArray(value) ? value.join(",") : value;
        if (!serialized) next.delete(key);
        else next.set(key, serialized);
      }
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const toggleIn = useCallback(
    (key: string, value: string) => {
      const current = list(key);
      apply({
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      });
    },
    [apply, list],
  );

  return { params, list, apply, toggleIn, pending, pathname, router };
}

export function CatalogControls({
  brands,
  categories,
  facets,
  lockedBrand,
  resultCount,
}: FiltersProps) {
  const { params, apply, pending } = useFilterParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const key of ["marca", "cat", "talle", "color"]) {
      if (!(key === "marca" && lockedBrand)) {
        n += params.get(key)?.split(",").filter(Boolean).length ?? 0;
      }
    }
    if (params.get("min") || params.get("max")) n++;
    if (params.get("disp")) n++;
    if (params.get("oferta")) n++;
    return n;
  }, [params, lockedBrand]);

  const sort = (params.get("orden") as SortKey) ?? "vendidos";

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[0.8125rem] text-mist transition-colors hover:text-chalk lg:hidden"
        >
          <SlidersHorizontal className="size-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-ivory numeric text-[0.625rem] font-bold text-ink">
              {activeCount}
            </span>
          )}
        </button>

        <p className="numeric text-[0.6875rem] uppercase tracking-[0.18em] text-ash">
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              Filtrando
            </span>
          ) : (
            `${resultCount} ${resultCount === 1 ? "resultado" : "resultados"}`
          )}
        </p>

        <div className="ml-auto flex items-center gap-2.5">
          <label
            htmlFor="orden"
            className="hidden numeric text-[0.6875rem] uppercase tracking-[0.18em] text-ash sm:block"
          >
            Ordenar
          </label>
          <NativeSelect
            id="orden"
            value={sort}
            onChange={(e) => apply({ orden: e.target.value })}
            className="h-10 w-44 rounded-full text-[0.8125rem]"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="p-0">
          <div className="flex items-center justify-between border-b border-champagne/8 px-6 py-4">
            <DialogTitle className="font-display text-lg font-bold text-chalk">
              Filtros
            </DialogTitle>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Cerrar filtros"
              className="grid size-9 place-items-center rounded-full text-ash hover:bg-champagne/8 hover:text-chalk"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-6">
            <FilterPanel
              brands={brands}
              categories={categories}
              facets={facets}
              lockedBrand={lockedBrand}
              resultCount={resultCount}
            />
          </div>
          <div className="border-t border-champagne/8 p-5">
            <Button className="w-full" onClick={() => setSheetOpen(false)}>
              Ver {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
            </Button>
          </div>
        </SheetContent>
      </Dialog>
    </>
  );
}

export function FilterPanel({
  brands,
  categories,
  facets,
  lockedBrand,
}: FiltersProps) {
  const { params, list, apply, toggleIn } = useFilterParams();

  const min = Number(params.get("min") ?? facets.minPrice);
  const max = Number(params.get("max") ?? facets.maxPrice);
  const [range, setRange] = useState<[number, number]>([min, max]);

  const selectedBrands = list("marca");
  const selectedCats = list("cat");
  const selectedSizes = list("talle");
  const selectedColors = list("color");

  const hasFilters =
    selectedBrands.length +
      selectedCats.length +
      selectedSizes.length +
      selectedColors.length >
      0 ||
    Boolean(params.get("min")) ||
    Boolean(params.get("disp")) ||
    Boolean(params.get("oferta"));

  return (
    <div className="space-y-8">
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setRange([facets.minPrice, facets.maxPrice]);
            apply({
              marca: lockedBrand ? params.get("marca") : null,
              cat: null,
              talle: null,
              color: null,
              min: null,
              max: null,
              disp: null,
              oferta: null,
            });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-champagne/10 py-2.5 text-[0.8125rem] text-mist transition-colors hover:border-bad/30 hover:text-bad"
        >
          <X className="size-3.5" />
          Limpiar filtros
        </button>
      )}

      <FilterGroup title="Disponibilidad">
        <div className="space-y-3.5">
          <ToggleRow
            label="Sólo con stock"
            checked={Boolean(params.get("disp"))}
            onChange={(v) => apply({ disp: v ? "1" : null })}
          />
          <ToggleRow
            label="Sólo en oferta"
            checked={Boolean(params.get("oferta"))}
            onChange={(v) => apply({ oferta: v ? "1" : null })}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Precio">
        <Slider
          value={range}
          min={facets.minPrice}
          max={facets.maxPrice}
          step={5000}
          minStepsBetweenThumbs={1}
          onValueChange={(v) => setRange([v[0], v[1]])}
          onValueCommit={(v) =>
            apply({
              min: v[0] > facets.minPrice ? String(v[0]) : null,
              max: v[1] < facets.maxPrice ? String(v[1]) : null,
            })
          }
          aria-label="Rango de precio"
        />
        <div className="mt-3.5 flex justify-between numeric text-[0.6875rem] text-ash">
          <span>{formatPrice(range[0])}</span>
          <span>{formatPrice(range[1])}</span>
        </div>
      </FilterGroup>

      {!lockedBrand && (
        <FilterGroup title="Marca">
          <div className="space-y-3">
            {brands.map((brand) => (
              <CheckRow
                key={brand.id}
                label={brand.name}
                checked={selectedBrands.includes(brand.slug)}
                onChange={() => toggleIn("marca", brand.slug)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Talle">
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleIn("talle", size)}
                aria-pressed={active}
                className={cn(
                  "min-w-11 rounded-xl border px-3 py-2 numeric text-xs transition-all duration-300",
                  active
                    ? "border-ivory bg-ivory text-ink"
                    : "border-champagne/10 bg-champagne/[0.03] text-mist hover:border-champagne/25 hover:text-chalk",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        <div className="space-y-3">
          {facets.colors.map((color) => {
            const active = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleIn("color", color.name)}
                aria-pressed={active}
                className="flex w-full items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    "size-5 shrink-0 rounded-full border transition-all duration-300",
                    active
                      ? "border-ivory ring-2 ring-gold/50 ring-offset-2 ring-offset-ink"
                      : "border-champagne/20",
                  )}
                  style={{ backgroundColor: color.hex }}
                />
                <span
                  className={cn(
                    "text-[0.8125rem] transition-colors",
                    active ? "text-chalk" : "text-mist hover:text-chalk",
                  )}
                >
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Colección">
        <div className="space-y-3">
          {categories.map((cat) => (
            <CheckRow
              key={cat.id}
              label={cat.name}
              checked={selectedCats.includes(cat.slug)}
              onChange={() => toggleIn("cat", cat.slug)}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="eyebrow mb-4">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span
        className={cn(
          "text-[0.8125rem] transition-colors",
          checked ? "text-chalk" : "text-mist hover:text-chalk",
        )}
      >
        {label}
      </span>
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span
        className={cn(
          "text-[0.8125rem] transition-colors",
          checked ? "text-chalk" : "text-mist",
        )}
      >
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
