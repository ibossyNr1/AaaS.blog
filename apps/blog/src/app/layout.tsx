import type { Metadata } from "next";
import localFont from "next/font/local";
import { IndexNavbar } from "@/components/index-navbar";
import { SkipToContent } from "@/components/skip-to-content";
import { BlogFooter } from "@/components/blog-footer";
import { PageTracker } from "@/components/page-tracker";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { AuthProvider } from "@/components/auth-provider";
import { AudioQueueProvider } from "@/components/audio-queue";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aaas.blog"),
  title: "AaaS Knowledge Index | The AI Ecosystem Database",
  description:
    "Schema-first knowledge index of AI tools, models, agents, skills, and benchmarks. Machine-readable, agent-maintained, always current.",
  openGraph: {
    title: "AaaS Knowledge Index",
    description: "The AI Ecosystem Database",
    url: "https://aaas.blog",
    siteName: "AaaS Knowledge Index",
    type: "website",
    images: ["/og?title=AaaS%20Knowledge%20Index"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AaaS Knowledge Index",
    description: "The AI Ecosystem Database",
    images: ["/og?title=AaaS%20Knowledge%20Index"],
  },
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/api/feed", title: "AaaS Knowledge Index Feed" },
        { url: "/api/podcast/feed", title: "AaaS Podcast Feed" },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <AudioQueueProvider>
            <SkipToContent />
            <IndexNavbar />
            <main id="main-content" className="min-h-screen">{children}</main>
            <BlogFooter />
            <PageTracker />
            <KeyboardShortcuts />
          </AudioQueueProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
