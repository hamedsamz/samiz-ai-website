import { db } from "../../../../../../db/registrations";
import { ensureAiVideoCourseSchema } from "../../../../../../db/ai-video-course-registrations";
import { isAdmin } from "../../../../../../lib/admin-auth";
import { sendAiVideoCourseConfirmationEmail } from "../../../../../../lib/ai-video-course-confirmation-email";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureAiVideoCourseSchema();
  const { id } = await context.params;
  const { status } = await request.json() as { status?: string };
  if (status !== "approved" && status !== "rejected") return Response.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  const sql = db();
  const rows = await sql`SELECT id, status, full_name AS "fullName", email FROM ai_video_course_registrations WHERE id = ${id}`;
  const registration = rows[0] as { id: string; status: string; fullName: string; email: string } | undefined;
  if (!registration) return Response.json({ error: "ثبت‌نام پیدا نشد" }, { status: 404 });
  if (registration.status !== "pending") return Response.json({ error: "این ثبت‌نام قبلاً بررسی شده است." }, { status: 409 });
  await sql`UPDATE ai_video_course_registrations SET status = ${status}, updated_at = ${Date.now()} WHERE id = ${id}`;

  if (status === "approved") {
    try {
      await sendAiVideoCourseConfirmationEmail(registration.email, registration.fullName);
      await sql`UPDATE ai_video_course_registrations SET confirmation_email_sent_at = ${Date.now()} WHERE id = ${id}`;
      return Response.json({ ok: true, message: "ثبت‌نام تأیید و ایمیل ورود به کانال ارسال شد." });
    } catch (error) {
      console.error("ai video course approval email error", error);
      return Response.json({ ok: true, warning: "ثبت‌نام تأیید شد، اما ایمیل ارسال نشد. پس از تنظیم لینک کانال، از دکمه ارسال ایمیل استفاده کنید." });
    }
  }
  return Response.json({ ok: true, message: "درخواست ثبت‌نام رد شد." });
}
