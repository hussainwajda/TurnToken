"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

/**
 * An "i" button that reveals a detail panel. Works for every input type:
 * hover on a mouse, tap/click on touch, Enter/Space on a keyboard. The panel
 * spans the width of the nearest `relative` ancestor, so it never runs off
 * the edge of a phone screen. Esc or a click elsewhere closes it.
 */
export function InfoTip({
  label,
  children,
}: {
  /** What the panel is about, used for the button's accessible name. */
  label: string;
  children: ReactNode;
}) {
  const t = useT();
  const panelId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;

  useEffect(() => {
    if (!pinned) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setPinned(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPinned(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned]);

  return (
    // Hover only counts for a real mouse: on touch, the emulated mouseenter
    // would fight the tap that is meant to toggle the panel.
    <span
      ref={wrapperRef}
      className="inline-flex"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      <button
        type="button"
        aria-label={t("qs.infoAria", { name: label })}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setPinned((value) => !value)}
        className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-pine bg-pine text-cream"
            : "border-line text-ink-soft hover:border-pine hover:text-pine"
        }`}
      >
        <Info aria-hidden size={14} strokeWidth={2.25} />
      </button>
      <div
        id={panelId}
        role="tooltip"
        hidden={!open}
        className="absolute left-0 right-0 top-full z-30 mt-2 rounded-[12px] border border-line bg-cream p-4 text-left shadow-ticket"
      >
        {children}
      </div>
    </span>
  );
}
