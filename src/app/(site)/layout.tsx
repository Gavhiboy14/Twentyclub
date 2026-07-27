import { getBrands, getSettings } from "@/lib/data/queries";
import { SiteProviders } from "@/components/site/providers";
import { SiteBackground } from "@/components/site/site-background";
import { Navbar, type NavLink } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";

/**
 * Todo el catálogo sale del store, que el panel modifica en caliente. Si las
 * páginas se prerenderizaran, un cambio de precio o de stock no se vería hasta
 * el próximo build.
 */
export const dynamic = "force-dynamic";

/** Las cinco marcas que van fijas en la barra; el resto vive en /productos. */
const NAV_BRANDS = ["nike", "adidas", "new-balance", "puma", "jordan"];

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [brands, settings] = await Promise.all([getBrands(), getSettings()]);

  const links: NavLink[] = [
    { label: "Inicio", href: "/" },
    ...NAV_BRANDS.map((slug) => {
      const brand = brands.find((b) => b.slug === slug);
      return { label: brand?.name ?? slug, href: `/marca/${slug}` };
    }),
    { label: "Ofertas", href: "/ofertas" },
    { label: "Contacto", href: "/contacto" },
  ];

  return (
    <SiteProviders>
      <SiteBackground />
      <Navbar links={links} />
      <main id="contenido" className="pt-20">
        {children}
      </main>
      <Footer brands={brands} settings={settings} />
      <CartDrawer />
    </SiteProviders>
  );
}
