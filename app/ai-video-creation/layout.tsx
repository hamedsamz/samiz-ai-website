import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دوره تخصصی ساخت ویدیو با هوش مصنوعی | SAMIZ AI",
  description: "آموزش تخصصی کارگردانی و ساخت ویدیو با مدل‌های هوش مصنوعی؛ از پرامپت، قاب و دوربین تا رفرنس، صدا، تدوین و کنترل کیفیت با تدریس میج بهرامی.",
};

export default function AiVideoCourseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
