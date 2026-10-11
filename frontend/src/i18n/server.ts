import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "./config";
import { makeT } from "./translate";

/** The visitor's language: their saved choice, else their browser's. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

export async function getT() {
  const locale = await getLocale();
  return { t: makeT(locale), locale };
}
