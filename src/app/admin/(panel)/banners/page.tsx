import { readDb } from "@/lib/data/store";
import { PageHeader } from "@/components/admin/ui";
import {
  CollectionManager,
  type Entry,
  type FieldSpec,
} from "@/components/admin/collection-manager";
import type { Banner } from "@/lib/types";

export const metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

const PLACEMENT_LABELS: Record<Banner["placement"], string> = {
  hero: "Hero principal",
  promo: "Promoción",
  secondary: "Banner secundario",
};

const FIELDS: FieldSpec[] = [
  {
    key: "placement",
    type: "select",
    label: "Ubicación",
    hint: "El hero es el bloque grande de la portada. Sólo se muestra el primero activo.",
    options: [
      { value: "hero", label: "Hero principal" },
      { value: "promo", label: "Promoción (portada, mitad de página)" },
      { value: "secondary", label: "Banner secundario" },
    ],
  },
  { key: "eyebrow", type: "text", label: "Antetítulo", placeholder: "Temporada 26" },
  {
    key: "title",
    type: "text",
    label: "Título",
    placeholder: "Tu próximo par empieza acá.",
  },
  { key: "subtitle", type: "textarea", label: "Bajada" },
  {
    key: "image",
    type: "image",
    label: "Imagen",
    hint: "En el hero se usa la foto del par destacado, con fondo transparente si podés.",
  },
  {
    key: "ctaLabel",
    type: "text",
    label: "Texto del botón",
    placeholder: "Explorar colección",
  },
  { key: "ctaHref", type: "text", label: "Link del botón", placeholder: "/productos" },
  {
    key: "active",
    type: "switch",
    label: "Activo",
    hint: "Si lo apagás, deja de mostrarse.",
  },
  { key: "order", type: "number", label: "Orden" },
];

export default async function AdminBannersPage() {
  const db = await readDb();
  const banners = [...db.banners].sort(
    (a, b) => a.placement.localeCompare(b.placement) || a.order - b.order,
  );

  const entries: Entry[] = banners.map((banner) => ({
    record: { ...banner },
    card: {
      cover: banner.image,
      badges: [
        { label: PLACEMENT_LABELS[banner.placement], variant: "neutral" as const },
        {
          label: banner.active ? "Activo" : "Apagado",
          variant: banner.active ? ("ok" as const) : ("bad" as const),
        },
      ],
      eyebrow: banner.eyebrow,
      title: banner.title,
      meta: `${banner.ctaLabel} → ${banner.ctaHref}`,
      body: banner.subtitle,
    },
  }));

  return (
    <>
      <PageHeader
        eyebrow="Portada"
        title="Banners"
        description="Cambiá el hero, las promociones y los banners secundarios sin tocar código."
      />

      <CollectionManager
        collection="banners"
        entries={entries}
        fields={FIELDS}
        singular="Banner"
        plural="Banners"
        defaults={{
          placement: "promo",
          eyebrow: "",
          title: "",
          subtitle: "",
          image: null,
          ctaLabel: "Ver más",
          ctaHref: "/productos",
          active: true,
          order: banners.length,
        }}
      />
    </>
  );
}
