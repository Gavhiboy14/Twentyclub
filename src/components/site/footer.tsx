import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import type { Brand, Settings } from "@/lib/types";
import { Logo } from "./logo";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./social-icons";
import { normalizePhone } from "@/lib/whatsapp";

const TIENDA = [
  { label: "Toda la colección", href: "/productos" },
  { label: "Nuevos ingresos", href: "/productos?orden=nuevos" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Favoritos", href: "/favoritos" },
];

const AYUDA = [
  { label: "Guía de talles", href: "/guia-de-talles" },
  { label: "Cómo comprar", href: "/contacto#como-comprar" },
  { label: "Envíos", href: "/contacto#envios" },
  { label: "Cambios", href: "/contacto#cambios" },
  { label: "Contacto", href: "/contacto" },
];

export function Footer({
  brands,
  settings,
}: {
  brands: Brand[];
  settings: Settings;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-40 border-t border-champagne/[0.06]">
      <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm space-y-5">
            <Logo />
            <p className="text-sm leading-relaxed text-ash">
              Zapatillas originales de nueve marcas, elegidas de a una. Comprás
              por acá y cerrás el pedido por WhatsApp, hablando con una persona.
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Twenty Club"
                className="glass grid size-10 place-items-center rounded-full text-ash transition-colors hover:text-chalk"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href={`https://tiktok.com/@${settings.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok de Twenty Club"
                className="glass grid size-10 place-items-center rounded-full text-ash transition-colors hover:text-chalk"
              >
                <TikTokIcon className="size-4" />
              </a>
              <a
                href={`https://wa.me/${normalizePhone(settings.whatsappNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escribinos por WhatsApp"
                className="glass grid size-10 place-items-center rounded-full text-ash transition-colors hover:text-chalk"
              >
                <WhatsAppIcon className="size-4" />
              </a>
            </div>
          </div>

          <FooterColumn title="Marcas">
            {brands.map((brand) => (
              <FooterLink key={brand.id} href={`/marca/${brand.slug}`}>
                {brand.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Tienda">
            {TIENDA.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Ayuda">
            {AYUDA.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
            <li className="pt-3">
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-2 text-[0.8125rem] text-ash transition-colors hover:text-chalk"
              >
                <Mail className="size-3.5" />
                {settings.email}
              </a>
            </li>
            <li>
              <span className="flex items-center gap-2 text-[0.8125rem] text-ash">
                <MapPin className="size-3.5" />
                {settings.address}
              </span>
            </li>
          </FooterColumn>
        </div>

        {/* Marca denominativa a sangre — cierra la página */}
        <div
          aria-hidden
          className="mt-24 select-none overflow-hidden border-t border-champagne/[0.06] pt-14"
        >
          <p className="display-xl bg-linear-to-b from-champagne/[0.09] to-transparent bg-clip-text text-[clamp(3rem,15vw,11rem)] text-transparent">
            TWENTY CLUB
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-xs text-ash sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Twenty Club. Todos los derechos reservados.</p>
          <p className="numeric uppercase tracking-[0.18em]">
            Buenos Aires · Envíos a todo el país
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="eyebrow mb-4">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-[0.8125rem] text-ash transition-colors duration-200 hover:text-chalk"
      >
        {children}
      </Link>
    </li>
  );
}
