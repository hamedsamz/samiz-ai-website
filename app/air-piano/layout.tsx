import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ویلن و درام هوایی با دوربین | SAMIZ PLAY",
  description: "با حرکت انگشت‌ها جلوی دوربین، چهار درام و هفت نت اصلی موسیقی را با صدای ویلن بنواز.",
};

export default function AirPianoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
