import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data/queries";
import { FavoritesList } from "@/components/product/favorites-list";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Los pares que guardaste en Twenty Club.",
  robots: { index: false, follow: true },
};

export default async function FavoritesPage() {
  const catalog = await getAllProducts();

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
      <FavoritesList catalog={catalog} />
    </div>
  );
}
