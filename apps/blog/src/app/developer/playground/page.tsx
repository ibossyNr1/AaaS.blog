import type { Metadata } from "next";
import { PlaygroundClient } from "./playground-client";

export const metadata: Metadata = {
  title: "API Playground — AaaS Knowledge Index",
  description:
    "Interactive API playground to explore and test AaaS Knowledge Index endpoints.",
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
