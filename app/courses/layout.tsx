import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دوره‌های تخصصی هوش مصنوعی | SAMIZ AI",
  description: "انتخاب و ثبت‌نام در دوره‌های تخصصی سمیز؛ از کدینگ و وایب‌کدینگ تا ساخت حرفه‌ای ویدیو با هوش مصنوعی.",
};

export default function CoursesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
