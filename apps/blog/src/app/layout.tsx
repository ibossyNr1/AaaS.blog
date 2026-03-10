import type { Metadata } from "next";
import localFont from "next/font/local";
import { IndexNavbar } from "@/components/index-navbar";
import { BlogFooter } from "@/components/blog-footer";
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
  title: "AaaS Knowledge Index | The AI Ecosystem Database",
  description:
    "Schema-first knowledge index of AI tools, models, agents, skills, and benchmarks. Machine-readable, agent-maintained, always current.",
  openGraph: {
    title: "AaaS Knowledge Index",
    description: "The AI Ecosystem Database",
    url: "https://aaas.blog",
    siteName: "AaaS Knowledge Index",
    type: "website",
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
        <IndexNavbar />
        <main className="min-h-screen">{children}</main>
        <BlogFooter />
      </body>
    </html>
  );
}
