import { readDb } from "@/lib/data/store";
import { getAllProducts } from "@/lib/data/queries";
import { PageHeader, Panel } from "@/components/admin/ui";
import {
  CollectionManager,
  type Entry,
  type FieldSpec,
} from "@/components/admin/collection-manager";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Ofertas" };
export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const [db, products] = await Promise.all([readDb(), getAllProducts()]);

  const options = products.map((p) => ({
    value: p.id,
    label: `${p.brand.name} ${p.name}`,
  }));

  const fields: FieldSpec[] = [
    {
      key: "title",
      type: "text",
      label: "Título",
      placeholder: "Selección de invierno",
    },
    { key: "description", type: "textarea", label: "Descripción" },
    {
      key: "discount",
      type: "number",
      label: "Descuento sugerido (%)",
      hint: "Es informativo. El descuento real se carga en cada producto.",
    },
    {
      key: "productIds",
      type: "products",
      label: "Productos incluidos",
      hint: "Marcá los pares que forman parte de la promoción.",
      options,
    },
    { key: "startsAt", type: "date", label: "Empieza" },
    { key: "endsAt", type: "date", label: "Termina" },
    { key: "active", type: "switch", label: "Activa" },
  ];

  const now = Date.now();
  const entries: Entry[] = db.offers.map((offer) => {
    const live =
      offer.active &&
      Date.parse(offer.startsAt) <= now &&
      Date.parse(offer.endsAt) >= now;

    return {
      record: { ...offer },
      card: {
        badges: [
          {
            label: live ? "En curso" : offer.active ? "Programada" : "Apagada",
            variant: live ? ("ok" as const) : ("neutral" as const),
          },
          { label: `−${offer.discount}%`, variant: "cream" as const },
        ],
        title: offer.title,
        meta: `${formatDate(offer.startsAt)} — ${formatDate(offer.endsAt)} · ${
          offer.productIds.length
        } productos`,
        body: offer.description,
      },
    };
  });

  const discounted = products.filter((p) => p.discount > 0);

  return (
    <>
      <PageHeader
        eyebrow="Promociones"
        title="Ofertas"
        description="Agrupá pares en una promoción con fecha de inicio y fin. El precio tachado sale del descuento de cada producto."
      />

      <div className="mb-6">
        <Panel
          title="Productos con descuento activo"
          description="Lo que hoy se ve en /ofertas."
        >
          {discounted.length === 0 ? (
            <p className="py-6 text-center text-sm text-ash">
              Ningún producto tiene descuento cargado.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {discounted.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-champagne/8 bg-champagne/[0.02] px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="eyebrow block">{product.brand.name}</span>
                    <span className="block truncate text-[0.8125rem] text-chalk">
                      {product.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <Badge variant="cream">−{product.discount}%</Badge>
                    <span className="mt-1 block numeric text-[0.625rem] text-ash">
                      {formatPrice(product.finalPrice)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <CollectionManager
        collection="offers"
        entries={entries}
        fields={fields}
        singular="Oferta"
        plural="Ofertas"
        defaults={{
          title: "",
          description: "",
          discount: 15,
          productIds: [],
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          active: true,
        }}
      />
    </>
  );
}
