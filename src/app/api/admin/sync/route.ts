import { NextResponse } from "next/server";
import { z } from "zod";
import { readDb, repo } from "@/lib/data/store";
import { badRequest, requireAdmin } from "@/lib/admin/guard";
import { buildPlan } from "@/lib/sync/plan";
import { defaultRules } from "@/lib/sync/rules";
import type { ImportRunDetail } from "@/lib/sync/types";

export const dynamic = "force-dynamic";

/**
 * Recibe lo que el navegador extrajo del PDF y devuelve el plan de cambios.
 *
 * La lectura del PDF pasa en el navegador y no acá: son 47 páginas y las
 * funciones de Netlify cortan a los diez segundos. Lo que llega es la tabla ya
 * interpretada, que es liviana.
 *
 * Este endpoint NO toca el catálogo. Guarda la corrida como "analizado" y ahí
 * queda, esperando que alguien la confirme desde el panel.
 */
const extractedSchema = z.object({
  page: z.number().int().min(0),
  source: z.string().max(400).default(""),
  brand: z.string().max(80).default(""),
  model: z.string().min(1).max(200),
  color: z.string().max(60).default(""),
  supplierPrice: z.number().int().min(0).max(99_999_999),
  sizes: z.array(z.string().max(10)).default([]),
});

const bodySchema = z.object({
  fileName: z.string().max(200).default(""),
  pages: z.number().int().min(0).max(2000).default(0),
  products: z.array(extractedSchema).max(5000),
  issues: z
    .array(
      z.object({
        page: z.number().int().min(0),
        source: z.string().max(400).default(""),
        reason: z.string().max(200),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("El análisis del PDF llegó incompleto");
  if (!parsed.data.products.length) {
    return badRequest("No se encontró ningún producto en el PDF");
  }

  const db = await readDb();
  /* Sin reglas cargadas se usan las de fábrica. Es lo que hace que la primera
     importación funcione sin configurar nada. */
  const rules = db.syncRules.length ? db.syncRules : defaultRules(db.brands);

  const { items, summary } = buildPlan({
    extraction: {
      pages: parsed.data.pages,
      products: parsed.data.products,
      issues: parsed.data.issues,
    },
    db,
    rules,
  });

  const run: ImportRunDetail = {
    id: `imp_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    appliedAt: null,
    fileName: parsed.data.fileName,
    pages: parsed.data.pages,
    user: "Administrador",
    status: "analizado",
    summary,
    items,
  };

  await repo().createImport(run);
  return NextResponse.json(run);
}

/** Historial, sin las líneas de cada plan. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await repo().listImports());
}
