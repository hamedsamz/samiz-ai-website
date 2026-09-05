import { db } from "../../../../../db/registrations";
import { ensureCodingCourseSchema } from "../../../../../db/coding-course-registrations";
import { isAdmin } from "../../../../../lib/admin-auth";
import { sendCodingCourseConfirmationBatch, sendCodingCourseConfirmationEmail } from "../../../../../lib/coding-course-confirmation-email";

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureCodingCourseSchema();
  try {
    const body = await request.json() as { action?: string; email?: string; id?: string };
    if (body.action === "test") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!emailPattern.test(email)) return Response.json({ error: "ایمیل آزمایشی معتبر نیست." }, { status: 400 });
      await sendCodingCourseConfirmationEmail(email, "کاربر آزمایشی");
      return Response.json({ message: "ایمیل آزمایشی ارسال شد." });
    }
    if (body.action === "single") {
      const rows = await db()`SELECT id, full_name AS "fullName", email, confirmation_email_sent_at AS "sentAt" FROM coding_course_registrations WHERE id = ${body.id ?? ""} AND status = 'approved'`;
      const row = rows[0] as { id: string; fullName: string; email: string; sentAt: number | null } | undefined;
      if (!row) return Response.json({ error: "ثبت‌نام تأییدشده پیدا نشد." }, { status: 404 });
      if (row.sentAt) return Response.json({ error: "ایمیل این فرد قبلاً ارسال شده است." }, { status: 409 });
      await sendCodingCourseConfirmationEmail(row.email, row.fullName);
      await db()`UPDATE coding_course_registrations SET confirmation_email_sent_at = ${Date.now()} WHERE id = ${row.id}`;
      return Response.json({ message: "ایمیل تأیید ارسال شد." });
    }
    if (body.action === "bulk") {
      const rows = await db()`SELECT id, full_name AS "fullName", email FROM coding_course_registrations WHERE status = 'approved' AND confirmation_email_sent_at IS NULL ORDER BY created_at LIMIT 100` as Array<{ id: string; fullName: string; email: string }>;
      if (!rows.length) return Response.json({ error: "ایمیل ارسال‌نشده‌ای وجود ندارد." }, { status: 409 });
      await sendCodingCourseConfirmationBatch(rows.map(row => ({ email: row.email, fullName: row.fullName })));
      const now = Date.now();
      const sql = db();
      await sql.transaction(rows.map(row => sql`UPDATE coding_course_registrations SET confirmation_email_sent_at = ${now} WHERE id = ${row.id} AND confirmation_email_sent_at IS NULL`));
      return Response.json({ message: `ایمیل تأیید برای ${rows.length} نفر ارسال شد.` });
    }
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error) {
    console.error("coding course confirmation email error", error);
    const missingChannel = error instanceof Error && error.message.includes("CODING_COURSE_CHANNEL_URL");
    return Response.json({ error: missingChannel ? "لینک کانال اختصاصی دوره هنوز تنظیم نشده است." : "ارسال ایمیل انجام نشد؛ تنظیمات ایمیل را بررسی کنید." }, { status: 500 });
  }
}
