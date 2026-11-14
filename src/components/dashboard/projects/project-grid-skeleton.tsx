"use client";

import { Skeleton } from "@/components/ui/skeleton";

const TILE_COUNT = 10;

export function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: TILE_COUNT }).map((_, index) => (
        <div key={index} className="flex flex-col items-center p-2">
          <Skeleton className="aspect-[1/0.92] w-full max-w-[104px] rounded-lg" />
          <div className="mt-3 flex w-full max-w-[200px] gap-1">
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
