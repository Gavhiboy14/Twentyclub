"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageOff, Loader2, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/field";
import { ErrorNote } from "./ui";

/** Una sola imagen (portada de categoría, banner, logo de marca). */
export function ImageField({
  label,
  hint,
  value,
  onChange,
  aspect = "aspect-[16/7]",
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("files", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { urls?: string[]; error?: string };

      if (!res.ok || !data.urls?.[0]) {
        setError(data.error ?? "No se pudo subir la imagen.");
        return;
      }
      onChange(data.urls[0]);
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div
        className={`group relative ${aspect} overflow-hidden rounded-2xl border border-champagne/8 bg-graphite`}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill sizes="480px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Quitar la imagen de ${label.toLowerCase()}`}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-ink/80 text-mist backdrop-blur-sm transition-colors hover:bg-bad/25 hover:text-bad"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="grid h-full place-items-center text-ash">
            <ImageOff className="size-5" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-champagne/12 py-2.5 text-[0.8125rem] text-ash transition-colors hover:border-champagne/40 hover:text-chalk disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        {uploading ? "Subiendo…" : value ? "Reemplazar imagen" : "Subir imagen"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {hint && <p className="text-xs text-ash">{hint}</p>}
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
