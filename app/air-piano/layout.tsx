import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ویلن هوایی با دوربین | SAMIZ PLAY",
  description: "با حرکت انگشت‌ها جلوی دوربین، هفت نت اصلی موسیقی را با صدای ویلن بنواز؛ بدون نصب و کاملاً داخل مرورگر.",
};

export default function AirPianoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
