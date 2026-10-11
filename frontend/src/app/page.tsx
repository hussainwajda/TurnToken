import Link from "next/link";
import { Button } from "@/components/Button";
import { RedirectIfSignedIn } from "@/components/RedirectIfSignedIn";
import { TicketCard } from "@/components/TicketCard";
import { getT } from "@/i18n/server";

const CUSTOMER_FEATURES = [1, 2, 3, 4] as const;
const OWNER_FEATURES = [1, 2, 3, 4] as const;
const FAQS = [1, 2, 3, 4] as const;

export default async function Home() {
  const { t } = await getT();
  const customerItems = CUSTOMER_FEATURES.map((n) => ({
    title: t(`landing.cust.${n}.title`),
    body: t(`landing.cust.${n}.body`),
  }));
  const ownerItems = OWNER_FEATURES.map((n) => ({
    title: t(`landing.own.${n}.title`),
    body: t(`landing.own.${n}.body`),
  }));
  return (
    <>
      <RedirectIfSignedIn />
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
              {t("landing.nav.features")}
            </a>
            <a
              href="#how-it-works"
              className="hidden text-sm text-ink-soft hover:text-ink sm:inline"
            >
              {t("landing.nav.how")}
            </a>
            <Link
              href="/login"
              className="hidden text-sm text-ink-soft hover:text-ink sm:inline"
            >
              {t("landing.nav.login")}
            </Link>
            <Link href="/signup">
              <Button variant="primary" className="px-5 py-2.5 text-sm">
                {t("landing.nav.setup")}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[960px] grid-cols-1 items-center gap-14 px-6 pt-10 pb-24 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.75rem)] font-[480] leading-[1.02] tracking-[-0.01em] text-ink">
            {t("landing.hero.title")}
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-[1.55] text-ink-soft">
            {t("landing.hero.body")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button variant="primary">{t("landing.cta.free")}</Button>
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              {t("landing.cta.see")}
            </a>
          </div>
        </div>

        <TicketCard className="mx-auto w-full max-w-[340px]">
          <p className="text-center text-[0.8125rem] font-semibold tracking-[0.01em] text-marigold">
            {t("landing.card.called")}
          </p>
          <p className="mt-4 text-center font-display text-[clamp(4rem,22vw,6.5rem)] font-[560] leading-[0.95] tracking-[-0.02em] tabular-nums text-ink">
            014
          </p>
          <p className="mt-4 text-center text-sm text-ink-soft">
            {t("landing.card.ahead")}
          </p>
        </TicketCard>
      </section>

      <section
        id="how-it-works"
        className="border-y border-line bg-cream-panel/60 py-20"
      >
        <div className="mx-auto w-full max-w-[960px] px-6 sm:px-10">
          <h2 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
            {t("landing.how.title")}
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
            <Step
              index={1}
              title={t("landing.how.1.title")}
              body={t("landing.how.1.body")}
            />
            <Step
              index={2}
              title={t("landing.how.2.title")}
              body={t("landing.how.2.body")}
            />
            <Step
              index={3}
              title={t("landing.how.3.title")}
              body={t("landing.how.3.body")}
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-[960px] px-6 py-24 sm:px-10">
        <h2 className="font-display max-w-[26ch] text-3xl font-[500] tracking-[-0.01em] text-ink">
          {t("landing.features.title")}
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-[1.55] text-ink-soft">
          {t("landing.features.body")}
        </p>

        <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-2">
          <FeatureGroup label={t("landing.group.customers")} items={customerItems} />
          <FeatureGroup label={t("landing.group.counter")} items={ownerItems} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] px-6 py-20 sm:px-10">
        <div className="rounded-[12px] bg-cream-panel px-8 py-14 sm:px-14">
          <h2 className="font-display max-w-[24ch] text-3xl font-[500] tracking-[-0.01em] text-ink">
            {t("landing.band.title")}
          </h2>
          <p className="mt-5 max-w-[65ch] text-lg leading-[1.55] text-ink-soft">
            {t("landing.band.body")}
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button variant="primary">{t("landing.band.cta")}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-[720px] px-6 py-20 sm:px-10">
        <h2 className="font-display text-3xl font-[500] tracking-[-0.01em] text-ink">
          {t("landing.faq.title")}
        </h2>
        <div className="mt-10 flex flex-col divide-y divide-line border-t border-line">
          {FAQS.map((n) => (
            <details key={n} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-semibold text-ink">
                {t(`landing.faq.${n}.q`)}
                <span
                  aria-hidden
                  className="shrink-0 text-xl font-normal text-ink-soft transition-transform duration-150 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[65ch] text-[0.9375rem] leading-[1.55] text-ink-soft">
                {t(`landing.faq.${n}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] px-6 pb-24 pt-4 sm:px-10">
        <div className="flex flex-col items-start gap-6 border-t border-line pt-16 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display max-w-[20ch] text-2xl font-[500] tracking-[-0.01em] text-ink">
            {t("landing.final.title")}
          </h2>
          <Link href="/signup" className="shrink-0">
            <Button variant="primary">{t("landing.cta.free")}</Button>
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
              {t("landing.footer.superAdmin")}
            </Link>
          </div>
          <span>{t("landing.footer.tagline")}</span>
          <Link href="/login" className="hover:text-ink">
            {t("landing.nav.login")}
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
