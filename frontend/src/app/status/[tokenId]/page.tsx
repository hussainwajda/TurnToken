"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { buildWhatsAppLink, tokenNotifyMessage } from "@/lib/whatsapp";
import type { Business, TokenStatus, TokenStatusResponse } from "@/lib/types";

const POLL_MS = 20000; // fallback only — see useLiveRefresh

const STATUS_COPY: Record<
  TokenStatus,
  { label: string; accent: "pine" | "marigold" | "terracotta" }
> = {
  waiting: { label: "Waiting in line", accent: "pine" },
  called: { label: "Called — head to the counter", accent: "marigold" },
  serving: { label: "You're being served", accent: "marigold" },
  done: { label: "Served — thank you", accent: "pine" },
  skipped: { label: "Skipped — return soon to keep your place", accent: "terracotta" },
  restored: { label: "Restored — you're back in line", accent: "pine" },
  expired: { label: "This ticket has expired", accent: "terracotta" },
  cancelled: { label: "Ticket cancelled", accent: "terracotta" },
};

const accentClass = {
  pine: "text-pine",
  marigold: "text-marigold",
  terracotta: "text-terracotta",
};

type PushStatus =
  | "checking"
  | "unsupported"
  | "idle"
  | "subscribing"
  | "subscribed"
  | "denied"
  | "error";

export default function StatusPage({
  params,
}: PageProps<"/status/[tokenId]">) {
  const { tokenId } = use(params);
  const [data, setData] = useState<TokenStatusResponse | null>(null);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [business, setBusiness] = useState<Business | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await api.getTokenStatus(tokenId);
      setData(result);
      setError(false);
    } catch {
      setError(true);
    }
  }, [tokenId]);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    const initial = setTimeout(refresh, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [refresh]);

  useLiveRefresh({ onEvent: refresh, path: `/ws/token/${tokenId}` });

  const businessId = data?.token.business_id;
  useEffect(() => {
    if (!businessId) return;
    let active = true;
    api
      .getBusiness(businessId)
      .then((result) => {
        if (active) setBusiness(result);
      })
      .catch(() => {
        // Non-critical — only gates the optional WhatsApp button below.
      });
    return () => {
      active = false;
    };
  }, [businessId]);

  // On mount: hide the opt-in entirely on unsupported browsers, and
  // silently re-confirm an existing subscription with the backend if the
  // customer already granted permission on a previous visit.
  useEffect(() => {
    let active = true;

    (async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (active) setPushStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (active) setPushStatus("denied");
        return;
      }
      if (Notification.permission !== "granted") {
        if (active) setPushStatus("idle");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        const keys = existing?.toJSON().keys;
        if (existing && keys?.p256dh && keys?.auth) {
          await api.subscribeToPush(tokenId, {
            endpoint: existing.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
          });
          if (active) setPushStatus("subscribed");
        } else if (active) {
          setPushStatus("idle");
        }
      } catch {
        if (active) setPushStatus("idle");
      }
    })();

    return () => {
      active = false;
    };
  }, [tokenId]);

  async function enablePush() {
    setPushStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus(permission === "denied" ? "denied" : "idle");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setPushStatus("error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      const keys = subscription.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) throw new Error("Missing subscription keys");

      await api.subscribeToPush(tokenId, {
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      setPushStatus("subscribed");
    } catch {
      setPushStatus("error");
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      await api.cancelToken(tokenId);
      await refresh();
    } catch {
      setCancelError("Couldn't cancel your ticket. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (error && !data) {
    return (
      <Center>
        <p className="text-[0.9375rem] text-ink-soft">
          We couldn&apos;t find this ticket. It may have expired.
        </p>
      </Center>
    );
  }

  if (!data) {
    return (
      <Center>
        <p className="text-[0.9375rem] text-ink-soft">Loading your ticket…</p>
      </Center>
    );
  }

  const status = STATUS_COPY[data.token.status];
  const isActive = data.token.status === "waiting" || data.token.status === "restored";
  const services = data.token.services;

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-6 py-16">
      <TicketCard className="w-full">
        <p className={`text-center text-[0.8125rem] font-semibold tracking-[0.01em] ${accentClass[status.accent]}`}>
          {status.label}
        </p>
        <p className="mt-4 text-center font-display text-[clamp(4rem,22vw,8rem)] font-[560] leading-[0.95] tracking-[-0.02em] tabular-nums text-ink">
          {String(data.position_in_queue).padStart(3, "0")}
        </p>
        {isActive ? (
          <p className="mt-4 text-center text-sm text-ink-soft">
            {data.tokens_ahead === 0
              ? "You're next"
              : `${data.tokens_ahead} ${data.tokens_ahead === 1 ? "person" : "people"} ahead`}
            {" · about "}
            {Math.max(1, Math.round(data.estimated_wait_minutes))} min
          </p>
        ) : null}
        {data.token.status === "called" && data.counter_label ? (
          <p className="mt-4 text-center text-sm text-ink-soft">
            Head to <span className="font-semibold text-ink">{data.counter_label}</span>
          </p>
        ) : null}
        {services.length > 0 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-line pt-5">
            {services.map((service, index) => (
              <span
                key={`${service.service_id ?? service.service_name}-${index}`}
                className="rounded-full bg-cream px-3 py-1 text-[0.75rem] font-medium text-ink-soft"
              >
                {service.service_name}
              </span>
            ))}
          </div>
        ) : null}
      </TicketCard>

      {isActive ? <PushOptIn status={pushStatus} onEnable={enablePush} /> : null}

      {isActive && business?.contact_phone ? (
        <a
          href={
            buildWhatsAppLink(
              business.contact_phone,
              tokenNotifyMessage(business.name, data.position_in_queue),
            ) ?? undefined
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-[0.8125rem] text-ink-soft underline decoration-line underline-offset-2 hover:text-ink"
        >
          Or get notified on WhatsApp
        </a>
      ) : null}

      {data.token.status === "waiting" ? (
        <>
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-6"
          >
            {cancelling ? "Cancelling…" : "Cancel my ticket"}
          </Button>
          {cancelError ? (
            <p className="mt-2 text-[0.8125rem] text-terracotta">{cancelError}</p>
          ) : null}
        </>
      ) : null}

      <Link
        href="/"
        className="mt-10 text-[0.8125rem] text-ink-soft hover:text-ink"
      >
        Powered by Turn-Token
      </Link>
    </div>
  );
}

function PushOptIn({ status, onEnable }: { status: PushStatus; onEnable: () => void }) {
  if (status === "checking" || status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <p className="mt-6 text-center text-[0.8125rem] text-ink-soft">
        Alerts on — we&apos;ll notify this device when it&apos;s almost your turn.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="mt-6 max-w-[38ch] text-center text-[0.8125rem] text-ink-soft">
        Notifications are blocked in your browser settings. Enable them there
        to get an alert when it&apos;s almost your turn.
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-[0.8125rem] text-terracotta">
          Couldn&apos;t turn on alerts.
        </p>
        <Button variant="ghost" className="text-sm" onClick={onEnable}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className="mt-6 text-sm"
      disabled={status === "subscribing"}
      onClick={onEnable}
    >
      {status === "subscribing" ? "Enabling…" : "Notify me when it's my turn"}
    </Button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      {children}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
