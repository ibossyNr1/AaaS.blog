import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CircuitBackground } from "@/components/circuit-background";
import { DataStream } from "@/components/data-stream";
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
  title: "Agent-as-a-Service | Carved Logic",
  description:
    "High-fidelity autonomous agents forged in basalt-grade reliability. Deploy scalable intelligence across private circuitry.",
  openGraph: {
    title: "Agent-as-a-Service",
    description: "Your Autonomous Digital Workforce",
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <CircuitBackground />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <DataStream />
      </body>
    </html>
  );
}
