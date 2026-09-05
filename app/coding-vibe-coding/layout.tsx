import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت‌نام دوره کدینگ، وایب‌کدینگ | SAMIZ AI",
  description: "آموزش پروژه‌محور هوش مصنوعی، مهندسی پرامپت، وایب‌کدینگ و پایتون مقدماتی از صفر؛ با تدریس حامد سمیع‌زاده و دکتر هادی روشن.",
};

export default function CodingCourseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
