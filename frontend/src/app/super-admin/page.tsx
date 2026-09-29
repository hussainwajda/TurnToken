import type { Metadata } from "next";
import { SuperAdminDashboard } from "./SuperAdminDashboard";

export const metadata: Metadata = {
  title: "Super Admin — Turn-Token Platform Hub",
  description:
    "Super Admin dashboard for Turn-Token platform operations, multi-tenant queue monitoring, and business management.",
};

export default function SuperAdminPage() {
  return <SuperAdminDashboard />;
}
