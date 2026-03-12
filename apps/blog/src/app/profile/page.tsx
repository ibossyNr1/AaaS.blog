import type { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Profile — AaaS Knowledge Index",
  description: "View your contribution profile, submissions, comments, and watchlist activity.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
