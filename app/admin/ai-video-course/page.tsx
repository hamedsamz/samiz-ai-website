import Link from "next/link";
import CodingCourseAdminPanel from "../coding-course/CodingCourseAdminPanel";
import "../registrations/admin.css";
import "../coding-course/coding-course-admin.css";

export const dynamic = "force-dynamic";

export default function AiVideoCourseAdminPage() {
  return (
    <main className="admin-page coding-admin fa" dir="rtl">
      <header className="admin-header">
        <div><p className="eyebrow">SAMIZ AI ACADEMY · AI VIDEO</p><h1>مدیریت دوره ساخت ویدیو با هوش مصنوعی</h1></div>
        <div><Link href="/admin/coding-course">دوره کدینگ</Link><Link href="/ai-video-creation">صفحه ثبت‌نام</Link><Link href="/">سایت اصلی</Link></div>
      </header>
      <CodingCourseAdminPanel apiBase="/api/admin/ai-video-course" />
    </main>
  );
}
