import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("tc-skeleton rounded-2xl", className)}
      {...props}
    />
  );
}

/** Placeholder de tarjeta de producto, con la misma métrica que la real. */
export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-[1.75rem] p-3">
      <Skeleton className="aspect-square w-full rounded-[1.15rem]" />
      <div className="space-y-2.5 px-2 pb-1 pt-4">
        <Skeleton className="h-2.5 w-16 rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
