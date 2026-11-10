import Link from "next/link";
import { requireAcademyUser } from "@/lib/academy/auth";
import { listMyCourses } from "@/lib/academy/db";
import { SignOut } from "./SignOut";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const user = await requireAcademyUser();
  const courses = await listMyCourses(user.id);

  return <>
    <div className="academy-row">
      <div><p className="academy-kicker">پنل هنرجو</p><h1>دوره‌های من</h1><p className="academy-muted">خوش آمدی، {user.name}</p></div>
      <SignOut />
    </div>
    <section className="academy-card">
      {courses.length ? <ul className="academy-list">{courses.map(course => <li key={course.id}>
        <Link href={`/academy/courses/${course.id}`} prefetch={false}>{course.title}</Link>
      </li>)}</ul> : <p>هنوز دسترسی دوره‌ای برای این حساب فعال نشده. اگر دعوت‌نامه داری، لینک آن را با همین حساب باز کن.</p>}
    </section>
    {user.id === process.env.ACADEMY_ADMIN_USER_ID &&
      <Link href="/academy/admin" prefetch={false}>مدیریت آکادمی</Link>}
  </>;
}
