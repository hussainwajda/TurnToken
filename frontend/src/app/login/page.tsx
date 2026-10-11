"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { RedirectIfSignedIn } from "@/components/RedirectIfSignedIn";
import { useT } from "@/i18n/LocaleProvider";
import { describeApiError } from "@/i18n/apiErrors";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  clearPendingBusiness,
  readPendingBusiness,
  readPendingBusinessFromUser,
} from "@/lib/pendingBusiness";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError(t("login.err.notConfigured"));
      setSubmitting(false);
      return;
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message ?? t("login.err.generic"));
      setSubmitting(false);
      return;
    }

    try {
      const business = await api.getMyBusiness(data.session.access_token);
      router.push(`/dashboard/${business.id}`);
      return;
    } catch (err) {
      // Only a 404 ("no business yet") should fall through to the pending-
      // signup check below. Any other failure (backend down, 401, ...) is
      // a real problem — surfacing it here beats silently trying to create
      // a second business from a stale pending draft.
      if (!(err instanceof ApiError) || err.status !== 404) {
        setError(describeApiError(err, t, "login.err.backend"));
        setSubmitting(false);
        return;
      }
    }

    const pending =
      readPendingBusiness() ?? readPendingBusinessFromUser(data.session.user);
    if (!pending) {
      router.push("/signup");
      return;
    }

    try {
      const business = await api.createBusiness(pending, data.session.access_token);
      clearPendingBusiness();
      router.push(`/dashboard/${business.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Someone else already claimed this email/phone, or a business
        // was already created for this account from a previous run of
        // this same flow — the stale draft is no longer actionable.
        clearPendingBusiness();
      }
      setError(describeApiError(err, t, "login.err.finishSetup"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <RedirectIfSignedIn />
      <h1 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        {t("login.title")}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        {t("login.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Field
          label={t("login.email")}
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t("login.password")}
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="text-[0.9375rem] text-terracotta">{error}</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? t("login.submitting") : t("login.submit")}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          {t("login.newHere")}{" "}
          <Link href="/signup" className="font-semibold text-ink underline">
            {t("login.setup")}
          </Link>
        </p>
      </form>
    </div>
  );
}
