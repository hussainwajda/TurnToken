"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LOCALES,
  LOCALE_LABELS,
  type Locale,
} from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { useLocale, useT } from "@/i18n/LocaleProvider";

/** Saves the choice in a cookie (so server components can render in that
 * language too) and re-renders the current page. URLs never change, so
 * printed QR posters keep working in every language. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={`inline-flex rounded-[8px] border border-line bg-cream p-0.5 text-[0.8125rem] ${
        pending ? "opacity-60" : ""
      } ${className ?? ""}`}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={code === locale}
          onClick={() => choose(code)}
          className={`rounded-[6px] px-2.5 py-1 font-medium transition-colors ${
            code === locale
              ? "bg-pine text-cream"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
