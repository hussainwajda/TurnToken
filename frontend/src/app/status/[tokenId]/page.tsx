"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import type { TokenStatus, TokenStatusResponse } from "@/lib/types";

const POLL_MS = 5000;

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

export default function StatusPage({
  params,
}: PageProps<"/status/[tokenId]">) {
  const { tokenId } = use(params);
  const [data, setData] = useState<TokenStatusResponse | null>(null);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.cancelToken(tokenId);
      await refresh();
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
      </TicketCard>

      {data.token.status === "waiting" ? (
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-6"
        >
          {cancelling ? "Cancelling…" : "Cancel my ticket"}
        </Button>
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

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      {children}
    </div>
  );
}
