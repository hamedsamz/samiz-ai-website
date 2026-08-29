import type { Metadata } from "next";
import "./python-lab.css";

export const metadata: Metadata = {
  title: "اجرای آنلاین پایتون | SAMIZ AI",
  description: "کد پایتون خود را آنلاین بنویسید و مستقیماً در مرورگر اجرا کنید.",
};

export default function PythonLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

