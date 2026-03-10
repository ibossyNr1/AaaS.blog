import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DataStream } from "@/components/data-stream";
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
  title: "Agent-as-a-Service | AaaS Framework",
  description:
    "Deploy autonomous AI agents that learn, adapt, and operate your business. Context-engineered intelligence forged in basalt-grade reliability.",
  openGraph: {
    title: "Agent-as-a-Service | AaaS Framework",
    description:
      "Your Autonomous Digital Workforce — Context Is King",
    url: "https://agents-as-a-service.com",
    siteName: "Agent-as-a-Service",
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <DataStream />
      </body>
    </html>
  );
}
