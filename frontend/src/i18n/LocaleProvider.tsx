"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { intlLocale, makeT, type TFunction } from "./translate";

interface LocaleContextValue {
  locale: Locale;
  t: TFunction;
  /** Formats a number with the locale's digits, e.g. 15 → "१५" in Hindi. */
  formatNumber: (value: number) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const formatter = new Intl.NumberFormat(intlLocale(locale));
    return {
      locale,
      t: makeT(locale),
      formatNumber: (n) => formatter.format(n),
    };
  }, [locale]);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT/useLocale must be used inside LocaleProvider");
  return ctx;
}

export function useT(): TFunction {
  return useLocaleContext().t;
}

export function useLocale() {
  const { locale, formatNumber } = useLocaleContext();
  return { locale, formatNumber };
}
