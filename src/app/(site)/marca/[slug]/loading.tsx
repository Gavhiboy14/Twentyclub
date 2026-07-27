import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <header className="mx-auto max-w-[86rem] space-y-5 px-5 pb-14 pt-16 sm:px-8 lg:pb-20 lg:pt-24">
        <Skeleton className="h-2.5 w-16 rounded-full" />
        <Skeleton className="h-20 w-96 max-w-full rounded-3xl" />
        <Skeleton className="h-4 w-[28rem] max-w-full rounded-full" />
      </header>

      <div className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
          <div className="hidden space-y-8 lg:block">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-2.5 w-20 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-3/5 rounded-full" />
              </div>
            ))}
          </div>
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
