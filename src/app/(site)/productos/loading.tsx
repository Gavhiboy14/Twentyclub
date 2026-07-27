import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
      <div className="mb-12 space-y-4">
        <Skeleton className="h-2.5 w-24 rounded-full" />
        <Skeleton className="h-14 w-80 max-w-full rounded-2xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
        <div className="hidden space-y-8 lg:block">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-2.5 w-20 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
              <Skeleton className="h-4 w-3/5 rounded-full" />
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className="mb-8 flex items-center justify-between">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-10 w-44 rounded-full" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
