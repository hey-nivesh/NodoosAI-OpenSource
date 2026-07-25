import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nodoos AI — Autonomous Agents for Revenue Retention",
  description:
    "Deploy autonomous AI agents that analyze real-time customer signals, prevent churn, and recover revenue. Powered by LangGraph, Groq & Supabase.",
  openGraph: {
    title: "Nodoos AI — Autonomous Agents for Revenue Retention",
    description:
      "Autonomous AI agents that prevent churn and recover lost revenue for modern enterprises.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: '/favicon.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
