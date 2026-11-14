"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";

import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toLocaleUpperCase();
  }
  const a = parts[0][0] ?? "";
  const b = parts[parts.length - 1][0] ?? "";
  return `${a}${b}`.toLocaleUpperCase();
}

type BlogAuthorAvatarProps = {
  name: string;
  imageUrl: string | null | undefined;
  className?: string;
};

export function BlogAuthorAvatar({
  name,
  imageUrl,
  className,
}: BlogAuthorAvatarProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = imageUrl?.trim() ?? "";
  const showImage = Boolean(trimmed) && !failed;
  const initials = useMemo(() => initialsFromName(name), [name]);

  if (showImage) {
    return (
      <div
        className={cn(
          "relative size-12 shrink-0 overflow-hidden rounded-full border border-border/80 md:size-14",
          className,
        )}
      >
        <Image
          src={trimmed}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  if (initials !== "?" && initials.length > 0) {
    return (
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted text-sm font-semibold text-muted-foreground md:size-14 md:text-base",
          className,
        )}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted text-muted-foreground md:size-14",
        className,
      )}
      aria-hidden
    >
      <User className="size-6 md:size-7" />
    </div>
  );
}
