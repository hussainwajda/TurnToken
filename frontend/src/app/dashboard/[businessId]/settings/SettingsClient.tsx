"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Field } from "@/components/Field";
import { QueueSettingsFields } from "@/components/QueueSettingsFields";
import { useT } from "@/i18n/LocaleProvider";
import { describeApiError } from "@/i18n/apiErrors";
import type { MessageKey } from "@/i18n/translate";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { useOwnerGuard } from "@/lib/useOwnerGuard";
import type { Business, BusinessUpdateInput } from "@/lib/types";

export function SettingsClient({ business: initialBusiness }: { business: Business }) {
  const t = useT();
  const { session, sessionLoading, isOwner, accessToken } = useOwnerGuard(initialBusiness);
  const [business, setBusiness] = useState(initialBusiness);
  const [form, setForm] = useState<BusinessUpdateInput>(toFormState(initialBusiness));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof BusinessUpdateInput>(key: K, value: BusinessUpdateInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    setSaved(false);

    try {
      const cleanForm: BusinessUpdateInput = {
        ...form,
        contact_email: form.contact_email?.trim().toLowerCase(),
        contact_phone: form.contact_phone?.trim() || undefined,
      };
      const updated = await api.updateBusiness(business.id, cleanForm, accessToken);
      setBusiness(updated);
      setForm(toFormState(updated));
      setSaved(true);
    } catch (err) {
      setError(describeApiError(err, t, "settings.err.save"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">{t("common.checkingSession")}</p>
      </div>
    );
  }

  if (!session) return null;

  if (!isOwner) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          {t("common.notYourShop")}
        </h1>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-16 sm:px-10">
      <Link
        href={`/dashboard/${business.id}`}
        className="text-sm text-ink-soft hover:text-ink"
      >
        {t("common.back")}
      </Link>

      <h1 className="mt-4 font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        {t("settings.title")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        {t("settings.intro", { counters: "\u0000", services: "\u0001" })
          .split(/([\u0000\u0001])/)
          .map((part, index) =>
            part === "\u0000" ? (
              <Link key={index} href={`/dashboard/${business.id}/counters`} className="underline">
                {t("settings.countersLink")}
              </Link>
            ) : part === "\u0001" ? (
              <Link key={index} href={`/dashboard/${business.id}/services`} className="underline">
                {t("settings.servicesLink")}
              </Link>
            ) : (
              part
            ),
          )}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <Field
          label={t("signup.name")}
          name="name"
          required
          value={form.name ?? ""}
          onChange={(e) => update("name", e.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">
            {t("common.categoryLabel")}
          </span>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-[8px] border border-line bg-cream px-4 py-3 text-ink focus:outline-none focus:border-pine focus:ring-2 focus:ring-pine/30"
          >
            {BUSINESS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`category.${category}` as MessageKey)}
              </option>
            ))}
          </select>
        </label>

        <Field
          label={t("signup.email")}
          name="contact_email"
          type="email"
          required
          value={form.contact_email ?? ""}
          onChange={(e) => update("contact_email", e.target.value)}
        />

        <div>
          <Field
            label={t("signup.phone")}
            name="contact_phone"
            type="tel"
            value={form.contact_phone ?? ""}
            onChange={(e) => update("contact_phone", e.target.value)}
          />
          <p className="mt-1.5 text-[0.75rem] text-ink-soft">
            {t("signup.phoneHelp")}
          </p>
        </div>

        <QueueSettingsFields
          values={{
            grace_timer_minutes: form.grace_timer_minutes,
            hold_window_minutes: form.hold_window_minutes,
            default_service_time_minutes: form.default_service_time_minutes,
            almost_up_threshold: form.almost_up_threshold,
          }}
          onChange={(key, value) =>
            update(key as keyof BusinessUpdateInput, value as never)
          }
        />

        {error ? <p className="text-[0.9375rem] text-terracotta">{error}</p> : null}
        {saved && !error ? (
          <p className="text-[0.9375rem] text-pine">{t("common.saved")}</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? t("common.saving") : t("settings.save")}
        </Button>
      </form>
    </div>
  );
}

function toFormState(business: Business): BusinessUpdateInput {
  return {
    name: business.name,
    category: business.category,
    contact_email: business.contact_email,
    contact_phone: business.contact_phone ?? "",
    grace_timer_minutes: business.grace_timer_minutes,
    hold_window_minutes: business.hold_window_minutes,
    default_service_time_minutes: business.default_service_time_minutes,
    almost_up_threshold: business.almost_up_threshold,
  };
}
