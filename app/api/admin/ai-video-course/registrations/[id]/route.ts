import { db } from "../../../../../../db/registrations";
import { aiVideoSupportCapacity, ensureAiVideoCourseSchema } from "../../../../../../db/ai-video-course-registrations";
import { isAdmin } from "../../../../../../lib/admin-auth";
import { sendAiVideoCourseConfirmationEmail } from "../../../../../../lib/ai-video-course-confirmation-email";
import { AI_VIDEO_SUPPORT_CAPACITY, type AiVideoCoursePlan } from "../../../../../../lib/ai-video-course-config";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureAiVideoCourseSchema();
  const { id } = await context.params;
  const { status } = await request.json() as { status?: string };
  if (status !== "approved" && status !== "rejected") return Response.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  const sql = db();
  let rows;
  try {
    if (status === "approved") {
      rows = await sql`WITH approval_lock AS MATERIALIZED (SELECT pg_try_advisory_xact_lock(83107621) AS acquired),
        available_seat AS MATERIALIZED (
          SELECT number FROM generate_series(
            (SELECT COUNT(*)::int + 1 FROM ai_video_course_registrations WHERE plan = 'with-support' AND status = 'approved' AND seat_number IS NULL),
            ${AI_VIDEO_SUPPORT_CAPACITY}
          ) AS seats(number)
          WHERE NOT EXISTS (SELECT 1 FROM ai_video_course_registrations WHERE plan = 'with-support' AND seat_number = seats.number)
          ORDER BY seats.number LIMIT 1
        )
        UPDATE ai_video_course_registrations AS r SET status = 'approved',
          seat_number = CASE WHEN r.plan = 'with-support' THEN (SELECT number FROM available_seat) ELSE NULL END,
          updated_at = ${Date.now()}
        WHERE r.id = ${id} AND r.status = 'pending'
          AND (SELECT acquired FROM approval_lock)
          AND (r.plan IS DISTINCT FROM 'with-support' OR (SELECT number FROM available_seat) IS NOT NULL)
        RETURNING plan, full_name AS "fullName", email, payment_option AS "paymentOption", second_due_at AS "secondDueAt", payment_token AS "paymentToken"`;
    } else {
      rows = await sql`UPDATE ai_video_course_registrations SET status = 'rejected', updated_at = ${Date.now()}
        WHERE id = ${id} AND status = 'pending' RETURNING plan, full_name AS "fullName", email`;
    }
  } catch (error) {
    console.error("ai video course approval error", error);
    return Response.json({ error: "تأیید همزمان انجام شد. فهرست را تازه کنید و دوباره تلاش کنید." }, { status: 409 });
  }
  const registration = rows[0] as { plan: AiVideoCoursePlan | null; fullName: string; email: string; paymentOption?: string; secondDueAt?: number | null; paymentToken?: string | null } | undefined;
  if (!registration) {
    const existing = await sql`SELECT id FROM ai_video_course_registrations WHERE id = ${id}`;
    return existing.length
      ? Response.json({ error: status === "approved" && (await aiVideoSupportCapacity()).full ? "ظرفیت پلن با پشتیبانی تکمیل شده است." : "این ثبت‌نام قبلاً بررسی شده یا تأیید دیگری در جریان است؛ دوباره تلاش کنید." }, { status: 409 })
      : Response.json({ error: "ثبت‌نام پیدا نشد" }, { status: 404 });
  }

  if (status === "approved") {
    try {
      await sendAiVideoCourseConfirmationEmail(registration.email, registration.fullName, registration.plan, registration.paymentOption === "installments" ? { dueAt: Number(registration.secondDueAt), token: registration.paymentToken ?? "" } : undefined);
      await sql`UPDATE ai_video_course_registrations SET confirmation_email_sent_at = ${Date.now()} WHERE id = ${id}`;
      return Response.json({ ok: true, message: "ثبت‌نام تأیید و ایمیل ورود به کانال ارسال شد." });
    } catch (error) {
      console.error("ai video course approval email error", error);
      return Response.json({ ok: true, warning: "ثبت‌نام تأیید شد، اما ایمیل ارسال نشد. پس از تنظیم لینک کانال، از دکمه ارسال ایمیل استفاده کنید." });
    }
  }
  return Response.json({ ok: true, message: "درخواست ثبت‌نام رد شد." });
}
