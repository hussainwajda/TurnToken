"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { useSession } from "@/lib/supabase/useSession";
import type { Business, QueueResponse, Token, TokenStatus } from "@/lib/types";

const POLL_MS = 4000;

const STATUS_LABEL: Record<TokenStatus, string> = {
  waiting: "Waiting",
  called: "Called",
  serving: "Serving",
  done: "Done",
  skipped: "Skipped",
  restored: "Restored",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<TokenStatus, string> = {
  waiting: "text-ink-soft",
  called: "text-marigold",
  serving: "text-marigold",
  done: "text-pine",
  skipped: "text-terracotta",
  restored: "text-pine",
  expired: "text-terracotta",
  cancelled: "text-terracotta",
};

export function DashboardClient({ business }: { business: Business }) {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [busyTokenId, setBusyTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  const accessToken = session?.access_token;
  const isOwner = session?.user.id === business.owner_id;

  const refresh = useCallback(async () => {
    if (!accessToken || !isOwner) return;
    const result = await api.getQueue(business.id, accessToken).catch(() => null);
    if (result) setQueue(result);
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

  async function runAction(tokenId: string, action: (id: string, token: string) => Promise<Token>) {
    if (!accessToken) return;
    setBusyTokenId(tokenId);
    try {
      await action(tokenId, accessToken);
      await refresh();
    } finally {
      setBusyTokenId(null);
    }
  }

  if (sessionLoading || !session) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">Checking your session…</p>
      </div>
    );
  }

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

  const tokens = queue?.tokens ?? [];
  const waiting = tokens.filter((t) => t.status === "waiting" || t.status === "restored");
  const called = tokens.find((t) => t.status === "called");
  const skipped = tokens.filter((t) => t.status === "skipped");

  async function callNext() {
    const next = waiting[0];
    if (!next) return;
    await runAction(next.id, api.callToken);
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl font-[500] tracking-[-0.01em] text-ink">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{business.category}</p>
        </div>
        <Link href={`/dashboard/${business.id}/poster`}>
          <Button variant="ghost" className="text-sm">
            View QR poster
          </Button>
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <SectionHeading>Queue</SectionHeading>

          {called ? (
            <QueueRow
              token={called}
              busy={busyTokenId === called.id}
              actions={
                <>
                  <Button
                    variant="primary"
                    className="px-4 py-2 text-sm"
                    onClick={() => runAction(called.id, api.serveToken)}
                  >
                    Mark served
                  </Button>
                  <Button
                    variant="danger"
                    className="px-4 py-2 text-sm"
                    onClick={() => runAction(called.id, api.skipToken)}
                  >
                    Skip
                  </Button>
                </>
              }
            />
          ) : null}

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

          {waiting.length === 0 && !called && skipped.length === 0 ? (
            <p className="mt-6 text-[0.9375rem] text-ink-soft">
              No one is waiting. New tickets will show up here the moment a
              customer scans your poster.
            </p>
          ) : (
            waiting.map((token) => <QueueRow key={token.id} token={token} />)
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-[12px] bg-cream-panel px-6 py-6">
            <p className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink-soft">
              Waiting
            </p>
            <p className="mt-1 font-display text-3xl font-[500] tabular-nums text-ink">
              {waiting.length}
            </p>
            <Button
              variant="accent"
              className="mt-5 w-full"
              disabled={!waiting.length || Boolean(called)}
              onClick={callNext}
            >
              {called ? "Someone is already called" : "Call next"}
            </Button>
          </div>
        </aside>
      </div>
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
      className={`flex items-center justify-between border-b border-line py-4 ${busy ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-4">
        <span className="w-12 font-display text-xl font-[500] tabular-nums text-ink">
          {String(token.position).padStart(3, "0")}
        </span>
        <span className={`text-sm font-semibold ${STATUS_CLASS[token.status]}`}>
          {STATUS_LABEL[token.status]}
        </span>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
