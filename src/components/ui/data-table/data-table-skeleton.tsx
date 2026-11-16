"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  renderMobileCards?: boolean;
  className?: string;
}

export function DataTableSkeleton({
  columnCount = 6,
  rowCount = 4,
  renderMobileCards = false,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {/* Mobile Card Skeletons */}
      {renderMobileCards && (
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/80 bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table Skeletons */}
      <div
        className={`${
          renderMobileCards ? "hidden md:block" : "block"
        } overflow-x-auto rounded-lg border-muted border-2`}
      >
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell key={colIndex} className="px-4 py-3">
                    <Skeleton
                      className={`h-4 ${
                        colIndex === 1
                          ? "w-36"
                          : colIndex === 0
                            ? "w-8"
                            : "w-20"
                      }`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
