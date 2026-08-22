import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Air Cello — Play What You Feel | SAMIZ PLAY",
  description: "A cinematic camera instrument. Play seven cello notes with your hands in the air.",
};

export default function AirPianoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
