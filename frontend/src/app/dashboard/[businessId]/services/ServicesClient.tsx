"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { ApiError, api } from "@/lib/api";
import { useOwnerGuard } from "@/lib/useOwnerGuard";
import type { Business, Service } from "@/lib/types";

export function ServicesClient({ business }: { business: Business }) {
  const { session, sessionLoading, isOwner, accessToken } = useOwnerGuard(business);
  const [services, setServices] = useState<Service[] | null>(null);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    const result = await api
      .getServices(business.id, { activeOnly: false, accessToken })
      .catch(() => null);
    if (result) setServices(result);
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
      await api.createService(business.id, { name, estimated_minutes: minutes }, accessToken);
      setName("");
      setMinutes(10);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that service.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(service: Service) {
    if (!accessToken) return;
    setBusyId(service.id);
    setError(null);
    try {
      await api.updateService(business.id, service.id, { active: !service.active }, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that service.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateMinutes(service: Service, value: number) {
    if (!accessToken || Number.isNaN(value) || value <= 0) return;
    setBusyId(service.id);
    setError(null);
    try {
      await api.updateService(business.id, service.id, { estimated_minutes: value }, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that service.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(service: Service) {
    if (!accessToken) return;
    setBusyId(service.id);
    setError(null);
    try {
      await api.deleteService(business.id, service.id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that service.");
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
        Services
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        Customers pick from this list when they scan your QR poster —
        estimated minutes drive their wait-time estimate until enough real
        tickets come through to learn your actual pace. Leave this empty to
        keep a single, no-selection queue.
      </p>

      <form onSubmit={handleCreate} className="mt-8 flex items-end gap-3">
        <Field
          label="Service name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Field
          label="Est. minutes"
          name="estimated_minutes"
          type="number"
          min={1}
          max={240}
          required
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-28"
        />
        <Button type="submit" variant="primary" disabled={submitting || !name.trim()}>
          {submitting ? "Adding…" : "Add"}
        </Button>
      </form>
      {error ? <p className="mt-2 text-[0.8125rem] text-terracotta">{error}</p> : null}

      <div className="mt-8 flex flex-col">
        {services === null ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-ink-soft">No services yet.</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={`flex items-center justify-between gap-4 border-b border-line py-4 ${
                busyId === service.id ? "opacity-50" : ""
              } ${!service.active ? "opacity-50" : ""}`}
            >
              <div>
                <p className="text-[0.9375rem] font-medium text-ink">{service.name}</p>
                {!service.active ? (
                  <p className="text-[0.75rem] text-ink-soft">Archived</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={240}
                  defaultValue={service.estimated_minutes}
                  onBlur={(e) => updateMinutes(service, Number(e.target.value))}
                  className="w-20 rounded-[8px] border border-line bg-cream px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-pine focus:ring-2 focus:ring-pine/30"
                />
                <span className="text-[0.75rem] text-ink-soft">min</span>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  disabled={busyId === service.id}
                  onClick={() => toggleActive(service)}
                >
                  {service.active ? "Archive" : "Restore"}
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  disabled={busyId === service.id}
                  onClick={() => remove(service)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
