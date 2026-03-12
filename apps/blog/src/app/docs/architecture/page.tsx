import type { Metadata } from "next";
import { ArchitectureClient } from "./architecture-client";

export const metadata: Metadata = {
  title: "Architecture | AaaS Knowledge Index",
  description: "System architecture overview of the AaaS Knowledge Index.",
};

export default function ArchitecturePage() {
  return <ArchitectureClient />;
}
