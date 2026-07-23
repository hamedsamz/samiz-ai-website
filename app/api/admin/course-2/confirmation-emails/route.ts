import { db } from "../../../../../db/registrations";
import { ensureCourse2Schema } from "../../../../../db/course2-registrations";
import { isAdmin } from "../../../../../lib/admin-auth";
import { sendCourse2ConfirmationBatch, sendCourse2ConfirmationEmail } from "../../../../../lib/course2-confirmation-email";

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureCourse2Schema();
  try {
    const body = await request.json() as { action?: string; email?: string; fullName?: string; id?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    if (body.action === "test") {
      if (!emailPattern.test(email)) return Response.json({ error: "ایمیل آزمایشی معتبر نیست." }, { status: 400 });
      await sendCourse2ConfirmationEmail(email, fullName || "کاربر آزمایشی");
      return Response.json({ message: "ایمیل آزمایشی دوره جدید ارسال شد." });
    }
    if (body.action === "manual") {
      if (!emailPattern.test(email) || fullName.length < 2) return Response.json({ error: "نام و ایمیل معتبر وارد کنید." }, { status: 400 });
      const existing = await db()`SELECT email FROM course2_external_confirmation_emails WHERE email = ${email}`;
      if (existing.length) return Response.json({ error: "برای این ایمیل قبلاً پیام ارسال شده است." }, { status: 409 });
      await sendCourse2ConfirmationEmail(email, fullName);
      await db()`INSERT INTO course2_external_confirmation_emails (email, full_name, sent_at) VALUES (${email}, ${fullName}, ${Date.now()})`;
      return Response.json({ message: "ایمیل ثبت‌نام خارج از سایت ارسال و ثبت شد." });
    }
    if (body.action === "single") {
      const rows = await db()`SELECT id, full_name AS "fullName", email, confirmation_email_sent_at AS "sentAt" FROM course2_registrations WHERE id = ${body.id ?? ""} AND status = 'approved'`;
      const row = rows[0] as { id: string; fullName: string; email: string; sentAt: number | null } | undefined;
      if (!row) return Response.json({ error: "ثبت‌نام تأییدشده پیدا نشد." }, { status: 404 });
      if (row.sentAt) return Response.json({ error: "ایمیل این فرد قبلاً ارسال شده است." }, { status: 409 });
      await sendCourse2ConfirmationEmail(row.email, row.fullName);
      await db()`UPDATE course2_registrations SET confirmation_email_sent_at = ${Date.now()} WHERE id = ${row.id}`;
      return Response.json({ message: "ایمیل تأیید ارسال شد." });
    }
    if (body.action === "bulk") {
      const rows = await db()`SELECT id, full_name AS "fullName", email FROM course2_registrations WHERE status = 'approved' AND confirmation_email_sent_at IS NULL ORDER BY created_at LIMIT 100` as Array<{ id: string; fullName: string; email: string }>;
      if (!rows.length) return Response.json({ error: "ایمیل ارسال‌نشده‌ای وجود ندارد." }, { status: 409 });
      await sendCourse2ConfirmationBatch(rows.map(row => ({ email: row.email, fullName: row.fullName })));
      const now = Date.now();
      const sql = db();
      await sql.transaction(rows.map(row => sql`UPDATE course2_registrations SET confirmation_email_sent_at = ${now} WHERE id = ${row.id} AND confirmation_email_sent_at IS NULL`));
      return Response.json({ message: `ایمیل تأیید برای ${rows.length} نفر ارسال شد.` });
    }
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error) {
    console.error("course 2 confirmation email error", error);
    const missingTelegram = error instanceof Error && error.message.includes("COURSE2_TELEGRAM_URL");
    return Response.json({ error: missingTelegram ? "لینک کانال تلگرام دوره جدید هنوز تنظیم نشده است." : "ارسال ایمیل انجام نشد؛ تنظیمات ایمیل را بررسی کنید." }, { status: 500 });
  }
}
