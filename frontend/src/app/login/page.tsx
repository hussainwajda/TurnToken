"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

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
    } catch {
      router.push("/signup");
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
