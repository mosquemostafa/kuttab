"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { TagLabel } from "@/components/ui/hash-tag-label";

type AssetTagsProps = {
  tags: string[];
  maxVisible?: number;
};

export function AssetTags({ tags, maxVisible = 4 }: AssetTagsProps) {
  const t = useTranslations("contentAssets");

  if (tags.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("tags.noTags")}</p>;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = Math.max(0, tags.length - maxVisible);

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          <TagLabel tag={tag} />
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount}
        </Badge>
      ) : null}
    </div>
  );
}
