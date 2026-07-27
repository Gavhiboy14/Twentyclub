"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useFavorites } from "@/store/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  label,
  className,
}: {
  productId: string;
  label: string;
  className?: string;
}) {
  const { has, toggle, hydrated } = useFavorites();
  const active = hydrated && has(productId);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.82 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={active}
      aria-label={
        active ? `Quitar ${label} de favoritos` : `Guardar ${label} en favoritos`
      }
      className={cn(
        "glass grid size-10 place-items-center rounded-full transition-colors duration-300",
        active
          ? "border-champagne/40 text-sand"
          : "text-ash hover:text-chalk",
        className,
      )}
    >
      <Heart
        className={cn("size-4 transition-all duration-300", active && "fill-current")}
      />
    </motion.button>
  );
}
