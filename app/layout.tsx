import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "./globals.css";
import "./home.css";

export const metadata: Metadata = {
  title: "SAMIZ AI | آموزش هوش مصنوعی، ویدیوهای تبلیغاتی و اخبار AI",
  description: "آموزش کاربردی هوش مصنوعی، تولید حرفه‌ای ویدیوهای تبلیغاتی با AI، طراحی اپلیکیشن هوشمند و تازه‌ترین اخبار هوش مصنوعی در SAMIZ AI.",
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
