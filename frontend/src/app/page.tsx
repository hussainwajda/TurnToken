import Link from "next/link";
import { Button } from "@/components/Button";
import { TicketCard } from "@/components/TicketCard";

const CUSTOMER_FEATURES = [
  {
    title: "One scan, no app",
    body: "A QR code at the door is the whole install process. No download, no account, no typing a phone number into a kiosk.",
  },
  {
    title: "A live, honest position",
    body: "Their ticket updates from how fast your counter is actually moving today — not a static “15 minutes” guess.",
  },
  {
    title: "An alert when it matters",
    body: "A push notification lands as they close in, so they can wait wherever they actually want to wait.",
  },
  {
    title: "Room to be a few minutes late",
    body: "A grace window and a hold window mean stepping away doesn’t cost them their place — up to the limits you set.",
  },
];

const OWNER_FEATURES = [
  {
    title: "One screen, one hand",
    body: "Call next, skip a no-show, restore them if they turn up — the whole counter runs from a single control rail.",
  },
  {
    title: "No-shows sort themselves out",
    body: "Grace and hold windows are enforced automatically. You never have to be the one who decides someone waited too long.",
  },
  {
    title: "A printable poster in seconds",
    body: "Your queue’s QR code, styled and ready to print, generated the moment your shop is set up.",
  },
  {
    title: "Today, at a glance",
    body: "Customers served, average wait, peak hour, no-shows — live on the dashboard, no separate reports to pull.",
  },
];

const FAQS = [
  {
    q: "Do customers need to download anything?",
    a: "No. Scanning the poster's QR code opens their ticket directly in their phone's browser — no app, no account, no login.",
  },
  {
    q: "What happens if someone doesn't show up when called?",
    a: "They're automatically skipped after your grace timer runs out, and stay recoverable until your hold window closes — no owner has to make that call mid-rush.",
  },
  {
    q: "Is Turn-Token free to use?",
    a: "Yes — set up your shop, print your poster, and run your queue on the free tier. No card required to get started.",
  },
  {
    q: "What kinds of businesses is this for?",
    a: "Anywhere people wait to be served with a limited number of counters or seats: salons, clinics, repair shops, and similar service counters.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line/0 bg-cream/85 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
        <div className="mx-auto flex w-full max-w-[960px] items-center justify-between px-6 py-6 sm:px-10">
          <span className="font-display text-lg font-medium tracking-[-0.01em]">
            Turn-Token
          </span>
          <nav className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden text-sm text-ink-soft hover:text-ink sm:inline"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden text-sm text-ink-soft hover:text-ink sm:inline"
            >
              How it works
            </a>
            <Link
              href="/login"
              className="hidden text-sm text-ink-soft hover:text-ink sm:inline"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="primary" className="px-5 py-2.5 text-sm">
                Set up your shop
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[960px] grid-cols-1 items-center gap-14 px-6 pt-10 pb-24 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.75rem)] font-[480] leading-[1.02] tracking-[-0.01em] text-ink">
            Nobody should stand in line to find out how long the line is.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-[1.55] text-ink-soft">
            Customers scan a poster and get a live ticket on their own phone —
            no app, no login. You run the whole queue from one screen at the
            counter, and no-shows sort themselves out automatically.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button variant="primary">Set up your shop, free</Button>
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              See how it works
            </a>
          </div>
        </div>

        <TicketCard className="mx-auto w-full max-w-[340px]">
          <p className="text-center text-[0.8125rem] font-semibold tracking-[0.01em] text-marigold">
            Called — head to the counter
          </p>
          <p className="mt-4 text-center font-display text-[clamp(4rem,22vw,6.5rem)] font-[560] leading-[0.95] tracking-[-0.02em] tabular-nums text-ink">
            014
          </p>
          <p className="mt-4 text-center text-sm text-ink-soft">
            2 people ahead · about 8 min
          </p>
        </TicketCard>
      </section>

      <section
        id="how-it-works"
        className="border-y border-line bg-cream-panel/60 py-20"
      >
        <div className="mx-auto w-full max-w-[960px] px-6 sm:px-10">
          <h2 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
            How it works
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
            <Step
              index={1}
              title="Scan the poster"
              body="A customer walks up, scans the QR code at the door, and gets a ticket instantly. No download, no account, no typing."
            />
            <Step
              index={2}
              title="Track from anywhere"
              body="Their phone shows a live position and an honest wait estimate, updated from how fast your counter is actually moving today."
            />
            <Step
              index={3}
              title="Walk in on time"
              body="An alert lands when they're close. Late by a few minutes? A grace window and hold window keep it fair — automatically."
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-[960px] px-6 py-24 sm:px-10">
        <h2 className="font-display max-w-[26ch] text-3xl font-[500] tracking-[-0.01em] text-ink">
          Everything the counter needs, nothing it doesn&apos;t
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-[1.55] text-ink-soft">
          One queue, built for the two people who actually use it: the
          customer holding the ticket, and whoever&apos;s running the
          counter.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-2">
          <FeatureGroup label="For your customers" items={CUSTOMER_FEATURES} />
          <FeatureGroup label="For your counter" items={OWNER_FEATURES} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] px-6 py-20 sm:px-10">
        <div className="rounded-[12px] bg-cream-panel px-8 py-14 sm:px-14">
          <h2 className="font-display max-w-[24ch] text-3xl font-[500] tracking-[-0.01em] text-ink">
            Built for the counter, not a back office
          </h2>
          <p className="mt-5 max-w-[65ch] text-lg leading-[1.55] text-ink-soft">
            Salons, clinics, repair shops — anywhere people wait to be
            served. One dashboard, run one-handed between customers: call
            the next ticket, skip a no-show, restore them if they turn up
            within your hold window. The system makes that call so you
            never have to.
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button variant="primary">Get your QR poster</Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-[720px] px-6 py-20 sm:px-10">
        <h2 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
          Questions
        </h2>
        <div className="mt-10 flex flex-col divide-y divide-line border-t border-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-semibold text-ink">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-xl font-normal text-ink-soft transition-transform duration-150 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[65ch] text-[0.9375rem] leading-[1.55] text-ink-soft">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] px-6 pb-24 pt-4 sm:px-10">
        <div className="flex flex-col items-start gap-6 border-t border-line pt-16 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display max-w-[20ch] text-2xl font-[500] tracking-[-0.01em] text-ink">
            Print a poster, put it by the door. Your queue runs itself.
          </h2>
          <Link href="/signup" className="shrink-0">
            <Button variant="primary">Set up your shop, free</Button>
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-line py-8">
        <div className="mx-auto flex w-full max-w-[960px] flex-wrap items-center justify-between gap-4 px-6 text-sm text-ink-soft sm:px-10">
          <div className="flex items-center gap-3">
            <span>Turn-Token</span>
            <span>·</span>
            <Link
              href="/super-admin"
              className="text-xs font-semibold text-pine underline decoration-pine/30 hover:decoration-pine"
            >
              Super Admin
            </Link>
          </div>
          <span>QR based smart queue management for local businesses</span>
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
        </div>
      </footer>
    </>
  );
}

function Step({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-[500] tabular-nums text-pine">
          {index}
        </span>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
      </div>
      <p className="mt-2 text-[0.9375rem] leading-[1.55] text-ink-soft">
        {body}
      </p>
    </div>
  );
}

function FeatureGroup({
  label,
  items,
}: {
  label: string;
  items: { title: string; body: string }[];
}) {
  return (
    <div>
      <h3 className="text-[0.8125rem] font-semibold tracking-[0.01em] text-pine">
        {label}
      </h3>
      <div className="mt-4 flex flex-col divide-y divide-line border-t border-line">
        {items.map((item) => (
          <div key={item.title} className="py-5">
            <h4 className="text-[1.0625rem] font-semibold text-ink">
              {item.title}
            </h4>
            <p className="mt-1.5 text-[0.9375rem] leading-[1.55] text-ink-soft">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
