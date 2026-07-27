"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Layers,
  Settings,
  ShoppingCart,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/marcas", label: "Marcas", icon: Tag },
  { href: "/admin/categorias", label: "Categorías", icon: Layers },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/ofertas", label: "Ofertas", icon: Ticket },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-ink">
      {/* Atmósfera contenida: el panel es una herramienta, no una vidriera. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="bloom left-[-10%] top-[-20%] size-[36rem] opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(232,220,196,0.10), transparent 68%)",
          }}
        />
      </div>

      {/* Barra lateral */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-champagne/[0.07] bg-graphite/90 backdrop-blur-xl",
          "transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="grid size-9 place-items-center rounded-full text-ash hover:bg-champagne/8 hover:text-chalk lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="eyebrow px-5 pb-3 pt-2">Administración</p>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.8125rem] transition-colors duration-200",
                  active ? "text-cream" : "text-ash hover:text-chalk",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-active"
                    className="absolute inset-0 -z-10 rounded-xl border border-champagne/25 bg-champagne/12"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-champagne/[0.07] p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.8125rem] text-ash transition-colors hover:text-chalk"
          >
            <ExternalLink className="size-4" />
            Ver la tienda
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.8125rem] text-ash transition-colors hover:bg-bad/10 hover:text-bad"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Contenido */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-champagne/[0.07] bg-ink/80 px-5 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="grid size-10 place-items-center rounded-full text-chalk hover:bg-champagne/8"
          >
            <Menu className="size-5" />
          </button>
          <Logo compact />
          <span className="font-display text-sm font-semibold text-chalk">
            Panel
          </span>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
