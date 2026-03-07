import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "Agent-as-a-Service | Your Autonomous Digital Workforce",
  description:
    "Context-engineered AI agents that adapt, learn, and scale your business operations. Turn business strategy into structured data to perfect any AI request.",
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
        {children}
      </body>
    </html>
  );
}
