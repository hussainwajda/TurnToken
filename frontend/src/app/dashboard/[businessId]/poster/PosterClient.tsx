"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/Button";
import type { Business } from "@/lib/types";

export function PosterClient({ business }: { business: Business }) {
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(
      () => setJoinUrl(`${window.location.origin}/join/${business.id}`),
      0,
    );
    return () => clearTimeout(timeout);
  }, [business.id]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copyLink() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-10 sm:px-10">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/${business.id}`}
          className="text-sm text-ink-soft hover:text-ink"
        >
          &larr; Back to dashboard
        </Link>
        <Button variant="primary" onClick={() => window.print()}>
          Print poster
        </Button>
      </div>

      <div className="mt-8 rounded-[20px] border border-line bg-cream-panel px-10 py-14 text-center shadow-ticket print:border-0 print:shadow-none">
        <p className="text-[0.8125rem] font-semibold tracking-[0.01em] text-pine">
          Scan to join the line
        </p>
        <h1 className="mt-3 font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
          {business.name}
        </h1>
        <div className="mx-auto mt-8 w-fit rounded-[12px] bg-cream p-6">
          {joinUrl ? (
            <QRCodeSVG value={joinUrl} size={220} fgColor="#144D45" bgColor="#F8F3EA" />
          ) : (
            <div className="h-[220px] w-[220px]" />
          )}
        </div>

        <button
          type="button"
          onClick={copyLink}
          disabled={!joinUrl}
          className="mt-4 text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink disabled:opacity-50 print:hidden"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>

        <p className="mt-8 text-[0.9375rem] leading-[1.55] text-ink-soft">
          Point your phone&apos;s camera at this code to get your ticket.
          No app, no login.
        </p>
      </div>
    </div>
  );
}
