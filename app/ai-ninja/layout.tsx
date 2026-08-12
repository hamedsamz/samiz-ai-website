import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Ninja | بازی حرکتی سمیز",
  description: "با حرکت دست و بدون موس، هدف‌ها را بزن و رکورد ثبت کن. پردازش دوربین داخل مرورگر انجام می‌شود.",
};

export default function AiNinjaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
