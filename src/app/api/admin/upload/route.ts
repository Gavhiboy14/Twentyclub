import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import { badRequest, requireAdmin } from "@/lib/admin/guard";
import { driverName } from "@/lib/data/store";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/data/supabase-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/svg+xml", ".svg"],
]);

/**
 * Sube imágenes y devuelve las URLs públicas.
 *
 * Con DATA_DRIVER=local van a /public/uploads; con supabase, al bucket
 * "productos" de Storage. En Netlify sólo sirve el segundo camino: el
 * filesystem de las funciones es de sólo lectura.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) return badRequest("No llegó ninguna imagen");
  if (files.length > 10) return badRequest("Máximo 10 imágenes por vez");

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return badRequest(
        `«${file.name}» no es una imagen soportada. Usá JPG, PNG, WebP, AVIF o SVG.`,
      );
    }
    if (file.size > MAX_BYTES) {
      return badRequest(`«${file.name}» pesa más de 6 MB.`);
    }
  }

  const urls =
    driverName() === "supabase"
      ? await uploadToStorage(files)
      : await uploadToDisk(files);

  if (typeof urls === "string") return badRequest(urls);
  return NextResponse.json({ urls }, { status: 201 });
}

/** Nombre generado: nunca se confía en el nombre original del archivo. */
function safeName(file: File) {
  const ext = ALLOWED.get(file.type) ?? (extname(file.name) || ".bin");
  return `${randomUUID()}${ext}`;
}

async function uploadToStorage(files: File[]): Promise<string[] | string> {
  const storage = supabaseAdmin().storage.from(STORAGE_BUCKET);
  const urls: string[] = [];

  for (const file of files) {
    const path = safeName(file);
    const { error } = await storage.upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return `No se pudo subir «${file.name}»: ${error.message}`;
    urls.push(storage.getPublicUrl(path).data.publicUrl);
  }

  return urls;
}

async function uploadToDisk(files: File[]): Promise<string[]> {
  const dir = resolve(process.cwd(), "public/uploads");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const filename = safeName(file);
    await writeFile(
      resolve(dir, filename),
      Buffer.from(await file.arrayBuffer()),
    );
    urls.push(`/uploads/${filename}`);
  }
  return urls;
}
