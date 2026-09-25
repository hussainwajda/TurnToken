"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { api } from "@/lib/api";
import type { BusinessCreateInput } from "@/lib/types";
import { useSession } from "@/lib/supabase/useSession";

const CATEGORIES = [
  "Salon",
  "Clinic",
  "Repair shop",
  "Service counter",
  "Other",
];

const DEFAULTS: BusinessCreateInput = {
  name: "",
  category: CATEGORIES[0],
  contact_email: "",
  contact_phone: "",
  grace_timer_minutes: 5,
  hold_window_minutes: 15,
  active_counters: 1,
  default_service_time_minutes: 10,
  almost_up_threshold: 2,
};

export default function AdminPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [form, setForm] = useState<BusinessCreateInput>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, router, session]);

  function update<K extends keyof BusinessCreateInput>(
    key: K,
    value: BusinessCreateInput[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;

    setSubmitting(true);
    setError(null);

    try {
      const business = await api.createBusiness(form, session.access_token);
      router.push(`/dashboard/${business.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not register this business.",
      );
      setSubmitting(false);
    }
  }

  if (loading || !session) return null;

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-12 sm:px-10 sm:py-16">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
            Register a business
          </h1>
          <p className="mt-3 max-w-[560px] text-[0.9375rem] leading-[1.55] text-ink-soft">
            Create a queue for a new location. You can adjust these settings
            later from its dashboard.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm font-semibold">
          <Link
            href="/super-admin"
            className="text-pine underline decoration-pine/40 hover:decoration-pine"
          >
            Super Admin Hub &rarr;
          </Link>
          <Link
            href="/"
            className="text-ink underline"
          >
            Home
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Business name"
            name="name"
            required
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Ruby Nails & Spa"
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">
              Category
            </span>
            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              className="rounded-[8px] border border-line bg-cream px-4 py-3 text-ink focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Contact email"
            name="contact_email"
            type="email"
            required
            value={form.contact_email}
            onChange={(event) => update("contact_email", event.target.value)}
            placeholder="owner@rubynails.com"
          />
          <Field
            label="Contact phone (optional)"
            name="contact_phone"
            type="tel"
            value={form.contact_phone}
            onChange={(event) => update("contact_phone", event.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="border-t border-line pt-6">
          <h2 className="font-display text-xl font-[500] text-ink">
            Queue settings
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-6">
            <Field
              label="Grace timer (minutes)"
              name="grace_timer_minutes"
              type="number"
              min={1}
              max={60}
              required
              value={form.grace_timer_minutes}
              onChange={(event) =>
                update("grace_timer_minutes", Number(event.target.value))
              }
            />
            <Field
              label="Hold window (minutes)"
              name="hold_window_minutes"
              type="number"
              min={1}
              max={120}
              required
              value={form.hold_window_minutes}
              onChange={(event) =>
                update("hold_window_minutes", Number(event.target.value))
              }
            />
            <Field
              label="Active counters"
              name="active_counters"
              type="number"
              min={1}
              max={20}
              required
              value={form.active_counters}
              onChange={(event) =>
                update("active_counters", Number(event.target.value))
              }
            />
            <Field
              label="Default service time (min)"
              name="default_service_time_minutes"
              type="number"
              min={1}
              max={180}
              required
              value={form.default_service_time_minutes}
              onChange={(event) =>
                update(
                  "default_service_time_minutes",
                  Number(event.target.value),
                )
              }
            />
            <Field
              label="Almost up alert (positions ahead)"
              name="almost_up_threshold"
              type="number"
              min={0}
              max={20}
              required
              value={form.almost_up_threshold}
              onChange={(event) =>
                update("almost_up_threshold", Number(event.target.value))
              }
            />
          </div>
        </div>

        {error ? <p className="text-[0.9375rem] text-terracotta">{error}</p> : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Registering business..." : "Register business"}
        </Button>
      </form>
    </div>
  );
}