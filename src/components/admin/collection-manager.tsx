"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, Input, Label, NativeSelect, Textarea } from "@/components/ui/field";
import { Checkbox, Switch } from "@/components/ui/controls";
import { ConfirmAction, EmptyRow, ErrorNote, useMutate } from "./ui";
import { ImageField } from "./image-field";
import { cn } from "@/lib/utils";

export type FieldSpec =
  | {
      key: string;
      type: "text" | "textarea" | "number" | "date";
      label: string;
      hint?: string;
      placeholder?: string;
    }
  | { key: string; type: "switch"; label: string; hint?: string }
  | { key: string; type: "image"; label: string; hint?: string; aspect?: string }
  | {
      key: string;
      type: "select" | "products";
      label: string;
      hint?: string;
      options: Array<{ value: string; label: string }>;
    };

/** Registro plano de la base. Los campos se leen según la spec. */
export type Record_ = Record<string, unknown> & { id: string };

/**
 * Descripción de la tarjeta, ya resuelta en el servidor. Es todo texto y URLs:
 * no viajan funciones al cliente, que es lo que RSC no permite.
 */
export interface CardData {
  cover?: string | null;
  coverAspect?: string;
  badges?: Array<{ label: string; variant: NonNullable<BadgeProps["variant"]> }>;
  eyebrow?: string;
  title: string;
  meta?: string;
  body?: string;
  /** Motivo por el que no se puede borrar. Si viene, se oculta el botón. */
  blockedReason?: string | null;
}

export interface Entry {
  record: Record_;
  card: CardData;
}

/**
 * CRUD compartido para marcas, categorías, banners y ofertas: las cuatro son
 * listas planas y sólo cambian los campos, así que el formulario se arma desde
 * una especificación en vez de repetirse cuatro veces.
 */
export function CollectionManager({
  collection,
  entries,
  fields,
  defaults,
  singular,
  plural,
}: {
  collection: "brands" | "categories" | "banners" | "offers";
  entries: Entry[];
  fields: FieldSpec[];
  defaults: Record<string, unknown>;
  singular: string;
  plural: string;
}) {
  const { mutate, pending, error, setError } = useMutate();
  const [editing, setEditing] = useState<Record_ | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(defaults);

  function openCreate() {
    setDraft(defaults);
    setError(null);
    setCreating(true);
  }

  function openEdit(record: Record_) {
    const next: Record<string, unknown> = {};
    for (const field of fields) next[field.key] = record[field.key];
    setDraft(next);
    setError(null);
    setEditing(record);
  }

  async function save() {
    const target = editing
      ? `/api/admin/collections/${collection}/${editing.id}`
      : `/api/admin/collections/${collection}`;

    const result = await mutate(target, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (result) {
      setEditing(null);
      setCreating(false);
    }
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {/* «Agregar» evita tener que declarar el género de cada colección. */}
        <Button onClick={openCreate}>
          <Plus />
          Agregar {singular.toLowerCase()}
        </Button>
      </div>

      <ErrorNote>{!open ? error : null}</ErrorNote>

      {entries.length === 0 ? (
        <EmptyRow>Todavía no hay {plural.toLowerCase()}.</EmptyRow>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map(({ record, card }) => (
            <li
              key={record.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-champagne/[0.07] bg-champagne/[0.022]"
            >
              <Cover src={card.cover} aspect={card.coverAspect} />

              <div className="p-4">
                {card.badges && card.badges.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    {card.badges.map((badge) => (
                      <Badge key={badge.label} variant={badge.variant}>
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {card.eyebrow && <p className="eyebrow">{card.eyebrow}</p>}

                <p className="mt-1 font-display text-base font-semibold tracking-tight text-chalk">
                  {card.title}
                </p>

                {card.meta && (
                  <p className="mt-1 numeric text-[0.625rem] uppercase tracking-[0.16em] text-ash">
                    {card.meta}
                  </p>
                )}

                {card.body && (
                  <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-ash">
                    {card.body}
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-center gap-1.5 border-t border-champagne/[0.07] px-4 py-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(record)}>
                  <Pencil className="size-3.5" />
                  Editar
                </Button>

                {card.blockedReason ? (
                  <span className="ml-auto max-w-44 text-right text-[0.6875rem] leading-tight text-ash">
                    {card.blockedReason}
                  </span>
                ) : (
                  <ConfirmAction
                    title={`¿Borrar «${card.title}»?`}
                    description={`Se elimina de ${plural.toLowerCase()}. No se puede deshacer.`}
                    pending={pending}
                    className="ml-auto"
                    onConfirm={() =>
                      mutate(
                        `/api/admin/collections/${collection}/${record.id}`,
                        { method: "DELETE" },
                      )
                    }
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-bad/12 hover:text-bad"
                      >
                        <Trash2 className="size-3.5" />
                        Borrar
                      </Button>
                    }
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogTitle className="font-display text-xl font-medium tracking-tight text-chalk">
            {editing
              ? `Editar ${singular.toLowerCase()}`
              : `Agregar ${singular.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-[0.8125rem] text-ash">
            Los cambios se ven en la tienda apenas guardás.
          </DialogDescription>

          <div className="mt-7 space-y-5">
            {fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={draft[field.key]}
                onChange={(value) =>
                  setDraft((d) => ({ ...d, [field.key]: value }))
                }
              />
            ))}
          </div>

          <ErrorNote>{error}</ErrorNote>

          <div className="mt-7 flex justify-end gap-2.5">
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Cover({
  src,
  aspect = "aspect-[16/7]",
}: {
  src?: string | null;
  aspect?: string;
}) {
  if (!src) return null;
  return (
    <div className={`relative ${aspect} w-full overflow-hidden bg-graphite`}>
      <Image src={src} alt="" fill sizes="400px" className="object-cover" />
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <Field label={field.label} hint={field.hint}>
          <Textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        </Field>
      );

    case "number":
      return (
        <Field label={field.label} hint={field.hint}>
          <Input
            type="number"
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="numeric"
          />
        </Field>
      );

    case "date":
      return (
        <Field label={field.label} hint={field.hint}>
          <Input
            type="date"
            value={String(value ?? "").slice(0, 10)}
            onChange={(e) =>
              onChange(new Date(`${e.target.value}T12:00:00`).toISOString())
            }
          />
        </Field>
      );

    case "switch":
      return (
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block numeric text-[0.6875rem] uppercase tracking-[0.18em] text-ash">
              {field.label}
            </span>
            {field.hint && (
              <span className="mt-1 block text-xs text-ash">{field.hint}</span>
            )}
          </span>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        </label>
      );

    case "image":
      return (
        <ImageField
          label={field.label}
          hint={field.hint}
          aspect={field.aspect}
          value={(value as string | null) ?? null}
          onChange={onChange}
        />
      );

    case "select":
      return (
        <Field label={field.label} hint={field.hint}>
          <NativeSelect
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      );

    case "products": {
      const selected = (value as string[]) ?? [];
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <div className="max-h-60 space-y-2.5 overflow-y-auto rounded-2xl border border-champagne/8 bg-champagne/[0.02] p-4">
            {field.options.map((option) => {
              const active = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={active}
                    onCheckedChange={() =>
                      onChange(
                        active
                          ? selected.filter((v) => v !== option.value)
                          : [...selected, option.value],
                      )
                    }
                  />
                  <span
                    className={cn(
                      "text-[0.8125rem]",
                      active ? "text-chalk" : "text-mist",
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
          {field.hint && <p className="text-xs text-ash">{field.hint}</p>}
        </div>
      );
    }

    default:
      return (
        <Field label={field.label} hint={field.hint}>
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </Field>
      );
  }
}
