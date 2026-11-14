/** Unicode LTR mark — use before `#tag` in plain strings (metadata, etc.) for correct bidi in RTL. */
const LTR_EMBED = "\u200e";

/** Plain-string tags with LTR embedding (browser tab titles, serialized text). */
export function ltrTagString(tag: string): string {
  return `${LTR_EMBED}#${tag}`;
}
