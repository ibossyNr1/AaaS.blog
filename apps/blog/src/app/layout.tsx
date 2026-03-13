import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuraBlobs } from "@aaas/ui";
import { IndexNavbar } from "@/components/index-navbar";
import { SkipToContent } from "@/components/skip-to-content";
import { BlogFooter } from "@/components/blog-footer";
import { PageTracker } from "@/components/page-tracker";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { AuthProvider } from "@/components/auth-provider";
import { AudioQueueProvider } from "@/components/audio-queue";
import { ExperimentProvider } from "@/components/experiment-provider";
import { OfflineBanner } from "@/components/offline-banner";
import { LocaleProvider } from "@/components/locale-provider";
import { AriaLiveRegion } from "@/components/aria-live-region";
import { AchievementToast } from "@/components/achievement-toast";
import { PerformanceMonitor } from "@/components/performance-monitor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aaas-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <LocaleProvider>
          <AuthProvider>
            <AudioQueueProvider>
              <ExperimentProvider>
                <SkipToContent />
                <IndexNavbar />
                <OfflineBanner />
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                  <AuraBlobs />
                </div>
                <main id="main-content" className="relative z-10 min-h-screen">
                  {children}
                </main>
                <BlogFooter />
                <PageTracker />
                <KeyboardShortcuts />
                <AriaLiveRegion />
                <AchievementToast />
                <PerformanceMonitor />
              </ExperimentProvider>
            </AudioQueueProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
