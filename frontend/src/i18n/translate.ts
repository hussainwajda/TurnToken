import type { Locale } from "./config";
import { MESSAGES, type MessageKey } from "./messages";

export type { MessageKey };

export type TParams = Record<string, string | number>;
export type TFunction = (key: MessageKey, params?: TParams) => string;

/** Builds a `t()` for one locale. `{name}` placeholders are filled from
 * `params`; a translation left empty falls back to English. */
export function makeT(locale: Locale): TFunction {
  return (key, params) => {
    const entry = MESSAGES[key];
    const template = entry[locale] || entry.en;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  };
}

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-IN-u-nu-latn",
  hi: "hi-IN-u-nu-latn",
  mr: "mr-IN-u-nu-latn",
};

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}
