import { api } from "@/lib/api";
import { ServicesClient } from "./ServicesClient";

export default async function ServicesPage({
  params,
}: PageProps<"/dashboard/[businessId]/services">) {
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

  return <ServicesClient business={business} />;
}
