import type { Metadata } from "next";
import { NotificationsPageClient } from "./notifications-page-client";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Manage your notifications and preferences",
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
