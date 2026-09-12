import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { Service } from "@/lib/types";
import { SelectServicesClient } from "./SelectServicesClient";

export default async function JoinPage({
  params,
}: PageProps<"/join/[businessId]">) {
  const { businessId } = await params;

  let services: Service[];
  try {
    services = await api.getServices(businessId, { activeOnly: true });
  } catch {
    services = [];
  }

  // Businesses that haven't set up a service catalog keep the original,
  // zero-typing flow: scan and go straight to a ticket.
  if (services.length === 0) {
    let tokenId: string;
    try {
      const token = await api.issueToken(businessId, []);
      tokenId = token.id;
    } catch (err) {
      return <JoinError err={err} />;
    }
    redirect(`/status/${tokenId}`);
  }

  return <SelectServicesClient businessId={businessId} services={services} />;
}

export function JoinError({ err }: { err: unknown }) {
  const paused = err instanceof ApiError && err.status === 409;
  const notFound = err instanceof ApiError && err.status === 404;
  const rateLimited = err instanceof ApiError && err.status === 429;
  const badRequest = err instanceof ApiError && err.status === 400;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-[500] text-ink">
        {paused
          ? "This queue is paused right now"
          : notFound
            ? "We couldn't find that shop"
            : "This queue isn't available right now"}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-[1.55] text-ink-soft">
        {paused
          ? "The shop has paused new tickets for the moment. Please check with the counter."
          : notFound
            ? "The poster you scanned may be out of date."
            : rateLimited
              ? "Too many tickets requested from this device — please wait a minute and try again."
              : badRequest
                ? "One of the services you picked is no longer available. Please try again."
                : "The poster you scanned may be out of date, or something went wrong. Please check with the counter."}
      </p>
    </div>
  );
}
