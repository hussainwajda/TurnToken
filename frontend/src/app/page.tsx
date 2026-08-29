import Link from "next/link";
import { Button } from "@/components/Button";
import { TicketCard } from "@/components/TicketCard";

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-[960px] items-center justify-between px-6 pt-8 sm:px-10">
        <span className="font-display text-lg font-medium tracking-[-0.01em]">
          Turn-Token
        </span>
        <nav className="flex items-center gap-6">
          <a
            href="#how-it-works"
            className="hidden text-sm text-ink-soft hover:text-ink sm:inline"
          >
            How it works
          </a>
          <Link href="/signup">
            <Button variant="primary" className="px-5 py-2.5 text-sm">
              Set up your shop
            </Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-[960px] grid-cols-1 items-center gap-14 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
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

      <section className="mx-auto w-full max-w-[960px] px-6 py-24 sm:px-10">
        <h2 className="font-display max-w-[24ch] text-3xl font-[500] tracking-[-0.01em] text-ink">
          Built for the counter, not a back office
        </h2>
        <p className="mt-5 max-w-[65ch] text-lg leading-[1.55] text-ink-soft">
          Salons, clinics, repair shops — anywhere people wait to be served.
          One dashboard, run one-handed between customers: call the next
          ticket, skip a no-show, restore them if they turn up within your
          hold window. The system makes that call so you never have to.
        </p>
        <div className="mt-10">
          <Link href="/signup">
            <Button variant="primary">Get your QR poster</Button>
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-line py-8">
        <div className="mx-auto flex w-full max-w-[960px] items-center justify-between px-6 text-sm text-ink-soft sm:px-10">
          <span>Turn-Token</span>
          <span>QR based smart queue management for local businesses</span>
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
