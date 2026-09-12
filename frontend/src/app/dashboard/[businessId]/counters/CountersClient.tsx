"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { ApiError, api } from "@/lib/api";
import { useOwnerGuard } from "@/lib/useOwnerGuard";
import type { Business, Counter, Service } from "@/lib/types";

export function CountersClient({ business }: { business: Business }) {
  const { session, sessionLoading, isOwner, accessToken } = useOwnerGuard(business);
  const [counters, setCounters] = useState<Counter[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    const [countersResult, servicesResult] = await Promise.all([
      api.getCounters(business.id, accessToken).catch(() => null),
      api.getServices(business.id, { activeOnly: false, accessToken }).catch(() => []),
    ]);
    if (countersResult) setCounters(countersResult);
    setServices(servicesResult ?? []);
  }, [business.id, accessToken]);

  useEffect(() => {
    const initial = setTimeout(refresh, 0);
    return () => clearTimeout(initial);
  }, [refresh]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createCounter(business.id, { label }, accessToken);
      setLabel("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that counter.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(counter: Counter) {
    if (!accessToken) return;
    setBusyId(counter.id);
    setError(null);
    try {
      await api.updateCounter(business.id, counter.id, { active: !counter.active }, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that counter.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleAllowedService(counter: Counter, serviceId: string) {
    if (!accessToken) return;
    const has = counter.allowed_service_ids.includes(serviceId);
    const next = has
      ? counter.allowed_service_ids.filter((id) => id !== serviceId)
      : [...counter.allowed_service_ids, serviceId];
    setBusyId(counter.id);
    setError(null);
    try {
      await api.updateCounter(business.id, counter.id, { allowed_service_ids: next }, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that counter.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(counter: Counter) {
    if (!accessToken) return;
    setBusyId(counter.id);
    setError(null);
    try {
      await api.deleteCounter(business.id, counter.id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that counter.");
    } finally {
      setBusyId(null);
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
    <div className="mx-auto w-full max-w-[640px] px-6 py-16 sm:px-10">
      <Link
        href={`/dashboard/${business.id}`}
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
        Counters
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        Each counter can serve customers independently — add one per chair,
        staff member, or service desk. Restrict a counter to specific
        services if it can&apos;t do everything (e.g. a massage table); leave
        it unrestricted to let it take anyone.
      </p>

      <form onSubmit={handleCreate} className="mt-8 flex items-end gap-3">
        <Field
          label="Counter label"
          name="label"
          required
          placeholder="e.g. Chair 2"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="primary" disabled={submitting || !label.trim()}>
          {submitting ? "Adding…" : "Add"}
        </Button>
      </form>
      {error ? <p className="mt-2 text-[0.8125rem] text-terracotta">{error}</p> : null}

      <div className="mt-8 flex flex-col gap-5">
        {counters === null ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : counters.length === 0 ? (
          <p className="text-sm text-ink-soft">No counters yet.</p>
        ) : (
          counters.map((counter) => (
            <div
              key={counter.id}
              className={`rounded-[12px] border border-line px-5 py-4 ${
                busyId === counter.id ? "opacity-50" : ""
              } ${!counter.active ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.9375rem] font-medium text-ink">
                  {counter.label}
                  {!counter.active ? (
                    <span className="ml-2 text-xs font-normal text-ink-soft">(disabled)</span>
                  ) : null}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    disabled={busyId === counter.id}
                    onClick={() => toggleActive(counter)}
                  >
                    {counter.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                    disabled={busyId === counter.id}
                    onClick={() => remove(counter)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {services.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {services
                    .filter((s) => s.active)
                    .map((service) => {
                      const checked = counter.allowed_service_ids.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleAllowedService(counter, service.id)}
                          className={`rounded-full border px-3 py-1 text-[0.75rem] transition-colors ${
                            checked
                              ? "border-pine bg-pine/10 text-pine"
                              : "border-line text-ink-soft"
                          }`}
                        >
                          {service.name}
                        </button>
                      );
                    })}
                </div>
              ) : null}
              <p className="mt-2 text-[0.75rem] text-ink-soft">
                {counter.allowed_service_ids.length === 0
                  ? "Unrestricted — can serve any ticket."
                  : "Restricted to the highlighted services above."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
