import type { Metadata } from "next";
import { DocsClient } from "./docs-client";

export const metadata: Metadata = {
  title: "Documentation | AaaS Knowledge Index",
  description: "Comprehensive documentation for the AaaS Knowledge Index API, architecture, and developer guide.",
};

export default function DocsPage() {
  return <DocsClient />;
}
