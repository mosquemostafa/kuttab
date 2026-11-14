"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export const BLOG_COVER_SIZES = {
  /** Matches blog post cover wrapper: `max-w-5xl` (1024px) + horizontal padding */
  hero: "(max-width: 1024px) calc(100vw - 2rem), 1024px",
  cardGrid:
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 400px",
  contentLibrary: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
} as const;

const DEFAULT_INTRINSIC = { width: 1280, height: 720 } as const;

type BlogCoverImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Passed to `next/image` width/height (not layout pixels); use 16:9 or 16:10 to match the wrapper aspect */
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  wrapperClassName: string;
  imageClassName?: string;
  onLoadError?: () => void;
  fallback: ReactNode;
};

export function BlogCoverImage({
  src,
  alt,
  sizes,
  priority = false,
  intrinsicWidth = DEFAULT_INTRINSIC.width,
  intrinsicHeight = DEFAULT_INTRINSIC.height,
  wrapperClassName,
  imageClassName = "object-cover",
  onLoadError,
  fallback,
}: BlogCoverImageProps) {
  const [broken, setBroken] = useState(false);
  const resolvedSizes =
    typeof sizes === "string" && sizes.trim() !== ""
      ? sizes.trim()
      : BLOG_COVER_SIZES.hero;

  if (!src.trim() || broken) {
    return (
      <div
        className={cn(
          wrapperClassName,
          "flex items-center justify-center text-center",
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <Image
        src={src}
        alt={alt}
        width={intrinsicWidth}
        height={intrinsicHeight}
        sizes={resolvedSizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={cn("absolute inset-0 h-full w-full", imageClassName)}
        draggable={false}
        onError={() => {
          setBroken(true);
          onLoadError?.();
        }}
      />
    </div>
  );
}
