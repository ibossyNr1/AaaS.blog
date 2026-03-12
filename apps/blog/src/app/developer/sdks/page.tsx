import type { Metadata } from "next";
import { SdksClient } from "./sdks-client";

export const metadata: Metadata = {
  title: "SDKs — AaaS Knowledge Index",
  description:
    "Download official TypeScript and Python SDKs for the AaaS Knowledge Index API.",
};

export default function SdksPage() {
  return <SdksClient />;
}
