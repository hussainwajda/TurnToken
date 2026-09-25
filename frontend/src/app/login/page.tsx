"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { clearPendingBusiness, readPendingBusiness } from "@/lib/pendingBusiness";

export default function LoginPage() {
  const router = useRouter();
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
      setError("Supabase client is not configured. Check your environment settings.");
      setSubmitting(false);
      return;
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message ?? "Could not log in.");
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
        setError(
          err instanceof ApiError
            ? err.message
            : "Logged in, but couldn't reach the backend. Try again in a moment.",
        );
        setSubmitting(false);
        return;
      }
    }

    const pending = readPendingBusiness();
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
      setError(
        err instanceof ApiError
          ? err.message
          : "Your account is confirmed, but we couldn't finish setting up your business. Check that the backend is running and try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <h1 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        Log in
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        Get back to your queue dashboard.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Field
          label="Email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
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
          {submitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-ink underline">
            Set up your shop
          </Link>
        </p>
      </form>
    </div>
  );
}
