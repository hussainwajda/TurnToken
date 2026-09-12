"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/useSession";
import { savePendingBusiness } from "@/lib/pendingBusiness";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import type { BusinessCreateInput } from "@/lib/types";

const DEFAULTS: BusinessCreateInput = {
  name: "",
  category: BUSINESS_CATEGORIES[0],
  contact_email: "",
  contact_phone: "",
  grace_timer_minutes: 5,
  hold_window_minutes: 15,
  active_counters: 1,
  default_service_time_minutes: 10,
  almost_up_threshold: 2,
};

export default function SignupPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [form, setForm] = useState<BusinessCreateInput>(DEFAULTS);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  // A signed-in visitor landing here (back button, a stale tab, a re-click
  // of an old confirmation email) already has an account. If they also
  // already have a business, this form would just fail the duplicate check
  // below, so send them straight to their dashboard instead.
  useEffect(() => {
    if (sessionLoading || !session) return;
    let active = true;
    api
      .getMyBusiness(session.access_token)
      .then((business) => {
        if (active) router.replace(`/dashboard/${business.id}`);
      })
      .catch(() => {
        if (active) setCheckingBusiness(false);
      });
    return () => {
      active = false;
    };
  }, [session, sessionLoading, router]);

  const checkingExisting = sessionLoading || (Boolean(session) && checkingBusiness);

  function update<K extends keyof BusinessCreateInput>(
    key: K,
    value: BusinessCreateInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const cleanForm: BusinessCreateInput = {
      ...form,
      contact_email: form.contact_email.trim().toLowerCase(),
      contact_phone: form.contact_phone?.trim() || undefined,
    };

    // Already signed in (see the effect above) but without a business yet —
    // skip auth entirely and go straight to creating the business.
    if (session) {
      try {
        const business = await api.createBusiness(cleanForm, session.access_token);
        router.push(`/dashboard/${business.id}`);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't set up your business. Check that the backend is running and try again.",
        );
        setSubmitting(false);
      }
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: cleanForm.contact_email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    // Supabase returns success with no error for an email that's already
    // registered (so the response can't be used to enumerate accounts) —
    // it hands back the existing user with an empty `identities` array
    // instead. Left unchecked, this form would show "check your email"
    // for a shop that already exists, which is exactly the duplicate-signup
    // bug this guards against.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(
        "An account with this email already exists. Log in instead.",
      );
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      savePendingBusiness(cleanForm);
      setCheckEmail(true);
      setSubmitting(false);
      return;
    }

    try {
      const business = await api.createBusiness(cleanForm, data.session.access_token);
      router.push(`/dashboard/${business.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Your account was created, but we couldn't set up your business. Check that the backend is running and try logging in.",
      );
      setSubmitting(false);
    }
  }

  if (checkingExisting) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">One moment…</p>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          Check your email
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
          We sent a confirmation link to {form.contact_email}. Confirm your
          address, then come back and log in to finish setting up your shop.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-16 sm:px-10">
      <h1 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        Set up your shop
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        Two minutes, and you&apos;ll have a QR poster ready to print. You can
        change every setting here later.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <Field
          label="Business name"
          name="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ruby Nails & Spa"
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
          value={form.contact_email}
          onChange={(e) => update("contact_email", e.target.value)}
          placeholder="owner@rubynails.com"
        />

        {session ? null : (
          <Field
            label="Password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        )}

        <Field
          label="Contact phone (optional)"
          name="contact_phone"
          type="tel"
          value={form.contact_phone}
          onChange={(e) => update("contact_phone", e.target.value)}
          placeholder="+91 98765 43210"
        />

        <div className="grid grid-cols-2 gap-6">
          <Field
            label="Grace timer (minutes)"
            name="grace_timer_minutes"
            type="number"
            min={1}
            max={60}
            required
            value={form.grace_timer_minutes}
            onChange={(e) =>
              update("grace_timer_minutes", Number(e.target.value))
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
            onChange={(e) =>
              update("hold_window_minutes", Number(e.target.value))
            }
          />
          <Field
            label="Counters to start with"
            name="active_counters"
            type="number"
            min={1}
            max={20}
            required
            value={form.active_counters}
            onChange={(e) => update("active_counters", Number(e.target.value))}
          />
          <Field
            label="Default service time (min)"
            name="default_service_time_minutes"
            type="number"
            min={1}
            max={180}
            required
            value={form.default_service_time_minutes}
            onChange={(e) =>
              update("default_service_time_minutes", Number(e.target.value))
            }
          />
          <Field
            label='"Almost up" alert (positions ahead)'
            name="almost_up_threshold"
            type="number"
            min={0}
            max={20}
            required
            value={form.almost_up_threshold}
            onChange={(e) =>
              update("almost_up_threshold", Number(e.target.value))
            }
          />
        </div>

        {error ? (
          <p className="text-[0.9375rem] text-terracotta">{error}</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Creating your queue…" : "Create my queue"}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          Already have a shop?{" "}
          <Link href="/login" className="font-semibold text-ink underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
