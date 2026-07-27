import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 lg:py-20">
      <Skeleton className="mb-8 h-3 w-52 rounded-full" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-[1.75rem]" />
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-square w-20 rounded-2xl sm:w-24" />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-12 w-72 max-w-full rounded-2xl" />
            <Skeleton className="h-8 w-40 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-3 w-28 rounded-full" />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-14 w-36 rounded-full" />
            <Skeleton className="h-14 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
