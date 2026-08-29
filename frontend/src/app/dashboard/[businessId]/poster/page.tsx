import { api } from "@/lib/api";
import { PosterClient } from "./PosterClient";

export default async function PosterPage({
  params,
}: PageProps<"/dashboard/[businessId]/poster">) {
  const { businessId } = await params;
  const business = await api.getBusiness(businessId).catch(() => null);

  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[0.9375rem] text-ink-soft">
          We couldn&apos;t find that business.
        </p>
      </div>
    );
  }

  return <PosterClient business={business} />;
}
