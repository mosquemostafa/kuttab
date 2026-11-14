/**
 * Tint color keys and helpers. Actual hex values live in `src/app/globals.css`
 * (`--db-*`, `[data-finder-tint]`) and are exposed as Tailwind via `@theme`
 * (`bg-db-red`, `text-db-red-ink`, …).
 *
 * `null` in the DB means “use theme surface” (no pastel fill on sticky notes).
 */

// ─── Keys & types ───────────────────────────────────────────────────────────

export const COLOR_KEYS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "darkBlue",
  "purple",
  "pink",
  "brown",
  "gray",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

/** Select / form sentinel for “no project color” (not a `ColorKey`). */
export const PROJECT_COLOR_NONE = "__none__" as const;

/**
 * Row/API string → tint or `null` (no tint). Legacy `"surface"`, unknown, and
 * empty values normalize to `null`.
 */
export function parseStoredTintColorKey(
  raw: string | null | undefined,
): ColorKey | null {
  if (raw == null || raw === "") return null;
  if (raw === "surface") return null;
  if (!isColorKey(raw)) return null;
  return raw;
}

export function isColorKey(value: string): value is ColorKey {
  return (COLOR_KEYS as readonly string[]).includes(value);
}

/** Project create/edit: `raw` is the `<Select>` value; `noneSentinel` is `PROJECT_COLOR_NONE`. */
export function parseOptionalColorKeyFromFormValue(
  raw: string,
  noneSentinel: string,
): ColorKey | null {
  if (raw === noneSentinel) return null;
  return isColorKey(raw) ? raw : null;
}

/** When API/storage returns an unknown `colorKey` for a tag. */

/** Sticky note / swatch background utilities (Tailwind `bg-db-*`). */
export const DB_BG_CLASS = {
  red: "bg-db-red",
  orange: "bg-db-orange",
  yellow: "bg-db-yellow",
  green: "bg-db-green",
  teal: "bg-db-teal",
  blue: "bg-db-blue",
  darkBlue: "bg-db-dark-blue",
  purple: "bg-db-purple",
  pink: "bg-db-pink",
  brown: "bg-db-brown",
  gray: "bg-db-gray",
} as const satisfies Record<ColorKey, string>;

/** Sticky note ink / text on tint (`text-db-*-ink`). */
export const DB_NOTE_TEXT_CLASS = {
  red: "text-db-red-ink",
  orange: "text-db-orange-ink",
  yellow: "text-db-yellow-ink",
  green: "text-db-green-ink",
  teal: "text-db-teal-ink",
  blue: "text-db-blue-ink",
  darkBlue: "text-db-dark-blue-ink",
  purple: "text-db-purple-ink",
  pink: "text-db-pink-ink",
  brown: "text-db-brown-ink",
  gray: "text-db-gray-ink",
} as const satisfies Record<ColorKey, string>;

/** Folder icon line color on light surfaces (`text-db-*-ink`). */
const DB_PROJECT_ICON_TEXT_CLASS = DB_NOTE_TEXT_CLASS;

/** Project color `<SelectItem>` dot fill (`bg-db-*` or ink for contrast). */
export const DB_PROJECT_DOT_BG_CLASS = {
  red: "bg-db-red-ink",
  orange: "bg-db-orange-ink",
  yellow: "bg-db-yellow-ink",
  green: "bg-db-green-ink",
  teal: "bg-db-teal-ink",
  blue: "bg-db-blue-ink",
  darkBlue: "bg-db-dark-blue-ink",
  purple: "bg-db-purple-ink",
  pink: "bg-db-pink-ink",
  brown: "bg-db-brown-ink",
  gray: "bg-db-gray",
} as const satisfies Record<ColorKey, string>;

export function projectColorKeyToIconTextClass(
  colorKey: string | null | undefined,
): string | undefined {
  if (!colorKey || !isColorKey(colorKey)) return undefined;
  return DB_PROJECT_ICON_TEXT_CLASS[colorKey];
}

// ─── Sticky note (card + composer) paint ────────────────────────────────────

type StickyNotePaint =
  | { kind: "surface" }
  | { kind: "tint"; colorKey: ColorKey };

export function getStickyNotePaint(
  colorKey: ColorKey | null | undefined,
): StickyNotePaint {
  if (colorKey == null || !isColorKey(colorKey)) return { kind: "surface" };
  return { kind: "tint", colorKey };
}

/** Article / panel outer classes: theme surface vs pastel border. */
export function stickyNoteOuterBorderClasses(isSurface: boolean): string {
  return isSurface
    ? "border-border/60 dark:border-border/50"
    : "border-black/8 dark:border-white/10";
}

/** Horizontal rule under title on sticky toolbar. */
export function stickyNoteToolbarDividerClasses(isSurface: boolean): string {
  return isSurface
    ? "border-border/50"
    : "border-black/10 dark:border-white/15";
}

// ─── Palette grid / select dots (shared UI) ─────────────────────────────────

/** “No tint” swatch in palette grids (dashed ring, no fill). */
export const PALETTE_UNTINTED_SWATCH_BUTTON_CLASS =
  "border-dashed border-muted-foreground/45 bg-muted/70 dark:bg-muted/50";

/** Classes for the round swatch in `PaletteSwatchGrid` (popover). */
export function paletteSwatchButtonBorderClasses(_key: ColorKey): string {
  return "border-border/70";
}

export function paletteSwatchFillClass(key: ColorKey): string {
  return DB_BG_CLASS[key];
}

/**
 * “No project color” swatch: dashed + slash — not a solid/muted gray fill, so it
 * is not confused with the `gray` tint row.
 */

/** Small dot in project color `<SelectItem>` rows. */
