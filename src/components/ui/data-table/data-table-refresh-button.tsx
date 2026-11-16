"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataTableRefreshButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
> {
  onRefresh: () => Promise<unknown> | void;
  isRefreshing?: boolean;
  label?: string;
  showLabel?: boolean;
  minSpinDuration?: number;
}

export function DataTableRefreshButton({
  onRefresh,
  isRefreshing = false,
  label = "Refresh",
  showLabel = true,
  minSpinDuration = 600,
  className,
  variant = "secondary",
  size = "default",
  ...props
}: DataTableRefreshButtonProps) {
  const [isLocalSpinning, setIsLocalSpinning] = useState(false);

  const isSpinning = isLocalSpinning || isRefreshing;

  const handleClick = async () => {
    if (isSpinning) return;

    setIsLocalSpinning(true);
    const start = Date.now();

    try {
      await onRefresh();
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minSpinDuration - elapsed);
      setTimeout(() => {
        setIsLocalSpinning(false);
      }, remaining);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isSpinning}
      onClick={handleClick}
      className={cn(
        "cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-2",
        className,
      )}
      aria-label={label}
      {...props}
    >
      <RefreshCw
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-500",
          isSpinning && "animate-spin text-primary",
        )}
      />
      {showLabel && label ? <span>{label}</span> : null}
    </Button>
  );
}
