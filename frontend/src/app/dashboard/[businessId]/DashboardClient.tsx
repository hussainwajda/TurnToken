"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useOwnerGuard } from "@/lib/useOwnerGuard";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import type { AnalyticsResponse, Business, CounterState, QueueResponse, Token } from "@/lib/types";

// Fallback poll only — the WebSocket connection in useLiveRefresh is the
// primary update path; this just covers a socket that's silently stuck.
const POLL_MS = 20000;

export function DashboardClient({ business: initialBusiness }: { business: Business }) {
  const router = useRouter();
  const { session, sessionLoading, isOwner, accessToken } = useOwnerGuard(initialBusiness);
  const [business, setBusiness] = useState(initialBusiness);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [queueError, setQueueError] = useState(false);
  const [busyTokenId, setBusyTokenId] = useState<string | null>(null);
  const [pausing, setPausing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken || !isOwner) return;
    const [queueResult, analyticsResult] = await Promise.all([
      api.getQueue(business.id, accessToken).catch(() => null),
      api.getAnalytics(business.id, accessToken).catch(() => null),
    ]);
    if (queueResult) setQueue(queueResult);
    if (analyticsResult) setAnalytics(analyticsResult);
    setQueueError(!queueResult);
    setQueueLoaded(true);
  }, [business.id, accessToken, isOwner]);

  useEffect(() => {
    if (!accessToken || !isOwner) return;
    const interval = setInterval(refresh, POLL_MS);
    const initial = setTimeout(refresh, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [refresh, accessToken, isOwner]);

  useLiveRefresh({
    onEvent: refresh,
    path: accessToken && isOwner ? `/ws/business/${business.id}` : null,
    authMessage: accessToken ? { type: "auth", access_token: accessToken } : undefined,
  });

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  function describeError(err: unknown, fallback: string): string {
    return err instanceof ApiError ? err.message : fallback;
  }

  async function togglePause() {
    if (!accessToken) return;
    setPausing(true);
    setActionError(null);
    try {
      const updated = business.is_paused
        ? await api.resumeBusiness(business.id, accessToken)
        : await api.pauseBusiness(business.id, accessToken);
      setBusiness(updated);
    } catch (err) {
      setActionError(describeError(err, "Couldn't update the queue's pause state."));
    } finally {
      setPausing(false);
    }
  }

  async function runAction(tokenId: string, action: (id: string, token: string) => Promise<Token>) {
    if (!accessToken) return;
    setBusyTokenId(tokenId);
    setActionError(null);
    try {
      await action(tokenId, accessToken);
      await refresh();
    } catch (err) {
      setActionError(describeError(err, "That action didn't go through — please try again."));
    } finally {
      setBusyTokenId(null);
    }
  }

  async function callNextAt(counter: CounterState) {
    if (!accessToken || !waiting.length) return;
    const next = eligibleWaitingFor(counter, waiting);
    if (!next) return;
    setBusyTokenId(next.id);
    setActionError(null);
    try {
      await api.callToken(next.id, counter.id, accessToken);
      await refresh();
    } catch (err) {
      setActionError(describeError(err, "Couldn't call the next customer — please try again."));
    } finally {
      setBusyTokenId(null);
    }
  }

  async function cancelWaiting(tokenId: string) {
    setBusyTokenId(tokenId);
    setActionError(null);
    try {
      await api.cancelToken(tokenId);
      await refresh();
    } catch (err) {
      setActionError(describeError(err, "Couldn't cancel that ticket — please try again."));
    } finally {
      setBusyTokenId(null);
    }
  }

  if (sessionLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">Checking your session…</p>
      </div>
    );
  }

  if (!session) return null; // useOwnerGuard is already redirecting to /login

  if (!isOwner) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          This isn&apos;t your shop
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
          You&apos;re logged in, but this business belongs to a different
          account.
        </p>
      </div>
    );
  }

  const counters = queue?.counters ?? [];
  const waiting = queue?.waiting ?? [];
  const skipped = queue?.skipped ?? [];

  return (
    <div className="mx-auto w-full max-w-[960px] px-6 py-10 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl font-[500] tracking-[-0.01em] text-ink">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{business.category}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden text-sm font-semibold text-ink underline sm:inline"
          >
            Register another
          </Link>
          <Link href={`/dashboard/${business.id}/services`}>
            <Button variant="ghost" className="text-sm">
              Services
            </Button>
          </Link>
          <Link href={`/dashboard/${business.id}/counters`}>
            <Button variant="ghost" className="text-sm">
              Counters
            </Button>
          </Link>
          <Link href={`/dashboard/${business.id}/settings`}>
            <Button variant="ghost" className="text-sm">
              Settings
            </Button>
          </Link>
          <Link href={`/dashboard/${business.id}/poster`}>
            <Button variant="ghost" className="text-sm">
              View QR poster
            </Button>
          </Link>
          <Button variant="ghost" className="text-sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
        </div>
      </header>

      {business.is_paused ? (
        <p className="mt-6 rounded-[8px] bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta">
          Your queue is paused — customers can&apos;t join until you resume it.
        </p>
      ) : null}

      {queueError ? (
        <p className="mt-6 rounded-[8px] bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta">
          Couldn&apos;t reach the server for the latest queue — retrying
          automatically. What&apos;s shown below may be out of date.
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-6 flex items-center justify-between gap-4 rounded-[8px] bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta">
          {actionError}
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="shrink-0 font-normal underline decoration-terracotta/40 underline-offset-2"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHeading>Counters</SectionHeading>
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              disabled={pausing}
              onClick={togglePause}
            >
              {business.is_paused
                ? pausing
                  ? "Resuming…"
                  : "Resume queue"
                : pausing
                  ? "Pausing…"
                  : "Pause queue"}
            </Button>
          </div>

          {!queueLoaded ? (
            <p className="mt-4 text-[0.9375rem] text-ink-soft">Loading counters…</p>
          ) : counters.length === 0 ? (
            <p className="mt-4 text-[0.9375rem] text-ink-soft">
              No counters set up yet.{" "}
              <Link href={`/dashboard/${business.id}/counters`} className="underline">
                Add one
              </Link>{" "}
              to start calling customers.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {counters.map((counter) => {
                const next = eligibleWaitingFor(counter, waiting);
                return (
                  <div
                    key={counter.id}
                    className={`rounded-[12px] border px-5 py-4 ${
                      counter.active ? "border-line" : "border-line/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">
                        {counter.label}
                        {!counter.active ? (
                          <span className="ml-2 text-xs font-normal text-ink-soft">
                            (disabled)
                          </span>
                        ) : null}
                      </p>
                    </div>

                    {counter.current_token ? (
                      <div className="mt-3">
                        <TicketSummary token={counter.current_token} />
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="primary"
                            className="px-4 py-2 text-sm"
                            disabled={busyTokenId === counter.current_token.id}
                            onClick={() =>
                              runAction(counter.current_token!.id, api.serveToken)
                            }
                          >
                            Mark served
                          </Button>
                          <Button
                            variant="danger"
                            className="px-4 py-2 text-sm"
                            disabled={busyTokenId === counter.current_token.id}
                            onClick={() =>
                              runAction(counter.current_token!.id, api.skipToken)
                            }
                          >
                            Skip
                          </Button>
                        </div>
                      </div>
                    ) : counter.active ? (
                      <div className="mt-3">
                        {next ? <TicketSummary token={next} /> : null}
                        <Button
                          variant="accent"
                          className="mt-3 w-full"
                          disabled={!next || business.is_paused || Boolean(busyTokenId)}
                          onClick={() => callNextAt(counter)}
                        >
                          {next ? "Call next" : "No eligible customer waiting"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10">
            <SectionHeading>Waiting ({waiting.length})</SectionHeading>
            {!queueLoaded ? (
              <p className="mt-4 text-[0.9375rem] text-ink-soft">Loading queue…</p>
            ) : waiting.length === 0 ? (
              <p className="mt-4 text-[0.9375rem] text-ink-soft">
                No one is waiting. New tickets will show up here the moment a
                customer scans your poster.
              </p>
            ) : (
              waiting.map((token) => (
                <QueueRow
                  key={token.id}
                  token={token}
                  busy={busyTokenId === token.id}
                  actions={
                    token.status === "waiting" ? (
                      <Button
                        variant="ghost"
                        className="px-4 py-2 text-sm"
                        onClick={() => cancelWaiting(token.id)}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                />
              ))
            )}
          </div>

          {skipped.length > 0 ? (
            <div className="mt-10">
              <SectionHeading>Skipped — held for restore</SectionHeading>
              {skipped.map((token) => (
                <QueueRow
                  key={token.id}
                  token={token}
                  busy={busyTokenId === token.id}
                  actions={
                    <Button
                      variant="primary"
                      className="px-4 py-2 text-sm"
                      onClick={() => runAction(token.id, api.restoreToken)}
                    >
                      Restore
                    </Button>
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-[12px] bg-cream-panel px-6 py-6">
            <p className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink-soft">
              Waiting
            </p>
            <p className="mt-1 font-display text-3xl font-[500] tabular-nums text-ink">
              {waiting.length}
            </p>
          </div>

          <div className="rounded-[12px] bg-cream-panel px-6 py-6">
            <SectionHeading>Today</SectionHeading>
            {analytics ? (
              <>
                <dl className="mt-4 flex flex-col gap-4">
                  <Stat label="Customers served" value={analytics.customers_served} />
                  <Stat
                    label="Avg. wait"
                    value={`${analytics.average_wait_minutes} min`}
                  />
                  <Stat
                    label="Peak hour"
                    value={
                      analytics.peak_hour === null
                        ? "—"
                        : `${String(analytics.peak_hour).padStart(2, "0")}:00`
                    }
                  />
                  <Stat label="No-shows" value={analytics.no_show_count} />
                </dl>
                {analytics.top_services.length > 0 ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink-soft">
                      Top services
                    </p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {analytics.top_services.map((s) => (
                        <li
                          key={s.service_name}
                          className="flex items-center justify-between text-sm text-ink"
                        >
                          <span>{s.service_name}</span>
                          <span className="text-ink-soft">
                            {s.count} · {s.average_minutes}m avg
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-sm text-ink-soft">Loading…</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** The earliest-position waiting/restored ticket this counter is allowed
 * to serve — an unrestricted counter (empty allow-list) can take anyone. */
function eligibleWaitingFor(counter: CounterState, waiting: Token[]): Token | undefined {
  return waiting.find((token) => {
    const serviceIds = token.services.map((s) => s.service_id).filter(Boolean) as string[];
    if (serviceIds.length === 0 || counter.allowed_service_ids.length === 0) return true;
    return serviceIds.every((id) => counter.allowed_service_ids.includes(id));
  });
}

function TicketSummary({ token }: { token: Token }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-lg font-[500] tabular-nums text-ink">
        {String(token.position).padStart(3, "0")}
      </span>
      {token.services.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {token.services.map((s, i) => (
            <span
              key={`${s.service_id ?? s.service_name}-${i}`}
              className="rounded-full bg-cream px-2.5 py-0.5 text-[0.75rem] text-ink-soft"
            >
              {s.service_name}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[0.8125rem] text-ink-soft">General</span>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="font-display text-lg font-[500] tabular-nums text-ink">
        {value}
      </dd>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink-soft">
      {children}
    </h2>
  );
}

function QueueRow({
  token,
  actions,
  busy,
}: {
  token: Token;
  actions?: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-line py-4 ${busy ? "opacity-50" : ""}`}
    >
      <TicketSummary token={token} />
      <div className="flex items-center gap-3">
        {token.estimated_wait_minutes !== null ? (
          <span className="text-[0.8125rem] text-ink-soft">
            ~{Math.max(0, Math.round(token.estimated_wait_minutes))} min
          </span>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
