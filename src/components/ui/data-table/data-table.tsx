"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type OnChangeFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Inbox } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSkeleton } from "./data-table-skeleton";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isHydrated?: boolean;
  toolbar?: React.ReactNode;
  renderMobileCard?: (item: TData, index: number) => React.ReactNode;
  // Server-side / controlled pagination
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  paginationLabels?: {
    previous?: string;
    next?: string;
    previousAria?: string;
    nextAria?: string;
    summary?: string;
  };
  // Sorting
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  // Column Visibility
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  // Empty State
  emptyMessage?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  // Styling
  containerClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  borderClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  isHydrated = true,
  toolbar,
  renderMobileCard,
  page,
  totalPages,
  totalCount,
  onPageChange,
  paginationLabels,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange: controlledOnVisibilityChange,
  emptyMessage = "No results found.",
  emptyIcon,
  containerClassName = "space-y-4",
  tableClassName = "text-sm",
  headerClassName = "bg-muted sticky top-0 z-10",
  borderClassName = "rounded-lg border-muted border-2",
}: DataTableProps<TData, TValue>) {
  // Internal state when not controlled externally
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    [],
  );
  const [internalVisibility, setInternalVisibility] =
    React.useState<VisibilityState>({});
  const [internalFilters, setInternalFilters] =
    React.useState<ColumnFiltersState>([]);

  const isServerPagination = typeof onPageChange === "function";
  const sorting = controlledSorting ?? internalSorting;
  const onSortingChange = controlledOnSortingChange ?? setInternalSorting;
  const columnVisibility = controlledVisibility ?? internalVisibility;
  const onColumnVisibilityChange =
    controlledOnVisibilityChange ?? setInternalVisibility;

  // Set up TanStack Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters: internalFilters,
    },
    manualPagination: isServerPagination,
    manualSorting: Boolean(controlledSorting && controlledOnSortingChange),
    pageCount: totalPages ?? -1,
    onSortingChange,
    onColumnVisibilityChange,
    onColumnFiltersChange: setInternalFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isServerPagination
      ? undefined
      : getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;
  const showMobileCards = Boolean(renderMobileCard);

  // If initial load or unhydrated, show skeletons
  if (!isHydrated || (isLoading && !hasRows)) {
    return (
      <div className={containerClassName}>
        {toolbar}
        <DataTableSkeleton
          columnCount={columns.length}
          renderMobileCards={showMobileCards}
        />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {/* Top Toolbar (Filters, Search, Action Buttons) */}
      {toolbar}

      {/* Loading bar or indicator during background revalidation */}
      {isLoading && hasRows && (
        <div className="py-1 text-center text-xs text-muted-foreground animate-pulse">
          …
        </div>
      )}

      {/* Empty State */}
      {!hasRows && !isLoading && (
        <div className="text-center py-12 px-4 border rounded-xl bg-card text-muted-foreground space-y-2">
          {emptyIcon ?? (
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50" />
          )}
          <div className="text-sm font-medium">{emptyMessage}</div>
        </div>
      )}

      {/* Mobile Card View (< md) if renderMobileCard is provided */}
      {hasRows && showMobileCards && (
        <div className="md:hidden space-y-3">
          {rows.map((row, index) => (
            <React.Fragment key={row.id}>
              {renderMobileCard!(row.original, index)}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Desktop Table View (>= md, or full width if no mobile card renderer) */}
      {hasRows && (
        <div
          className={`${
            showMobileCards ? "hidden md:block" : "block"
          } overflow-x-auto ${borderClassName}`}
        >
          <Table className={tableClassName}>
            <TableHeader className={headerClassName}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="px-4 py-3 text-xs font-medium text-muted-foreground"
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {(hasRows || (totalPages !== undefined && totalPages > 1)) && (
        <>
          {isServerPagination &&
          page !== undefined &&
          totalPages !== undefined ? (
            <DataTablePagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              itemCount={rows.length}
              onPageChange={onPageChange}
              previousLabel={paginationLabels?.previous}
              nextLabel={paginationLabels?.next}
              previousAriaLabel={paginationLabels?.previousAria}
              nextAriaLabel={paginationLabels?.nextAria}
              summaryLabel={paginationLabels?.summary}
            />
          ) : !isServerPagination && table.getPageCount() > 1 ? (
            <DataTablePagination
              page={table.getState().pagination.pageIndex + 1}
              totalPages={table.getPageCount()}
              totalCount={table.getFilteredRowModel().rows.length}
              itemCount={rows.length}
              onPageChange={(p) => table.setPageIndex(p - 1)}
              previousLabel={paginationLabels?.previous}
              nextLabel={paginationLabels?.next}
              previousAriaLabel={paginationLabels?.previousAria}
              nextAriaLabel={paginationLabels?.nextAria}
              summaryLabel={paginationLabels?.summary}
            />
          ) : paginationLabels?.summary ? (
            <div className="px-4 py-1 text-xs text-muted-foreground">
              {paginationLabels.summary}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
