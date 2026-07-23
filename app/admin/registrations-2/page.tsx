import Course2AdminPanel from "./Course2AdminPanel";
import Link from "next/link";
import "../registrations/admin.css";
import "./admin-course2.css";

export const dynamic = "force-dynamic";

export default function Course2AdminPage() {
  return <main className="admin-page course2-admin fa" dir="rtl"><header className="admin-header"><div><p className="eyebrow">SAMIZ AI ACADEMY · دوره جدید</p><h1>مدیریت ثبت‌نام دوره جدید</h1></div><div><Link href="/admin/registrations">دوره قبلی</Link><Link href="/register-2">صفحه ثبت‌نام</Link><Link href="/">سایت اصلی</Link></div></header><Course2AdminPanel /></main>;
}
