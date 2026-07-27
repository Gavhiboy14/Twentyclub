"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Lista de textos cortos (materiales, características). Enter agrega. */
export function ListInput({
  label,
  hint,
  placeholder,
  values,
  onChange,
  variant = "chips",
}: {
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  variant?: "chips" | "rows";
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Agregar a ${label.toLowerCase()}`}
          className="grid size-11 shrink-0 place-items-center rounded-2xl border border-champagne/10 bg-champagne/[0.035] text-mist transition-colors hover:border-champagne/40 hover:text-chalk"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {values.length > 0 && (
        <ul
          className={cn(
            variant === "chips" ? "flex flex-wrap gap-2" : "space-y-1.5",
            "pt-1",
          )}
        >
          {values.map((value, i) => (
            <li
              key={value}
              className={cn(
                "group flex items-center gap-2 border border-champagne/10 bg-champagne/[0.03] text-[0.8125rem] text-mist",
                variant === "chips"
                  ? "rounded-full py-1.5 pl-3.5 pr-1.5"
                  : "rounded-xl px-3.5 py-2.5",
              )}
            >
              <span className="flex-1">{value}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                aria-label={`Quitar ${value}`}
                className="grid size-6 shrink-0 place-items-center rounded-full text-ash transition-colors hover:bg-bad/15 hover:text-bad"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="text-xs text-ash">{hint}</p>}
    </div>
  );
}
