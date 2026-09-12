"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { ApiError, api } from "@/lib/api";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { useOwnerGuard } from "@/lib/useOwnerGuard";
import type { Business, BusinessUpdateInput } from "@/lib/types";

export function SettingsClient({ business: initialBusiness }: { business: Business }) {
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
      setError(err instanceof ApiError ? err.message : "Couldn't save your changes. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">Checking your session…</p>
      </div>
    );
  }

  if (!session) return null;

  if (!isOwner) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          This isn&apos;t your shop
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
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        Shop settings
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        Change how your queue is configured. Updates apply to new tickets
        immediately. Manage your{" "}
        <Link href={`/dashboard/${business.id}/counters`} className="underline">
          counters
        </Link>{" "}
        and{" "}
        <Link href={`/dashboard/${business.id}/services`} className="underline">
          services
        </Link>{" "}
        from their own pages.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <Field
          label="Business name"
          name="name"
          required
          value={form.name ?? ""}
          onChange={(e) => update("name", e.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">
            Category
          </span>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-[8px] border border-line bg-cream px-4 py-3 text-ink focus:outline-none focus:border-pine focus:ring-2 focus:ring-pine/30"
          >
            {BUSINESS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="Contact email"
          name="contact_email"
          type="email"
          required
          value={form.contact_email ?? ""}
          onChange={(e) => update("contact_email", e.target.value)}
        />

        <div>
          <Field
            label="Contact phone (optional)"
            name="contact_phone"
            type="tel"
            value={form.contact_phone ?? ""}
            onChange={(e) => update("contact_phone", e.target.value)}
          />
          <p className="mt-1.5 text-[0.75rem] text-ink-soft">
            A WhatsApp-reachable number lets waiting customers opt into
            WhatsApp updates from your status page.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Field
            label="Grace timer (minutes)"
            name="grace_timer_minutes"
            type="number"
            min={1}
            max={60}
            required
            value={form.grace_timer_minutes ?? ""}
            onChange={(e) => update("grace_timer_minutes", Number(e.target.value))}
          />
          <Field
            label="Hold window (minutes)"
            name="hold_window_minutes"
            type="number"
            min={1}
            max={120}
            required
            value={form.hold_window_minutes ?? ""}
            onChange={(e) => update("hold_window_minutes", Number(e.target.value))}
          />
          <Field
            label="Default service time (min)"
            name="default_service_time_minutes"
            type="number"
            min={1}
            max={180}
            required
            value={form.default_service_time_minutes ?? ""}
            onChange={(e) => update("default_service_time_minutes", Number(e.target.value))}
          />
          <Field
            label='"Almost up" alert (positions ahead)'
            name="almost_up_threshold"
            type="number"
            min={0}
            max={20}
            required
            value={form.almost_up_threshold ?? ""}
            onChange={(e) => update("almost_up_threshold", Number(e.target.value))}
          />
        </div>

        {error ? <p className="text-[0.9375rem] text-terracotta">{error}</p> : null}
        {saved && !error ? (
          <p className="text-[0.9375rem] text-pine">Saved.</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
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
