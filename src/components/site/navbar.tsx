"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
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

export function Navbar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, openCart, hydrated } = useCart();
  const { ids } = useFavorites();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

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
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled ? "px-3 pt-3 sm:px-5 sm:pt-4" : "px-0 pt-0",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled
              ? "glass-strong max-w-6xl rounded-full px-4 py-2.5 sm:px-5"
              : "max-w-[100rem] border-b border-cream/[0.06] bg-transparent px-4 py-4 sm:px-8",
          )}
        >
          <Logo />

          {/* Navegación principal */}
          <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[0.8125rem] transition-colors duration-300",
                  isActive(link.href)
                    ? "text-cream"
                    : "text-ash hover:text-chalk",
                )}
              >
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-cream/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group hidden items-center gap-2.5 rounded-full border border-cream/8 bg-cream/[0.03] py-2 pl-3.5 pr-2.5 text-[0.8125rem] text-ash transition-colors duration-300 hover:border-cream/16 hover:text-chalk md:flex"
            >
              <Search className="size-3.5" />
              Buscar
              <kbd className="rounded border border-cream/10 bg-cream/5 px-1.5 py-0.5 font-mono text-[0.625rem] text-ash">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar productos"
              className="grid size-10 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk md:hidden"
            >
              <Search className="size-[1.15rem]" />
            </button>

            <Link
              href="/favoritos"
              aria-label={`Favoritos${ids.length ? ` (${ids.length})` : ""}`}
              className="relative hidden size-10 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk sm:grid"
            >
              <Heart className="size-[1.15rem]" />
              {ids.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-cream" />
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Abrir carrito${count ? ` (${count} productos)` : ""}`}
              className="relative grid size-10 place-items-center rounded-full text-chalk transition-colors hover:bg-cream/8"
            >
              <ShoppingBag className="size-[1.15rem]" />
              <AnimatePresence>
                {hydrated && count > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-cream px-1 font-mono text-[0.625rem] font-bold text-cream"
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
              className="grid size-10 place-items-center rounded-full text-chalk transition-colors hover:bg-cream/8 lg:hidden"
            >
              <Menu className="size-[1.15rem]" />
            </button>
          </div>
        </div>
      </header>

      {/* Menú mobile */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="p-6">
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
              className="grid size-10 place-items-center rounded-full text-ash transition-colors hover:bg-cream/8 hover:text-chalk"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="mt-10 flex flex-col">
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + i * 0.045, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "block border-b border-cream/6 py-4 font-display text-2xl font-semibold tracking-tight transition-colors",
                    isActive(link.href) ? "text-cream" : "text-mist hover:text-chalk",
                  )}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <Link
            href="/favoritos"
            className="mt-auto flex items-center gap-3 rounded-2xl border border-cream/8 bg-cream/[0.03] px-4 py-3.5 text-sm text-mist transition-colors hover:text-chalk"
          >
            <Heart className="size-4" />
            Mis favoritos
            {ids.length > 0 && (
              <span className="ml-auto font-mono text-xs text-sand">
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
