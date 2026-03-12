import type { Metadata } from "next";
import { StatusClient } from "./status-client";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "System Status — AaaS Knowledge Index",
  description:
    "Real-time platform status showing agent health, last run times, and system indicators for the AaaS Knowledge Index.",
};

export default function StatusPage() {
  return <StatusClient />;
}
