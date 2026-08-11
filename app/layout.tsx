import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAMIZ Academy | آموزش کاربردی هوش مصنوعی",
  description: "آموزش فارسی و پروژه‌محور هوش مصنوعی، مهندسی پرامپت، تولید محتوا، ویدیوهای تبلیغاتی و ساخت ابزارهای هوشمند در SAMIZ Academy.",
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
