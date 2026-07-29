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

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [brands, settings] = await Promise.all([getBrands(), getSettings()]);

  /* Las marcas ya no van sueltas acá: viven todas dentro del desplegable
     "Productos" de la barra, así que la barra no compite por ancho a medida
     que se suman marcas nuevas. */
  const links: NavLink[] = [
    { label: "Inicio", href: "/" },
    { label: "Guía de talles", href: "/guia-de-talles" },
    { label: "Contacto", href: "/contacto" },
  ];

  return (
    <SiteProviders>
      <SiteBackground />
      <Navbar links={links} brands={brands} />
      <main id="contenido" className="pt-20">
        {children}
      </main>
      <Footer brands={brands} settings={settings} />
      <CartDrawer />
    </SiteProviders>
  );
}
