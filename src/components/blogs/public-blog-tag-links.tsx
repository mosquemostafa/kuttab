import { TagLabel } from "@/components/ui/hash-tag-label";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type PublicBlogTagLinksProps = {
  tags: string[];
  className?: string;
  linkClassName?: string;
  /** Base path for tag filter links (e.g. `/blogs` or `/dashboard/blogs`). */
  tagListBasePath?: string;
};

export function PublicBlogTagLinks({
  tags,
  className,
  linkClassName,
  tagListBasePath = "/blogs",
}: PublicBlogTagLinksProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}
    >
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`${tagListBasePath}?tag=${encodeURIComponent(tag)}`}
          className={cn(
            /* Same hover underline pattern as blog list card title link */
            "text-sm font-medium text-muted-foreground decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:underline",
            linkClassName,
          )}
        >
          <TagLabel tag={tag} className="inline" />
        </Link>
      ))}
    </div>
  );
}
