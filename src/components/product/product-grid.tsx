"use client";

import type { ProductView } from "@/lib/types";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  priorityCount = 4,
}: {
  products: ProductView[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <Stagger
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, i) => (
        <StaggerItem key={product.id} className="h-full">
          <ProductCard product={product} priority={i < priorityCount} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Rail horizontal: se usa cuando la sección es una selección, no un catálogo. */
export function ProductRail({ products }: { products: ProductView[] }) {
  return (
    <div className="hide-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
      {products.map((product, i) => (
        <div
          key={product.id}
          className="w-[78vw] shrink-0 snap-start sm:w-[20rem] lg:w-[21.5rem]"
        >
          <ProductCard product={product} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}
