import type { Metadata } from "next";
import { DeliveryClient } from "./client";

export const metadata: Metadata = {
  title: "The Pitch — Agent-as-a-Service",
  description:
    "AaaS encodes your business DNA into structured context for autonomous AI agents. For founders, partners, ambassadors, and investors.",
  openGraph: {
    title: "The Pitch — AaaS",
    description: "Context is the moat. We own the encoding.",
  },
};

export default function DeliveryPage() {
  return <DeliveryClient />;
}
