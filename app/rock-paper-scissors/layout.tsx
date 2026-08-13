import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سنگ، کاغذ، قیچی با دوربین | SAMIZ AI",
  description: "بازی سنگ، کاغذ، قیچی با تشخیص زنده حرکات دست توسط هوش مصنوعی؛ ساخته‌شده در SAMIZ AI.",
};

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
