import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";
import { JoinError } from "./JoinError";
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
