import type { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings | AaaS Knowledge Index",
  description: "Manage your profile, persona, channel subscriptions, and notification preferences.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
