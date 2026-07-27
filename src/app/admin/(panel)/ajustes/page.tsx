import { getSettings } from "@/lib/data/queries";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Ajustes de la tienda"
        description="El número de WhatsApp que ponés acá es el que recibe todos los pedidos."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
