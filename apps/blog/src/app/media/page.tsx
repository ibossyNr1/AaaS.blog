import type { Metadata } from "next";
import { MediaClient } from "./media-client";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Media Dashboard — AaaS Knowledge Index",
  description:
    "Monitor audio and video production status, coverage metrics, and generation activity for the AaaS Knowledge Index.",
};

export default function MediaPage() {
  return <MediaClient />;
}
