"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { MessageKey } from "@/i18n/translate";
import { useSession } from "@/lib/supabase/useSession";
import {
  clearPendingBusiness,
  readPendingBusiness,
  readPendingBusinessFromUser,
  savePendingBusiness,
} from "@/lib/pendingBusiness";
import { QueueSettingsFields } from "@/components/QueueSettingsFields";
import { useT } from "@/i18n/LocaleProvider";
import { describeApiError } from "@/i18n/apiErrors";
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
  const t = useT();
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
  //
  // A visitor who just confirmed their email also lands here with a session
  // but no business yet — the confirmation link frequently opens in a
  // different browser (a mail app's in-app browser, another device) than
  // the one the signup form was filled out in, so this finishes the signup
  // from whatever draft is reachable (this browser's storage, or the copy
  // stashed in the account's own metadata) instead of asking them to redo
  // the whole form.
  useEffect(() => {
    if (sessionLoading || !session) return;
    let active = true;
    api
      .getMyBusiness(session.access_token)
      .then((business) => {
        if (active) router.replace(`/dashboard/${business.id}`);
      })
      .catch(async (err) => {
        if (!active) return;
        // A 401 here means this browser's cached session no longer
        // corresponds to a real account (the user behind it was deleted,
        // a JWT secret rotated, ...). Sign out to drop the stale session
        // instead of getting stuck showing "Invalid session" with no way
        // forward — the effect re-runs with session === null and this
        // becomes a normal logged-out signup.
        if (err instanceof ApiError && err.status === 401) {
          await createClient().auth.signOut();
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          const pending =
            readPendingBusiness() ?? readPendingBusinessFromUser(session.user);
          if (pending) {
            try {
              const business = await api.createBusiness(
                pending,
                session.access_token,
              );
              clearPendingBusiness();
              if (active) router.replace(`/dashboard/${business.id}?welcome=1`);
              return;
            } catch (createErr) {
              if (createErr instanceof ApiError && createErr.status === 401) {
                await createClient().auth.signOut();
                return;
              }
              clearPendingBusiness();
              // Fall through to the blank form below.
            }
          }
        }
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
        router.push(`/dashboard/${business.id}?welcome=1`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Stale/invalid session (e.g. the account behind it is gone) —
          // sign out so this becomes a normal logged-out signup instead of
          // a dead end, and let the user submit again as a new account.
          await createClient().auth.signOut();
          setError(t("signup.err.expired"));
          setSubmitting(false);
          return;
        }
        setError(describeApiError(err, t, "signup.err.setup"));
        setSubmitting(false);
      }
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError(t("login.err.notConfigured"));
      setSubmitting(false);
      return;
    }
    const { data, error: authError } = await supabase.auth.signUp({
      email: cleanForm.contact_email,
      password,
      options: {
        // The confirmation link often opens in a different browser than the
        // one used to fill this form (a mail app's in-app browser, another
        // device, ...), where `savePendingBusiness` below is invisible. Also
        // stashing the draft in the user's own auth metadata means it's
        // still there however they come back to confirm and log in.
        data: { pending_business: cleanForm },
      },
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
      setError(t("signup.err.exists"));
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
      router.push(`/dashboard/${business.id}?welcome=1`);
    } catch (err) {
      setError(describeApiError(err, t, "signup.err.accountCreated"));
      setSubmitting(false);
    }
  }

  if (checkingExisting) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">{t("common.oneMoment")}</p>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          {t("signup.checkEmail.title")}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
          {t("signup.checkEmail.body", { email: form.contact_email })}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-16 sm:px-10">
      <h1 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        {t("signup.title")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        {t("signup.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <h2 className="font-display text-xl font-[500] tracking-[-0.01em] text-ink">
          {t("signup.section.shop")}
        </h2>
        <Field
          label={t("signup.name")}
          name="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder={t("signup.namePlaceholder")}
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
          value={form.contact_email}
          onChange={(e) => update("contact_email", e.target.value)}
          placeholder="owner@rubynails.com"
        />

        {session ? null : (
          <Field
            label={t("signup.password")}
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("signup.passwordPlaceholder")}
          />
        )}

        <div>
          <Field
            label={t("signup.phone")}
            name="contact_phone"
            type="tel"
            value={form.contact_phone}
            onChange={(e) => update("contact_phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
          <p className="mt-1.5 text-[0.75rem] text-ink-soft">
            {t("signup.phoneHelp")}
          </p>
        </div>

        <QueueSettingsFields
          values={form}
          onChange={(key, value) => update(key, value)}
        />

        {error ? (
          <p className="text-[0.9375rem] text-terracotta">{error}</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? t("signup.submitting") : t("signup.submit")}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          {t("signup.haveShop")}{" "}
          <Link href="/login" className="font-semibold text-ink underline">
            {t("signup.login")}
          </Link>
        </p>
      </form>
    </div>
  );
}
