"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Pencil, Search, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { Badge, TAG_META } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmAction, EmptyRow, ErrorNote, useMutate } from "./ui";
import { cn, formatPrice, PLACEHOLDER_IMAGE } from "@/lib/utils";

type Row = Product & { brandName: string };

export function ProductsTable({
  products,
  initialQuery = "",
}: {
  products: Row[];
  initialQuery?: string;
}) {
  const { mutate, pending, error } = useMutate();
  const [query, setQuery] = useState(initialQuery);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      `${p.brandName} ${p.name} ${p.sku} ${p.color}`
        .toLowerCase()
        .includes(term),
    );
  }, [products, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ash" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por marca, modelo, SKU o color"
          className="pl-11"
        />
      </div>

      <ErrorNote>{error}</ErrorNote>

      {rows.length === 0 ? (
        <EmptyRow>
          {query
            ? `Ningún producto coincide con «${query}».`
            : "Todavía no hay productos cargados."}
        </EmptyRow>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream/[0.07]">
          <table className="w-full min-w-[52rem] border-collapse">
            <thead>
              <tr className="border-b border-cream/[0.07] bg-cream/[0.02]">
                <Th>Producto</Th>
                <Th>Precio</Th>
                <Th>Stock</Th>
                <Th>Estado</Th>
                <Th align="right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => {
                const visible = product.sizes.filter(
                  (s) => s.available && s.stock > 0,
                );
                const stock = visible.reduce((a, s) => a + s.stock, 0);
                const final = Math.round(
                  product.price * (1 - product.discount / 100),
                );

                return (
                  <tr
                    key={product.id}
                    className="border-b border-cream/[0.04] transition-colors last:border-0 hover:bg-cream/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-graphite">
                          <Image
                            src={product.images[0]?.url ?? PLACEHOLDER_IMAGE}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="eyebrow">{product.brandName}</p>
                          <p className="truncate text-[0.8125rem] font-medium text-chalk">
                            {product.name}
                          </p>
                          <p className="font-mono text-[0.625rem] text-ash">
                            {product.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-mono text-[0.8125rem] text-chalk">
                        {formatPrice(final)}
                      </p>
                      {product.discount > 0 && (
                        <p className="font-mono text-[0.625rem] text-sand">
                          −{product.discount}%
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <p
                        className={cn(
                          "font-mono text-[0.8125rem]",
                          stock === 0
                            ? "text-bad"
                            : stock <= 5
                              ? "text-warn"
                              : "text-mist",
                        )}
                      >
                        {stock}
                      </p>
                      <p className="font-mono text-[0.625rem] text-ash">
                        {visible.length} talles
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {stock === 0 && <Badge variant="bad">Agotado</Badge>}
                        {product.featured && (
                          <Badge variant="cream">Destacado</Badge>
                        )}
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="neutral">
                            {TAG_META[tag].label}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconLink
                          href={`/producto/${product.slug}`}
                          label={`Ver ${product.name} en la tienda`}
                          external
                        >
                          <ExternalLink className="size-3.5" />
                        </IconLink>
                        <IconLink
                          href={`/admin/productos/${product.id}`}
                          label={`Editar ${product.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </IconLink>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            mutate(`/api/admin/products/${product.id}`, {
                              method: "POST",
                            })
                          }
                          aria-label={`Duplicar ${product.name}`}
                          className="grid size-8 place-items-center rounded-lg text-ash transition-colors hover:bg-cream/8 hover:text-chalk disabled:opacity-40"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <ConfirmAction
                          title={`¿Borrar ${product.brandName} ${product.name}?`}
                          description="Se elimina del catálogo y de las ofertas que lo incluyan. Los pedidos ya registrados no se tocan."
                          pending={pending}
                          onConfirm={() =>
                            mutate(`/api/admin/products/${product.id}`, {
                              method: "DELETE",
                            })
                          }
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-8 hover:bg-bad/12 hover:text-bad"
                              aria-label={`Borrar ${product.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash">
        {rows.length} de {products.length} productos
      </p>
    </div>
  );
}

function IconLink({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      target={external ? "_blank" : undefined}
      className="grid size-8 place-items-center rounded-lg text-ash transition-colors hover:bg-cream/8 hover:text-chalk"
    >
      {children}
    </Link>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}
