"use client";

import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  labels?: {
    asc?: string;
    desc?: string;
    hide?: string;
  };
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  labels = {
    asc: "Asc",
    desc: "Desc",
    hide: "Hide",
  },
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn("text-xs font-medium", className)}>{title}</div>;
  }

  const isSorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2 h-8 px-2 text-xs font-medium data-[state=open]:bg-accent hover:bg-accent/60"
          >
            <span>{title}</span>
            {isSorted === "desc" ? (
              <ArrowDown className="ms-1 h-3.5 w-3.5" />
            ) : isSorted === "asc" ? (
              <ArrowUp className="ms-1 h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="ms-1 h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="me-2 h-3.5 w-3.5 text-muted-foreground/70" />
                {labels.asc}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="me-2 h-3.5 w-3.5 text-muted-foreground/70" />
                {labels.desc}
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && (
            <DropdownMenuSeparator />
          )}
          {column.getCanHide() && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="me-2 h-3.5 w-3.5 text-muted-foreground/70" />
              {labels.hide}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
