import { cn } from "@/lib/utils";

type TagLabelProps = {
  tag: string;
  className?: string;
};

/** Renders `#tag` with forced LTR so `#` stays before the slug in RTL layouts. */
export function TagLabel({ tag, className }: TagLabelProps) {
  return (
    <span
      dir="ltr"
      className={cn("inline-block [unicode-bidi:isolate]", className)}
    >
      #{tag}
    </span>
  );
}
