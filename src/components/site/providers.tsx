"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/store/cart";
import { FavoritesProvider } from "@/store/favorites";
import { RecentProvider } from "@/store/recent";

export function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>
        <RecentProvider>{children}</RecentProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}
