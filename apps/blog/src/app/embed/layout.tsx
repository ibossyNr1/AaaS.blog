import type { Metadata } from "next";
import { EmbedStyleOverride } from "./embed-style-override";

export const metadata: Metadata = {
  title: "Embed Widgets — AaaS Knowledge Index",
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <EmbedStyleOverride />
      {children}
    </>
  );
}
