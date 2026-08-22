import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پیانوی هوایی با دوربین | SAMIZ PLAY",
  description: "با حرکت انگشت‌ها جلوی دوربین، دو دنگ کامل و چهارده نت موسیقی را بنواز؛ بدون نصب و کاملاً داخل مرورگر.",
};

export default function AirPianoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
