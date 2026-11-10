import type { Metadata } from "next";
import Link from "next/link";
import "./academy.css";

export const metadata: Metadata = {
  title: "آکادمی سمیز | SAMIZ AI",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <main className="academy" lang="fa" dir="rtl">
    <header className="academy-nav">
      <Link href="/" className="academy-brand" dir="ltr">SAMIZ <span>AI</span></Link>
      <Link href="/academy" prefetch={false}>دوره‌های من</Link>
    </header>
    {children}
  </main>;
}
