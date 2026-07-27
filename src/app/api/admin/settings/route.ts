import { NextResponse } from "next/server";
import { repo } from "@/lib/data/store";
import { settingsSchema } from "@/lib/admin/schemas";
import { badRequest, onlySent, requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const raw = await request.json();
  const parsed = settingsSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const settings = await repo().updateSettings(onlySent(raw, parsed.data));
  return NextResponse.json({ settings });
}
