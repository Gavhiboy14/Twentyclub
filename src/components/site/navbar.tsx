"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Dialog, SheetContent, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SearchDialog } from "./search-dialog";

export interface NavLink {
  label: string;
  href: string;
}

/**
 * Barra flotante.
 *
 * Siempre despegada del borde y siempre de vidrio: es una cápsula que viaja
 * por encima del contenido, no un techo pegado a la ventana. Al scrollear no
 * cambia de naturaleza, se densifica —se angosta, opaca el vidrio y suma
 * sombra—, que es el mínimo necesario para que se entienda que hay contenido
 * pasando por debajo.
 */
export function Navbar({ links }: { links: NavLink[] }) {
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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-5">
        <div
          className={cn(
            "mx-auto flex items-center gap-4 rounded-full border backdrop-blur-2xl",
            "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled
              ? "max-w-6xl border-champagne/[0.09] bg-graphite/85 px-5 py-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.95)]"
              : "max-w-[80rem] border-champagne/[0.05] bg-graphite/35 px-5 py-3.5 shadow-[0_16px_44px_-30px_rgba(0,0,0,0.9)] sm:px-6",
          )}
        >
          <Logo />

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[0.8125rem] transition-colors duration-400",
                  isActive(link.href)
                    ? "text-chalk"
                    : "text-ash hover:bg-champagne/[0.05] hover:text-chalk",
                )}
              >
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-champagne/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                {link.label}
              </Link>
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

          <nav className="mt-14 flex flex-col">
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.07 + i * 0.05,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "block border-b border-champagne/[0.06] py-5 font-display text-2xl tracking-[-0.03em] transition-colors duration-300",
                    isActive(link.href)
                      ? "text-chalk"
                      : "text-mist hover:text-chalk",
                  )}
                >
                  {link.label}
                </Link>
              </motion.div>
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
