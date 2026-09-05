import Link from "next/link";
import CodingCourseAdminPanel from "./CodingCourseAdminPanel";
import "../registrations/admin.css";
import "./coding-course-admin.css";

export const dynamic = "force-dynamic";

export default function CodingCourseAdminPage() {
  return (
    <main className="admin-page coding-admin fa" dir="rtl">
      <header className="admin-header">
        <div><p className="eyebrow">SAMIZ AI ACADEMY · CODING</p><h1>مدیریت دوره کدینگ، وایب‌کدینگ</h1></div>
        <div><Link href="/admin/registrations-2">دوره پرامپت</Link><Link href="/coding-vibe-coding">صفحه ثبت‌نام</Link><Link href="/">سایت اصلی</Link></div>
      </header>
      <CodingCourseAdminPanel />
    </main>
  );
}
