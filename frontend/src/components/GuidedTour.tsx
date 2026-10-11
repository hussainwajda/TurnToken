"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";
import type { MessageKey } from "@/i18n/translate";

export interface TourStep {
  /** Matches an element's `data-tour` attribute. Omit for a centered card. */
  target?: string;
  title: MessageKey;
  body: MessageKey;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const POPOVER_W = 340;
const GAP = 14;

function readRect(target: string | undefined): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * A spotlight walkthrough: dims the page, cuts a hole around the current
 * step's `data-tour` element and shows a card beside it. Steps whose target
 * isn't on screen are skipped. Esc closes; ←/→ navigate.
 */
export function GuidedTour({
  steps,
  onClose,
}: {
  steps: TourStep[];
  onClose: () => void;
}) {
  const t = useT();
  const [available, setAvailable] = useState<TourStep[]>(steps);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const nextRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverH, setPopoverH] = useState(200);

  // Drop steps whose element doesn't exist (e.g. hidden at this breakpoint).
  useEffect(() => {
    const present = steps.filter(
      (s) => !s.target || document.querySelector(`[data-tour="${s.target}"]`),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(present);
  }, [steps]);

  const step = available[index];
  const isLast = index === available.length - 1;

  const measure = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    setRect(readRect(step?.target));
  }, [step]);

  // Bring the target into view first, then measure, then keep tracking.
  useLayoutEffect(() => {
    if (!step) return;
    if (step.target) {
      document
        .querySelector(`[data-tour="${step.target}"]`)
        ?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  useLayoutEffect(() => {
    if (popoverRef.current) setPopoverH(popoverRef.current.offsetHeight);
  }, [index, viewport.w]);

  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, available.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [available.length, onClose]);

  if (!step) return null;

  const hole = rect
    ? {
        top: Math.max(rect.top - PAD, 4),
        left: Math.max(rect.left - PAD, 4),
        width: Math.min(rect.width + PAD * 2, viewport.w - 8),
        height: Math.min(rect.height + PAD * 2, viewport.h - 8),
      }
    : null;

  // Narrow screens and targets too tall to sit beside get a bottom sheet.
  const docked =
    !hole || viewport.w < 640 || hole.height > viewport.h * 0.55;
  const popoverW = Math.min(POPOVER_W, viewport.w - 32);

  let style: React.CSSProperties;
  if (docked) {
    style = hole
      ? { left: "50%", bottom: 16, width: popoverW, transform: "translateX(-50%)" }
      : { left: "50%", top: "50%", width: popoverW, transform: "translate(-50%, -50%)" };
  } else {
    const below = hole.top + hole.height + GAP + popoverH <= viewport.h - 8;
    const top = below
      ? hole.top + hole.height + GAP
      : Math.max(8, hole.top - GAP - popoverH);
    const left = Math.min(
      Math.max(hole.left, 16),
      viewport.w - popoverW - 16,
    );
    style = { top, left, width: popoverW };
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Click-catcher so the page behind can't be operated mid-tour. */}
      <div className="absolute inset-0" onClick={onClose} />
      {hole ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[12px] ring-2 ring-marigold transition-all duration-200"
          style={{ ...hole, boxShadow: "0 0 0 9999px rgba(35, 31, 26, 0.6)" }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/60" />
      )}

      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="absolute rounded-[12px] border border-line bg-cream p-5 shadow-ticket"
        style={style}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("tour.close")}
          className="absolute right-3 top-3 rounded-full p-1 text-ink-soft hover:text-ink"
        >
          <X aria-hidden size={16} />
        </button>
        <p className="text-[0.75rem] font-semibold text-ink-soft">
          {t("tour.progress", { n: index + 1, total: available.length })}
        </p>
        <h2 id="tour-title" className="mt-1 pr-6 font-display text-lg font-[500] text-ink">
          {t(step.title)}
        </h2>
        <p className="mt-2 text-[0.875rem] leading-[1.55] text-ink-soft">{t(step.body)}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          {isLast ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              {t("tour.skip")}
            </button>
          )}
          <div className="flex gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="rounded-[8px] border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-ink-soft"
              >
                {t("tour.back")}
              </button>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (isLast ? onClose() : setIndex(index + 1))}
              className="rounded-[8px] bg-pine px-4 py-2 text-sm font-semibold text-cream hover:bg-pine-deep"
            >
              {isLast ? t("tour.done") : t("tour.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
