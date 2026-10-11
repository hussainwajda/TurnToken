"use client";

import { InfoTip } from "@/components/InfoTip";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import type { MessageKey } from "@/i18n/translate";

export interface QueueSettingsValues {
  grace_timer_minutes?: number;
  hold_window_minutes?: number;
  active_counters?: number;
  default_service_time_minutes?: number;
  almost_up_threshold?: number;
}

type SettingKey = keyof QueueSettingsValues;

interface SettingSpec {
  key: SettingKey;
  min: number;
  max: number;
  label: MessageKey;
  short: MessageKey;
  what: MessageKey;
  example: MessageKey;
}

const SETTINGS: SettingSpec[] = [
  { key: "grace_timer_minutes", min: 1, max: 60, label: "qs.grace.label", short: "qs.grace.short", what: "qs.grace.what", example: "qs.grace.example" },
  { key: "hold_window_minutes", min: 1, max: 120, label: "qs.hold.label", short: "qs.hold.short", what: "qs.hold.what", example: "qs.hold.example" },
  { key: "active_counters", min: 1, max: 20, label: "qs.counters.label", short: "qs.counters.short", what: "qs.counters.what", example: "qs.counters.example" },
  { key: "default_service_time_minutes", min: 1, max: 180, label: "qs.service.label", short: "qs.service.short", what: "qs.service.what", example: "qs.service.example" },
  { key: "almost_up_threshold", min: 0, max: 20, label: "qs.almost.label", short: "qs.almost.short", what: "qs.almost.what", example: "qs.almost.example" },
];

const FLOW_STEPS = [
  { title: "qs.flow.1.title", body: "qs.flow.1.body" },
  { title: "qs.flow.2.title", body: "qs.flow.2.body" },
  { title: "qs.flow.3.title", body: "qs.flow.3.body" },
  { title: "qs.flow.4.title", body: "qs.flow.4.body" },
] as const satisfies readonly { title: MessageKey; body: MessageKey }[];

/**
 * The queue-behaviour inputs. Each row shows the setting, a one-line
 * summary and the input; the full explanation and a worked example sit
 * behind an "i" button so the form stays short. Written for a shopkeeper
 * who has never run a digital queue, so nothing assumes that "grace" or
 * "hold" mean anything. `values` may omit a setting (e.g. the settings page
 * has no counter count because counters have their own page); omitted ones
 * aren't shown.
 */
export function QueueSettingsFields({
  values,
  onChange,
}: {
  values: QueueSettingsValues;
  onChange: (key: SettingKey, value: number) => void;
}) {
  const t = useT();
  const { formatNumber } = useLocale();

  return (
    <section className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-[500] tracking-[-0.01em] text-ink">
            {t("qs.title")}
          </h2>
          <InfoTip label={t("qs.flow.button")}>
            <p className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">
              {t("qs.flow.title")}
            </p>
            <ol className="mt-3 flex flex-col gap-3">
              {FLOW_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine text-xs font-semibold text-cream"
                  >
                    {formatNumber(index + 1)}
                  </span>
                  <p className="text-[0.875rem] leading-[1.5] text-ink-soft">
                    <span className="font-semibold text-ink">{t(step.title)}</span>
                    {" — "}
                    {t(step.body)}
                  </p>
                </li>
              ))}
            </ol>
          </InfoTip>
        </div>
        <p className="mt-2 text-[0.9375rem] leading-[1.55] text-ink-soft">
          {t("qs.intro")}
        </p>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-line rounded-[12px] border border-line">
        {SETTINGS.filter((spec) => values[spec.key] !== undefined).map((spec) => (
          <div
            key={spec.key}
            className="relative flex items-center justify-between gap-4 px-4 py-3.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={spec.key}
                  className="text-[0.875rem] font-semibold text-ink"
                >
                  {t(spec.label)}
                </label>
                <InfoTip label={t(spec.label)}>
                  <p className="text-[0.875rem] leading-[1.55] text-ink-soft">
                    {t(spec.what)}
                  </p>
                  <p className="mt-3 border-l-2 border-marigold pl-3 text-[0.8125rem] leading-[1.5] text-ink-soft">
                    <span className="font-semibold text-ink">
                      {t("qs.exampleLabel")}:{" "}
                    </span>
                    {t(spec.example)}
                  </p>
                </InfoTip>
              </div>
              <p className="mt-1 text-[0.8125rem] leading-[1.4] text-ink-soft">
                {t(spec.short)}
              </p>
            </div>
            <input
              id={spec.key}
              name={spec.key}
              type="number"
              min={spec.min}
              max={spec.max}
              required
              value={values[spec.key] ?? ""}
              onChange={(e) => onChange(spec.key, Number(e.target.value))}
              className="w-20 shrink-0 rounded-[8px] border border-line bg-cream px-3 py-2.5 text-center tabular-nums text-ink focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
