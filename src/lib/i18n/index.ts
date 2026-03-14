import en from "./en";
import hi from "./hi";
import mr from "./mr";
import type { Locale } from "./types";
import type { Translations } from "./en";

export { type Locale, type Translations };
export { LOCALES, DEFAULT_LOCALE } from "./types";

const dictionaries: Record<Locale, Translations> = { en, hi, mr };

export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale] ?? dictionaries.en;
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
