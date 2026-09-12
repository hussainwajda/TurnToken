import { api } from "@/lib/api";
import { CountersClient } from "./CountersClient";

export default async function CountersPage({
  params,
}: PageProps<"/dashboard/[businessId]/counters">) {
  const { businessId } = await params;
  const business = await api.getBusiness(businessId).catch(() => null);

  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          We couldn&apos;t find that business
        </h1>
      </div>
    );
  }

  return <CountersClient business={business} />;
}
