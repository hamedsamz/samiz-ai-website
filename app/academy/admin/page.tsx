import { notFound } from "next/navigation";
import { adminIdentity, adminIsElevated } from "@/lib/academy/admin";
import { academyDb } from "@/lib/academy/db";
import { validId } from "@/lib/academy/config";
import { AdminForm } from "./AdminForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: PageProps<"/academy/admin">) {
  const admin = await adminIdentity();
  if (!admin) notFound();
  if (!await adminIsElevated(admin)) return <section className="academy-card academy-narrow">
    <h1>مدیریت آکادمی</h1>
    <p>برای باز کردن پنل، کد برنامهٔ Authenticator را وارد کن. تأیید مدیریت ۱۵ دقیقه اعتبار دارد.</p>
    <AdminForm operation="unlock" label="تأیید مدیر"><label>کد شش‌رقمی
      <input name="code" dir="ltr" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required />
    </label></AdminForm>
  </section>;

  const sql = academyDb();
  const courses = await sql`SELECT id, title FROM academy.courses ORDER BY title, id`;
  const { course } = await searchParams;
  const selected = typeof course === "string" && validId(course) ? courses.find(entry => entry.id === course) : undefined;

  return <>
    <p className="academy-kicker">پنل مدیریت</p><h1>مدیریت آکادمی</h1>
    <section className="academy-card">
      <h2>دوره‌ها</h2>
      <ul className="academy-list">{courses.map(row => <li key={row.id}>
        <Link href={`/academy/admin?course=${row.id}`} prefetch={false}>{row.title}</Link>
      </li>)}</ul>
      <AdminForm operation="course" label="ساخت دوره"><label>عنوان دوره<input name="title" maxLength={160} required /></label></AdminForm>
    </section>
    {selected && <CourseManagement id={selected.id} title={selected.title} />}
  </>;
}

async function CourseManagement({ id, title }: { id: string; title: string }) {
  const sql = academyDb();
  const [lessons, invitations, members] = await Promise.all([
    sql`SELECT id, title, position, published FROM academy.lessons WHERE course_id = ${id} ORDER BY position`,
    sql`SELECT id, email, expires_at FROM academy.invitations WHERE course_id = ${id} AND expires_at > now() ORDER BY expires_at DESC`,
    sql`SELECT user_id, email FROM academy.enrollments WHERE course_id = ${id} ORDER BY granted_at DESC`,
  ]);

  return <>
    <section className="academy-card">
      <h2>دعوت هنرجو به {title}</h2>
      <p>برای هنرجوی جدید یا دارای حساب، یک لینک اختصاصی بساز. هر نفر با ایمیل خودش حساب می‌سازد یا وارد می‌شود.</p>
      <AdminForm operation="invite" course={id} label="ساخت لینک دعوت">
        <label>ایمیل هنرجو<input name="email" type="email" dir="ltr" maxLength={254} required /></label>
      </AdminForm>
      <ul className="academy-list">{invitations.map(row => <li className="academy-row" key={row.id}>
        <span><bdi>{row.email}</bdi> · در انتظار پذیرش</span>
        <AdminForm operation="cancel-invite" item={row.id} label="لغو دعوت" />
      </li>)}</ul>
    </section>
    <section className="academy-card">
      <h2>هنرجوهای دارای دسترسی</h2>
      {!members.length && <p className="academy-muted">هنرجویی هنوز دعوت را نپذیرفته.</p>}
      <ul className="academy-list">{members.map(row => <li className="academy-row" key={row.user_id}>
        <bdi>{row.email}</bdi><AdminForm operation="revoke" course={id} item={row.user_id} label="لغو دسترسی" />
      </li>)}</ul>
    </section>
    <section className="academy-card">
      <h2>جلسه‌ها</h2>
      <AdminForm operation="lesson" course={id} label="ساخت پیش‌نویس جلسه">
        <label>عنوان جلسه<input name="title" maxLength={160} required /></label>
        <label>شمارهٔ جلسه<input name="position" type="number" min={1} max={10000} required /></label>
      </AdminForm>
      <ul className="academy-list">{lessons.map(row => <li className="academy-row" key={row.id}>
        <div>{row.position} · {row.title} · {row.published ? "منتشرشده" : "پیش‌نویس"}
          {!row.published && <div>شناسهٔ بارگذاری <code dir="ltr">{row.id}</code></div>}
        </div>
        <AdminForm operation={row.published ? "unpublish" : "publish"} item={row.id}
          label={row.published ? "برداشتن از انتشار" : "انتشار جلسه"} />
      </li>)}</ul>
    </section>
  </>;
}
