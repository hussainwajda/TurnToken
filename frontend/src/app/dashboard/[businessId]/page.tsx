import { api } from "@/lib/api";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage({
  params,
}: PageProps<"/dashboard/[businessId]">) {
  const { businessId } = await params;
  const business = await api.getBusiness(businessId).catch(() => null);

  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          We couldn&apos;t find that business
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
          Double check the link, or set up a new shop from the home page.
        </p>
      </div>
    );
  }

  return <DashboardClient business={business} />;
}
