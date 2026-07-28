import type { Metadata } from "next";
import { FavoritesList } from "@/components/product/favorites-list";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Los pares que guardaste en Twenty Club.",
  robots: { index: false, follow: true },
};

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
      <FavoritesList />
    </div>
  );
}
