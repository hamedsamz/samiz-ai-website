import { db } from "../../../../../db/registrations";
import { ensureAiVideoCourseSchema } from "../../../../../db/ai-video-course-registrations";
import { isAdmin } from "../../../../../lib/admin-auth";
import { sendAiVideoCourseConfirmationBatch, sendAiVideoCourseConfirmationEmail, sendAiVideoCourseReminderBatch, sendAiVideoCourseReminderEmail } from "../../../../../lib/ai-video-course-confirmation-email";
import { isAiVideoCoursePlan, type AiVideoCoursePlan } from "../../../../../lib/ai-video-course-config";

type EmailRecipient = { id: string; fullName: string; email: string; plan: AiVideoCoursePlan | null };

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureAiVideoCourseSchema();
  try {
    const body = await request.json() as { action?: string; email?: string; id?: string; plan?: string };
    if (body.plan !== undefined && body.plan !== "legacy" && !isAiVideoCoursePlan(body.plan)) {
      return Response.json({ error: "پلن نامعتبر است." }, { status: 400 });
    }
    const plan = isAiVideoCoursePlan(body.plan) ? body.plan : null;
    if (body.action === "test") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!emailPattern.test(email)) return Response.json({ error: "ایمیل آزمایشی معتبر نیست." }, { status: 400 });
      await sendAiVideoCourseConfirmationEmail(email, "کاربر آزمایشی", plan);
      return Response.json({ message: "ایمیل آزمایشی ارسال شد." });
    }
    if (body.action === "test-reminder") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!emailPattern.test(email)) return Response.json({ error: "ایمیل آزمایشی معتبر نیست." }, { status: 400 });
      await sendAiVideoCourseReminderEmail(email, "کاربر آزمایشی", plan);
      return Response.json({ message: "نمونه ایمیل یادآوری ارسال شد." });
    }
    if (body.action === "single") {
      const rows = await db()`SELECT id, full_name AS "fullName", email, plan, confirmation_email_sent_at AS "sentAt" FROM ai_video_course_registrations WHERE id = ${body.id ?? ""} AND status = 'approved'`;
      const row = rows[0] as (EmailRecipient & { sentAt: number | null }) | undefined;
      if (!row) return Response.json({ error: "ثبت‌نام تأییدشده پیدا نشد." }, { status: 404 });
      if (row.sentAt) return Response.json({ error: "ایمیل این فرد قبلاً ارسال شده است." }, { status: 409 });
      await sendAiVideoCourseConfirmationEmail(row.email, row.fullName, row.plan);
      await db()`UPDATE ai_video_course_registrations SET confirmation_email_sent_at = ${Date.now()} WHERE id = ${row.id}`;
      return Response.json({ message: "ایمیل تأیید ارسال شد." });
    }
    if (body.action === "bulk") {
      const rows = await db()`SELECT id, full_name AS "fullName", email, plan FROM ai_video_course_registrations WHERE status = 'approved' AND confirmation_email_sent_at IS NULL AND plan IS NOT DISTINCT FROM ${plan}::text ORDER BY created_at LIMIT 100` as EmailRecipient[];
      if (!rows.length) return Response.json({ error: "ایمیل ارسال‌نشده‌ای وجود ندارد." }, { status: 409 });
      await sendAiVideoCourseConfirmationBatch(rows);
      const now = Date.now();
      const sql = db();
      await sql.transaction(rows.map(row => sql`UPDATE ai_video_course_registrations SET confirmation_email_sent_at = ${now} WHERE id = ${row.id} AND confirmation_email_sent_at IS NULL`));
      return Response.json({ message: `ایمیل تأیید برای ${rows.length} نفر ارسال شد.` });
    }
    if (body.action === "reminder") {
      const rows = await db()`SELECT DISTINCT ON (LOWER(email))
        full_name AS "fullName", email, plan
        FROM ai_video_course_registrations
        WHERE status = 'approved' AND email <> '' AND plan IS NOT DISTINCT FROM ${plan}::text
        ORDER BY LOWER(email), created_at DESC` as Omit<EmailRecipient, "id">[];
      if (!rows.length) return Response.json({ error: "فرد تأییدشده‌ای برای ارسال یادآوری وجود ندارد." }, { status: 409 });
      await sendAiVideoCourseReminderBatch(rows);
      return Response.json({ message: `ایمیل یادآوری برای ${rows.length} نفر تأییدشده ارسال شد.` });
    }
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error) {
    console.error("ai video course confirmation email error", error);
    const missingChannel = error instanceof Error && error.message.includes("AI_VIDEO_COURSE_CHANNEL_URL");
    return Response.json({ error: missingChannel ? "لینک کانال اختصاصی دوره هنوز تنظیم نشده است." : "ارسال ایمیل انجام نشد؛ تنظیمات ایمیل را بررسی کنید." }, { status: 500 });
  }
}
