import type { Metadata } from "next";
import { EmbedGenerator } from "./embed-client";

export const metadata: Metadata = {
  title: "Embed Widgets — AaaS Knowledge Index",
  description:
    "Generate embeddable widgets for AaaS Knowledge Index entities, leaderboards, and score badges.",
};

export default function EmbedPage() {
  return <EmbedGenerator />;
}
