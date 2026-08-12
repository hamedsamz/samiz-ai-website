import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سنگ، کاغذ، قیچی با دوربین | SAMIZ PLAY",
  description: "با حرکت واقعی دستت و از طریق دوربین، سنگ کاغذ قیچی بازی کن و هوش مصنوعی را شکست بده.",
};

export default function RpsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
