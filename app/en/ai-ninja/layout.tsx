import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Ninja | Webcam Hand-Controlled Game",
  description: "Turn your index finger into a blade. Slice targets with your hand, dodge bombs, and set a new high score in this webcam-controlled game.",
  alternates: {
    canonical: "https://www.samizai.com/en/ai-ninja",
    languages: {
      fa: "https://www.samizai.com/ai-ninja",
      en: "https://www.samizai.com/en/ai-ninja",
    },
  },
};

export default function EnglishAiNinjaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
