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
    <div className="mx-auto max-w-[86rem] px-5 py-20 sm:px-8 lg:py-28">
      <FavoritesList catalog={catalog} />
    </div>
  );
}
