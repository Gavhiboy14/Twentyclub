"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { Dialog, SheetContent, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/controls";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import type { Brand } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SearchDialog } from "./search-dialog";

export interface NavLink {
  label: string;
  href: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Barra flotante.
 *
 * Siempre despegada del borde y siempre de vidrio: es una cápsula que viaja
 * por encima del contenido, no un techo pegado a la ventana. Al scrollear no
 * cambia de naturaleza, se densifica —se angosta, opaca el vidrio y suma
 * sombra—, que es el mínimo necesario para que se entienda que hay contenido
 * pasando por debajo.
 *
 * "Productos" es el único ítem que no es un link: agrupa las marcas en un
 * desplegable —dropdown en desktop, acordeón en el menú mobile— para que la
 * barra no compita por ancho cada vez que se suma una marca al catálogo.
 */
export function Navbar({
  links,
  brands,
}: {
  links: NavLink[];
  brands: Brand[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, openCart, hydrated } = useCart();
  const { ids } = useFavorites();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 20));

  useEffect(() => setMenuOpen(false), [pathname]);

  // Ctrl/⌘ + K abre el buscador desde cualquier página.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const productsActive =
    pathname.startsWith("/marca/") || pathname.startsWith("/productos");

  // "Inicio" siempre primero; "Productos" se intercala justo después.
  const [home, ...rest] = links;

  const capsuleRef = useRef<HTMLDivElement>(null);

  /* La cápsula es la pieza que más tiene que sentirse hecha de vidrio: sigue
     al puntero con un brillo redondo, como si la luz real rebotara en ella.
     Va por variables CSS y no por estado de React —`--sx`/`--sy` se escriben
     directo en el nodo— porque un mousemove dispara docenas de eventos por
     segundo y un setState en cada uno recalcularía el árbol entero para
     mover un highlight. */
  function trackPointer(event: React.PointerEvent<HTMLDivElement>) {
    const el = capsuleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--sy", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    el.style.setProperty("--specular-opacity", "1");
  }

  function clearPointer() {
    capsuleRef.current?.style.setProperty("--specular-opacity", "0");
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-5">
        <div
          ref={capsuleRef}
          onPointerMove={trackPointer}
          onPointerLeave={clearPointer}
          className={cn(
            "specular edge-light mx-auto flex items-center gap-4 rounded-full border backdrop-blur-2xl",
            "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled
              ? "max-w-6xl border-champagne/[0.09] bg-graphite/85 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.95)]"
              : "max-w-[80rem] border-champagne/[0.05] bg-graphite/35 shadow-[0_16px_44px_-30px_rgba(0,0,0,0.9)]",
            scrolled ? "px-5 py-3" : "px-5 py-3.5 sm:px-6",
          )}
        >
          <Logo />

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            <NavItem href={home.href} active={isActive(home.href)}>
              {home.label}
            </NavItem>

            <ProductsMenu brands={brands} active={productsActive} />

            {rest.map((link) => (
              <NavItem key={link.href} href={link.href} active={isActive(link.href)}>
                {link.label}
              </NavItem>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar productos"
              className="grid size-10 place-items-center rounded-full text-ash transition-colors duration-300 hover:bg-champagne/[0.07] hover:text-chalk"
            >
              <Search className="size-[1.1rem] stroke-[1.5]" />
            </button>

            <Link
              href="/favoritos"
              aria-label={`Favoritos${ids.length ? ` (${ids.length})` : ""}`}
              className="relative hidden size-10 place-items-center rounded-full text-ash transition-colors duration-300 hover:bg-champagne/[0.07] hover:text-chalk sm:grid"
            >
              <Heart className="size-[1.1rem] stroke-[1.5]" />
              {ids.length > 0 && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-champagne" />
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Abrir carrito${count ? ` (${count} productos)` : ""}`}
              className="relative grid size-10 place-items-center rounded-full text-chalk transition-colors duration-300 hover:bg-champagne/[0.07]"
            >
              <ShoppingBag className="size-[1.1rem] stroke-[1.5]" />
              <AnimatePresence>
                {hydrated && count > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    className="numeric absolute -right-0.5 -top-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-ivory px-1 text-[0.625rem] font-semibold text-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="grid size-10 place-items-center rounded-full text-chalk transition-colors duration-300 hover:bg-champagne/[0.07] lg:hidden"
            >
              <Menu className="size-[1.1rem] stroke-[1.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Menú mobile */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="p-7">
          <div className="flex items-center justify-between">
            <DialogTitle asChild>
              <span>
                <Logo />
              </span>
            </DialogTitle>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="grid size-10 place-items-center rounded-full text-ash transition-colors hover:bg-champagne/[0.07] hover:text-chalk"
            >
              <X className="size-4 stroke-[1.5]" />
            </button>
          </div>

          <nav className="mt-14 flex flex-1 flex-col overflow-y-auto">
            <MobileLink href={home.href} active={isActive(home.href)} delay={0.07}>
              {home.label}
            </MobileLink>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease: EASE }}
            >
              <Accordion type="single" collapsible>
                <AccordionItem value="productos" className="border-b border-champagne/[0.06]">
                  <AccordionTrigger
                    className={cn(
                      "py-5 font-display text-2xl tracking-[-0.03em] transition-colors duration-300",
                      productsActive
                        ? "text-chalk"
                        : "text-mist hover:text-chalk",
                    )}
                  >
                    Productos
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pr-0">
                    <div className="flex flex-col gap-0.5 pb-3">
                      {brands.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/marca/${brand.slug}`}
                          className="rounded-xl px-3 py-2.5 text-[0.9375rem] text-mist transition-colors hover:bg-champagne/[0.05] hover:text-chalk"
                        >
                          {brand.name}
                        </Link>
                      ))}
                      <Link
                        href="/productos"
                        className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-chalk transition-colors hover:bg-champagne/[0.05]"
                      >
                        Ver todo
                        <ArrowRight className="size-3.5 stroke-[1.5]" />
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>

            {rest.map((link, i) => (
              <MobileLink
                key={link.href}
                href={link.href}
                active={isActive(link.href)}
                delay={0.17 + i * 0.05}
              >
                {link.label}
              </MobileLink>
            ))}
          </nav>

          <Link
            href="/favoritos"
            className="mt-auto flex items-center gap-3 rounded-2xl border border-champagne/[0.08] bg-champagne/[0.03] px-5 py-4 text-sm text-mist transition-colors hover:text-chalk"
          >
            <Heart className="size-4 stroke-[1.5]" />
            Mis favoritos
            {ids.length > 0 && (
              <span className="numeric ml-auto text-xs text-champagne">
                {ids.length}
              </span>
            )}
          </Link>
        </SheetContent>
      </Dialog>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-full px-4 py-2 text-[0.8125rem] transition-colors duration-400",
        active ? "text-chalk" : "text-ash hover:bg-champagne/[0.05] hover:text-chalk",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-full bg-champagne/[0.08]"
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
      )}
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  active,
  delay,
  children,
}: {
  href: string;
  active: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: EASE }}
    >
      <Link
        href={href}
        className={cn(
          "block border-b border-champagne/[0.06] py-5 font-display text-2xl tracking-[-0.03em] transition-colors duration-300",
          active ? "text-chalk" : "text-mist hover:text-chalk",
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

/**
 * Desplegable de marcas para desktop.
 *
 * Deliberadamente no usa Radix DropdownMenu: ese primitivo posiciona su
 * `Content` con un `transform` propio (para esquivar los bordes de pantalla),
 * y animar `transform` en el mismo elemento le pisaría esa posición durante
 * la transición. Acá el `motion.div` sólo anima opacidad/escala; la posición
 * la da el `absolute` normal del panel respecto al trigger.
 */
function ProductsMenu({ brands, active }: { brands: Brand[]; active: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.8125rem] transition-colors duration-400",
          active || open
            ? "text-chalk"
            : "text-ash hover:bg-champagne/[0.05] hover:text-chalk",
        )}
      >
        {(active || open) && !open && (
          <motion.span
            layoutId="nav-active"
            className="absolute inset-0 -z-10 rounded-full bg-champagne/[0.08]"
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          />
        )}
        Productos
        <ChevronDown
          className={cn(
            "size-3 stroke-[2.5] transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="glass-strong grain edge-light absolute left-0 top-[calc(100%+0.75rem)] w-56 origin-top rounded-[1.5rem] p-2.5"
          >
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/marca/${brand.slug}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-[0.8125rem] text-mist transition-colors hover:bg-champagne/[0.06] hover:text-chalk"
              >
                {brand.name}
              </Link>
            ))}
            <div className="mt-1 border-t border-champagne/[0.06] pt-1">
              <Link
                href="/productos"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[0.8125rem] font-medium text-chalk transition-colors hover:bg-champagne/[0.06]"
              >
                Ver todo
                <ArrowRight className="size-3.5 stroke-[1.5]" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
