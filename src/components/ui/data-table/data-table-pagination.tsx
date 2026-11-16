"use client";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  itemCount?: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
  summaryLabel?: string;
  className?: string;
}

export function DataTablePagination({
  page,
  totalPages,
  totalCount,
  itemCount,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
  previousAriaLabel = "Go to previous page",
  nextAriaLabel = "Go to next page",
  summaryLabel,
  className,
}: DataTablePaginationProps) {
  if (totalPages <= 1 && totalCount === undefined) {
    return null;
  }

  const pageNumbers: number[] = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, page + 2);

  if (endPage - startPage < maxPagesToShow - 1) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4 py-1 ${className ?? ""}`}
    >
      {/* Summary label */}
      {summaryLabel ? (
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          {summaryLabel}
        </div>
      ) : totalCount !== undefined && itemCount !== undefined ? (
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          {itemCount} / {totalCount}
        </div>
      ) : (
        <div className="order-2 sm:order-1" />
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center">
          <Pagination>
            {/* Mobile Compact Pagination (< sm) */}
            <div className="flex sm:hidden items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="text-xs"
              >
                {previousLabel}
              </Button>
              <span className="text-xs text-muted-foreground font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="text-xs"
              >
                {nextLabel}
              </Button>
            </div>

            {/* Desktop Full Pagination (>= sm) */}
            <PaginationContent className="hidden sm:flex">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : 0}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  text={previousLabel}
                  ariaLabel={previousAriaLabel}
                />
              </PaginationItem>

              {startPage > 1 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      className="cursor-pointer"
                      onClick={() => onPageChange(1)}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {startPage > 2 && <PaginationEllipsis />}
                </>
              )}

              {pageNumbers.map((pNum) => (
                <PaginationItem key={pNum}>
                  <PaginationLink
                    isActive={pNum === page}
                    className="cursor-pointer"
                    onClick={() => onPageChange(pNum)}
                  >
                    {pNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <PaginationEllipsis />}
                  <PaginationItem>
                    <PaginationLink
                      className="cursor-pointer"
                      onClick={() => onPageChange(totalPages)}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  tabIndex={page >= totalPages ? -1 : 0}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  text={nextLabel}
                  ariaLabel={nextAriaLabel}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
