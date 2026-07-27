"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, Upload, X } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { Label } from "@/components/ui/field";
import { ErrorNote } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Galería del producto: subir, reordenar y borrar. La primera imagen es la
 * portada — por eso el orden se maneja acá y no en otro lado.
 */
export function ImageManager({
  images,
  onChange,
  altBase,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  altBase: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      for (const file of Array.from(files)) body.append("files", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { urls?: string[]; error?: string };

      if (!res.ok || !data.urls) {
        setError(data.error ?? "No se pudieron subir las imágenes.");
        return;
      }

      onChange([
        ...images,
        ...data.urls.map((url, i) => ({
          id: `img_${Date.now().toString(36)}_${i}`,
          url,
          alt: `${altBase} — vista ${images.length + i + 1}`,
        })),
      ]);
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Imágenes</Label>
        <span className="numeric text-[0.625rem] uppercase tracking-[0.16em] text-ash">
          {images.length} cargadas
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, i) => (
          <figure
            key={image.id}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-2xl border bg-graphite",
              i === 0 ? "border-champagne/50" : "border-champagne/8",
            )}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="200px"
              className="object-cover"
            />

            {i === 0 && (
              <figcaption className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ivory px-2 py-1 text-[0.5625rem] uppercase tracking-[0.14em] text-ink">
                <Star className="size-2.5 fill-current" />
                Portada
              </figcaption>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-linear-to-t from-ink/95 to-transparent p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
              <div className="flex gap-1">
                <IconBtn
                  label={`Mover ${image.alt} a la izquierda`}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                >
                  <ArrowLeft className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label={`Mover ${image.alt} a la derecha`}
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                >
                  <ArrowRight className="size-3.5" />
                </IconBtn>
              </div>
              <IconBtn
                label={`Quitar ${image.alt}`}
                danger
                onClick={() => onChange(images.filter((_, j) => j !== i))}
              >
                <X className="size-3.5" />
              </IconBtn>
            </div>
          </figure>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="grid aspect-square place-items-center rounded-2xl border border-dashed border-champagne/12 bg-champagne/[0.02] text-ash transition-colors hover:border-champagne/40 hover:text-chalk disabled:opacity-50"
        >
          <span className="flex flex-col items-center gap-2 px-3 text-center">
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
            <span className="text-[0.6875rem] leading-tight">
              {uploading ? "Subiendo…" : "Subir imágenes"}
            </span>
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />

      <p className="text-xs text-ash">
        JPG, PNG, WebP, AVIF o SVG. Hasta 6 MB cada una. La primera es la que
        se ve en el catálogo.
      </p>

      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-7 place-items-center rounded-lg bg-ink/80 text-mist backdrop-blur-sm transition-colors disabled:opacity-30",
        danger ? "hover:bg-bad/25 hover:text-bad" : "hover:bg-champagne/15 hover:text-chalk",
      )}
    >
      {children}
    </button>
  );
}
