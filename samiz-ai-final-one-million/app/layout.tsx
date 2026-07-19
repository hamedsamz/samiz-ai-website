import type { Metadata } from "next";
import "@fontsource/estedad/400.css";
import "@fontsource/estedad/500.css";
import "@fontsource/estedad/600.css";
import "@fontsource/estedad/700.css";
import "@fontsource/estedad/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAMIZ AI | AI Video Studio, Courses & AI News",
  description: "Professional AI advertising videos, practical artificial intelligence courses, events, and curated AI news from SAMIZ AI.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
