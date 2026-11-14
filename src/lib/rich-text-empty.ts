/** Server- and client-safe: detect empty Markdown rich text (no "use client"). */
export function isRichTextEmpty(value: string): boolean {
  return plainTextFromRichText(value).length === 0;
}

function plainTextFromRichText(value: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";

  // Markdown → text (keep the inner text, drop formatting characters)
  const withoutCodeFences = normalized.replace(
    /```[^\n]*\n([\s\S]*?)```/g,
    " $1 ",
  );
  const withoutInlineCode = withoutCodeFences.replace(/`([^`]+)`/g, "$1");
  const withoutImages = withoutInlineCode.replace(
    /!\[([^\]]*)\]\([^)]*\)/g,
    "$1",
  );
  const withoutLinks = withoutImages.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  const withoutBlockMarkers = withoutLinks
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/gm, "");

  const withoutFormatting = withoutBlockMarkers.replace(
    /(\*\*|__|\*|_|~~|==|\+\+)/g,
    "",
  );

  const withoutNbsp = withoutFormatting
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ");

  return withoutNbsp.replace(/\s+/g, " ").trim();
}
