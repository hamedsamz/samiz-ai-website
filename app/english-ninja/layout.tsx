import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "English Ninja | بازی تلفظ انگلیسی با دوربین",
  description: "کلمه انگلیسی را بگو، هدف را با تلفظ درست فعال کن و با حرکت انگشتت آن را ببر.",
};

export default function EnglishNinjaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
