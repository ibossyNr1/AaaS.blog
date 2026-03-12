import type { Metadata } from "next";
import { DeveloperClient } from "./developer-client";

export const metadata: Metadata = {
  title: "Developer Portal — AaaS Knowledge Index",
  description:
    "Register API keys, manage access, and explore the AaaS Knowledge Index API.",
};

export default function DeveloperPage() {
  return <DeveloperClient />;
}
