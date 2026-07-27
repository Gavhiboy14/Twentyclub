"use client";

import { useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import type { Settings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ErrorNote, Panel, useMutate } from "./ui";
import { buildOrderMessage, normalizePhone, whatsappUrl } from "@/lib/whatsapp";

export function SettingsForm({ settings }: { settings: Settings }) {
  const { mutate, pending, error } = useMutate();
  const [draft, setDraft] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    const result = await mutate("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (result) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
  }

  // Vista previa del mensaje real que va a recibir el negocio.
  const preview = buildOrderMessage({
    items: [
      { brand: "Nike", name: "Air Max 95", size: "42", qty: 1, unitPrice: 289000 },
      { brand: "Adidas", name: "Campus 00s", size: "41", qty: 2, unitPrice: 219000 },
    ],
    total: 727000,
    code: "TC-2419",
    customerName: "Cliente de ejemplo",
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem] xl:items-start">
      <div className="space-y-4">
        <Panel
          title="Contacto"
          description="Estos datos aparecen en el pie de página y en la página de contacto."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre de la tienda">
              <Input
                value={draft.storeName}
                onChange={(e) => set("storeName", e.target.value)}
              />
            </Field>

            <Field
              label="WhatsApp"
              hint="Con código de país, sin + ni espacios. Ej: 5491123389725."
            >
              <Input
                value={draft.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                className="numeric"
                inputMode="numeric"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>

            <Field label="Ubicación">
              <Input
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>

            <Field label="Instagram" hint="Sin el arroba.">
              <Input
                value={draft.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </Field>

            <Field label="TikTok" hint="Sin el arroba.">
              <Input
                value={draft.tiktok}
                onChange={(e) => set("tiktok", e.target.value)}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Envíos">
          <Field
            label="Envío sin cargo desde"
            hint="Se muestra en la ficha de producto, en el carrito y en la portada."
          >
            <Input
              type="number"
              min={0}
              value={draft.freeShippingFrom}
              onChange={(e) =>
                set("freeShippingFrom", Math.max(0, Number(e.target.value)))
              }
              className="max-w-48 numeric"
            />
          </Field>
        </Panel>

        <ErrorNote>{error}</ErrorNote>

        <Button onClick={save} disabled={pending} size="lg">
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : saved ? (
            <Check />
          ) : (
            <Save />
          )}
          {saved ? "Guardado" : "Guardar ajustes"}
        </Button>
      </div>

      <Panel
        title="Así llega el pedido"
        description="Mensaje de ejemplo con dos productos."
        className="xl:sticky xl:top-6"
      >
        <pre className="whitespace-pre-wrap rounded-xl border border-champagne/8 bg-champagne/[0.02] p-4 numeric text-[0.6875rem] leading-relaxed text-mist">
          {preview}
        </pre>

        <a
          href={whatsappUrl(draft.whatsappNumber, preview)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-[0.8125rem] text-sand transition-colors hover:text-cream"
        >
          Probar el link de WhatsApp
        </a>

        <p className="mt-3 text-center numeric text-[0.625rem] text-ash">
          wa.me/{normalizePhone(draft.whatsappNumber)}
        </p>
      </Panel>
    </div>
  );
}
