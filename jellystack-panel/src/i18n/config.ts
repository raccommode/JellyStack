/**
 * Panel internationalization configuration.
 *
 * To add a new language:
 *   1. Create `messages/<code>.json` by copying `en.json` and translating values.
 *   2. Add the code to `locales` below (alphabetical order, keep `en` first).
 *   3. Add a matching entry to `localeNames` for the language switcher.
 *
 * See `messages/README.md` for the full guide.
 */

export const defaultLocale = "en" as const;

export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  fr: { native: "Français", flag: "🇫🇷" },
};

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
