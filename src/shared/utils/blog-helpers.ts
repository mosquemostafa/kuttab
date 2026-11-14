/**
 * Strips HTML tags and collapses whitespace to clean plain text.
 */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates estimated reading time in minutes from content (HTML or plain text).
 * Default rate: 200 words per minute. Minimum returned is 1 minute.
 */
export function calculateReadingMinutes(
  content: string,
  wordsPerMinute = 200,
): number {
  const plainText = stripHtml(content);
  if (!plainText) return 1;

  // Split by whitespace to approximate word count across Latin and non-Latin scripts
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Extracts a clean excerpt from content up to `maxLength` characters.
 */
export function generateExcerpt(content: string, maxLength = 250): string {
  const plainText = stripHtml(content);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.slice(0, maxLength).trim()}...`;
}

/**
 * Generates a URL-friendly slug from a title string.
 * Supports Latin and Arabic unicode letters.
 */
