"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";
import { JoinError } from "./page";

export function SelectServicesClient({
  businessId,
  services,
}: {
  businessId: string;
  services: Service[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function join(serviceIds: string[]) {
    setSubmitting(true);
    setError(null);
    try {
      const token = await api.issueToken(businessId, serviceIds);
      router.push(`/status/${token.id}`);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  if (error) return <JoinError err={error} />;

  const totalMinutes = services
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + s.estimated_minutes, 0);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-[500] text-ink">
        What do you need today?
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-[1.55] text-ink-soft">
        Pick everything you&apos;d like done in one visit — we&apos;ll line
        you up for all of it at once.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {services.map((service) => {
          const checked = selected.has(service.id);
          return (
            <label
              key={service.id}
              className={`flex cursor-pointer items-center justify-between rounded-[8px] border px-4 py-3.5 transition-colors ${
                checked ? "border-pine bg-pine/5" : "border-line bg-cream"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(service.id)}
                  className="h-4 w-4 accent-pine"
                />
                <span className="text-[0.9375rem] font-medium text-ink">
                  {service.name}
                </span>
              </span>
              <span className="text-[0.8125rem] text-ink-soft">
                ~{service.estimated_minutes} min
              </span>
            </label>
          );
        })}
      </div>

      <Button
        variant="primary"
        className="mt-8"
        disabled={submitting || selected.size === 0}
        onClick={() => join(Array.from(selected))}
      >
        {submitting
          ? "Joining…"
          : selected.size === 0
            ? "Select a service to continue"
            : `Join queue · ~${totalMinutes} min`}
      </Button>

      <Button
        variant="ghost"
        className="mt-3"
        disabled={submitting}
        onClick={() => join([])}
      >
        Not sure — just add me to the line
      </Button>
    </div>
  );
}
