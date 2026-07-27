"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import type { Brand, Category, Product, ProductTag, SizeStock } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, NativeSelect, Textarea } from "@/components/ui/field";
import { Checkbox, Switch } from "@/components/ui/controls";
import { TAG_META } from "@/components/ui/badge";
import { ConfirmAction, ErrorNote, Panel, useMutate } from "./ui";
import { ImageManager } from "./image-manager";
import { ListInput } from "./list-input";
import { cn, formatPrice } from "@/lib/utils";

const ALL_TAGS = Object.keys(TAG_META) as ProductTag[];
const DEFAULT_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];

type Draft = {
  name: string;
  brandId: string;
  categoryIds: string[];
  price: number;
  discount: number;
  description: string;
  features: string[];
  color: string;
  colorHex: string;
  materials: string[];
  tags: ProductTag[];
  sku: string;
  images: Product["images"];
  sizes: SizeStock[];
  featured: boolean;
};

function emptyDraft(brandId: string): Draft {
  return {
    name: "",
    brandId,
    categoryIds: [],
    price: 0,
    discount: 0,
    description: "",
    features: [],
    color: "",
    colorHex: "#b4b0a0",
    materials: [],
    tags: [],
    sku: "",
    images: [],
    sizes: DEFAULT_SIZES.map((size) => ({ size, stock: 0, available: true })),
    featured: false,
  };
}

export function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: Product;
  brands: Brand[];
  categories: Category[];
}) {
  const router = useRouter();
  const { mutate, pending, error } = useMutate();
  const isNew = !product;

  const [draft, setDraft] = useState<Draft>(() =>
    product
      ? {
          name: product.name,
          brandId: product.brandId,
          categoryIds: product.categoryIds,
          price: product.price,
          discount: product.discount,
          description: product.description,
          features: product.features,
          color: product.color,
          colorHex: product.colorHex,
          materials: product.materials,
          tags: product.tags,
          sku: product.sku,
          images: product.images,
          sizes: product.sizes,
          featured: product.featured,
        }
      : emptyDraft(brands[0]?.id ?? ""),
  );
  const [newSize, setNewSize] = useState("");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const brandName =
    brands.find((b) => b.id === draft.brandId)?.name ?? "Sin marca";

  const finalPrice = useMemo(
    () => Math.round(draft.price * (1 - draft.discount / 100)),
    [draft.price, draft.discount],
  );

  const visibleSizes = draft.sizes.filter((s) => s.available && s.stock > 0);

  async function save() {
    const payload = { ...draft };
    const data = (await mutate(
      isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )) as { product?: Product } | null;

    if (data?.product) router.push("/admin/productos");
  }

  async function remove() {
    await mutate(`/api/admin/products/${product!.id}`, { method: "DELETE" });
    router.push("/admin/productos");
  }

  async function duplicate() {
    const data = (await mutate(`/api/admin/products/${product!.id}`, {
      method: "POST",
    })) as { product?: Product } | null;
    if (data?.product) router.push(`/admin/productos/${data.product.id}`);
  }

  function updateSize(index: number, patch: Partial<SizeStock>) {
    set(
      "sizes",
      draft.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function addSize() {
    const value = newSize.trim();
    if (!value || draft.sizes.some((s) => s.size === value)) return;
    set(
      "sizes",
      [...draft.sizes, { size: value, stock: 0, available: true }].sort(
        (a, b) => Number(a.size) - Number(b.size),
      ),
    );
    setNewSize("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_21rem] xl:items-start">
      <div className="space-y-4">
        <Panel title="Identidad" description="Lo que se ve primero en el catálogo.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Modelo"
              hint="Sin la marca. Ej: «Air Max 95»."
              className="sm:col-span-2"
            >
              <Input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Air Max 95"
              />
            </Field>

            <Field label="Marca">
              <NativeSelect
                value={draft.brandId}
                onChange={(e) => set("brandId", e.target.value)}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="SKU" hint={isNew ? "Se genera solo si lo dejás vacío." : undefined}>
              <Input
                value={draft.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="TC-NIK-001"
                className="font-mono"
              />
            </Field>

            <Field label="Color" className="sm:col-span-2">
              <div className="flex gap-2">
                <Input
                  value={draft.color}
                  onChange={(e) => set("color", e.target.value)}
                  placeholder="Gris neón"
                />
                <input
                  type="color"
                  value={draft.colorHex}
                  onChange={(e) => set("colorHex", e.target.value)}
                  aria-label="Color de referencia"
                  className="size-11 shrink-0 cursor-pointer rounded-2xl border border-cream/10 bg-transparent p-1"
                />
              </div>
            </Field>

            <Field label="Descripción" className="sm:col-span-2">
              <Textarea
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Contá qué tiene de especial este par."
                rows={5}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Imágenes" description="La primera es la portada del catálogo.">
          <ImageManager
            images={draft.images}
            onChange={(images) => set("images", images)}
            altBase={`${brandName} ${draft.name || "producto"}`}
          />
        </Panel>

        <Panel
          title="Talles y stock"
          description="Un talle desaparece del sitio cuando llega a cero o lo deshabilitás."
        >
          <div className="space-y-2">
            {draft.sizes.map((size, i) => (
              <div
                key={size.size}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
                  size.available && size.stock > 0
                    ? "border-cream/8 bg-cream/[0.03]"
                    : "border-cream/6 bg-transparent",
                )}
              >
                <span className="w-10 shrink-0 font-mono text-sm text-chalk">
                  {size.size}
                </span>

                <label className="flex items-center gap-2">
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash">
                    Stock
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={size.stock}
                    onChange={(e) =>
                      updateSize(i, { stock: Math.max(0, Number(e.target.value)) })
                    }
                    className="h-9 w-20 text-center font-mono"
                  />
                </label>

                <label className="ml-auto flex items-center gap-2.5">
                  <span
                    className={cn(
                      "font-mono text-[0.625rem] uppercase tracking-[0.16em]",
                      size.available ? "text-mist" : "text-ash",
                    )}
                  >
                    {size.available ? "Disponible" : "Oculto"}
                  </span>
                  <Switch
                    checked={size.available}
                    onCheckedChange={(v) => updateSize(i, { available: v })}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    set("sizes", draft.sizes.filter((_, j) => j !== i))
                  }
                  aria-label={`Quitar el talle ${size.size}`}
                  className="grid size-8 place-items-center rounded-lg text-ash transition-colors hover:bg-bad/12 hover:text-bad"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize();
                }
              }}
              placeholder="Agregar talle (ej: 46)"
              className="max-w-56"
            />
            <Button type="button" variant="glass" onClick={addSize}>
              <Plus />
              Agregar
            </Button>
          </div>
        </Panel>

        <Panel title="Ficha técnica">
          <div className="grid gap-6 sm:grid-cols-2">
            <ListInput
              label="Características"
              placeholder="Unidad Air visible en el talón"
              values={draft.features}
              onChange={(v) => set("features", v)}
              variant="rows"
            />
            <ListInput
              label="Materiales"
              placeholder="Gamuza"
              values={draft.materials}
              onChange={(v) => set("materials", v)}
            />
          </div>
        </Panel>
      </div>

      {/* Columna de publicación */}
      <div className="space-y-4 xl:sticky xl:top-6">
        <Panel title="Precio">
          <div className="space-y-5">
            <Field label="Precio de lista">
              <Input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => set("price", Math.max(0, Number(e.target.value)))}
                className="font-mono"
              />
            </Field>

            <Field label="Descuento (%)" hint="0 = sin descuento.">
              <Input
                type="number"
                min={0}
                max={90}
                value={draft.discount}
                onChange={(e) =>
                  set("discount", Math.min(90, Math.max(0, Number(e.target.value))))
                }
                className="font-mono"
              />
            </Field>

            <div className="flex items-baseline justify-between rounded-xl border border-cream/8 bg-cream/[0.03] px-4 py-3">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash">
                Se publica en
              </span>
              <span className="font-display text-lg font-bold text-cream">
                {formatPrice(finalPrice)}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Publicación">
          <div className="space-y-5">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-[0.8125rem] text-chalk">
                  Destacado
                </span>
                <span className="block text-xs text-ash">
                  Aparece en la selección de la portada.
                </span>
              </span>
              <Switch
                checked={draft.featured}
                onCheckedChange={(v) => set("featured", v)}
              />
            </label>

            <div>
              <Label className="mb-3">Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((tag) => {
                  const active = draft.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        set(
                          "tags",
                          active
                            ? draft.tags.filter((t) => t !== tag)
                            : [...draft.tags, tag],
                        )
                      }
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] transition-colors",
                        active
                          ? "border-cream bg-cream/20 text-cream"
                          : "border-cream/10 bg-cream/[0.03] text-ash hover:text-chalk",
                      )}
                    >
                      {TAG_META[tag].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-3">Colecciones</Label>
              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const active = draft.categoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <Checkbox
                        checked={active}
                        onCheckedChange={() =>
                          set(
                            "categoryIds",
                            active
                              ? draft.categoryIds.filter((c) => c !== cat.id)
                              : [...draft.categoryIds, cat.id],
                          )
                        }
                      />
                      <span
                        className={cn(
                          "text-[0.8125rem]",
                          active ? "text-chalk" : "text-mist",
                        )}
                      >
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <p className="rounded-xl border border-cream/8 bg-cream/[0.02] px-3.5 py-3 text-xs leading-relaxed text-ash">
              {visibleSizes.length === 0
                ? "Ahora mismo el producto se muestra como agotado: ningún talle tiene stock."
                : `Se van a mostrar ${visibleSizes.length} talles en el sitio.`}
            </p>
          </div>
        </Panel>

        <ErrorNote>{error}</ErrorNote>

        <div className="space-y-2">
          <Button
            onClick={save}
            disabled={pending || !draft.name.trim()}
            size="lg"
            className="w-full"
          >
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            {isNew ? "Crear producto" : "Guardar cambios"}
          </Button>

          {!isNew && (
            <div className="flex gap-2">
              <Button
                variant="glass"
                className="flex-1"
                onClick={duplicate}
                disabled={pending}
              >
                Duplicar
              </Button>
              <ConfirmAction
                title={`¿Borrar ${brandName} ${product.name}?`}
                description="Se elimina del catálogo y de las ofertas que lo incluyan. Los pedidos ya registrados no se tocan."
                onConfirm={remove}
                pending={pending}
                className="flex-1"
                trigger={
                  <Button variant="danger" className="w-full">
                    <Trash2 />
                    Borrar
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
