import { redirect } from "next/navigation";
import { api } from "@/lib/api";

export default async function JoinPage({
  params,
}: PageProps<"/join/[businessId]">) {
  const { businessId } = await params;

  let tokenId: string;
  try {
    const token = await api.issueToken(businessId);
    tokenId = token.id;
  } catch {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-[500] text-ink">
          This queue isn&apos;t available right now
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
          The poster you scanned may be out of date, or the shop&apos;s queue
          is paused. Please check with the counter.
        </p>
      </div>
    );
  }

  redirect(`/status/${tokenId}`);
}
