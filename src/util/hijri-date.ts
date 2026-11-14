/**
 * Converts a Gregorian date to a Hijri (Islamic) date string.
 * Uses the Intl.DateTimeFormat API — no external dependencies needed.
 *
 * @param date - The Gregorian Date object to convert (defaults to today)
 * @param locale - BCP 47 locale string (e.g. "ar-SA", "en-SA", "ar-EG")
 * @param options - Optional Intl.DateTimeFormat options to override defaults
 */
function getHijriDate(
  date: Date = new Date(),
  locale: string = "ar-SA",
  options?: Partial<Intl.DateTimeFormatOptions>,
): string {
  return new Intl.DateTimeFormat(locale, {
    calendar: "islamic-umalqura",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

/**
 * Returns both the Gregorian and Hijri formatted date strings.
 */
export function getDualDate(
  date: Date = new Date(),
  gregorianLocale: string = "en-US",
  timeZone?: string,
): { gregorian: string; hijri: string } {
  // Use the language tag from gregorianLocale, but force SA region for Hijri
  const lang = gregorianLocale.split("-")[0]; // "en", "ar", "fr", etc.
  const hijriLocale = `${lang}-SA`; // "en-SA", "ar-SA", etc.

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  if (timeZone) {
    options.timeZone = timeZone;
  }

  const gregorian = new Intl.DateTimeFormat(gregorianLocale, options).format(
    date,
  );

  const hijri = getHijriDate(
    date,
    hijriLocale,
    timeZone ? { timeZone } : undefined,
  );

  return { gregorian, hijri };
}
