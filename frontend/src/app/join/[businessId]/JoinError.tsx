"use client";

import { useT } from "@/i18n/LocaleProvider";
import { ApiError } from "@/lib/api";

export function JoinError({ err }: { err: unknown }) {
  const t = useT();
  const status = err instanceof ApiError ? err.status : null;
  const paused = status === 409;
  const notFound = status === 404;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-[500] text-ink">
        {paused
          ? t("join.err.paused.title")
          : notFound
            ? t("join.err.notFound.title")
            : t("join.err.generic.title")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        {paused
          ? t("join.err.paused.body")
          : notFound
            ? t("join.err.notFound.body")
            : status === 429
              ? t("join.err.rateLimit")
              : status === 400
                ? t("join.err.badService")
                : t("join.err.generic.body")}
      </p>
    </div>
  );
}
