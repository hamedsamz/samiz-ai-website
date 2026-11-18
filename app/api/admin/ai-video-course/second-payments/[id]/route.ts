import { db } from "../../../../../../db/registrations";
import { ensureAiVideoCourseSchema } from "../../../../../../db/ai-video-course-registrations";
import { isAdmin } from "../../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await context.params;
  const { status } = await request.json() as { status?: string };
  if (status !== "approved" && status !== "rejected") return Response.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
  await ensureAiVideoCourseSchema();
  const now = Date.now();
  const rows = await db()`UPDATE ai_video_course_registrations
    SET second_status = ${status}, second_paid_at = ${status === "approved" ? now : null}, updated_at = ${now}
    WHERE id = ${id} AND status = 'approved' AND payment_option = 'installments' AND second_status = 'pending'
    RETURNING id`;
  if (!rows.length) return Response.json({ error: "رسید قسط دوم در انتظار بررسی پیدا نشد. صفحه را تازه کنید." }, { status: 409 });
  return Response.json({ message: status === "approved" ? "قسط دوم تأیید شد؛ این ثبت‌نام تسویه شده است." : "رسید قسط دوم رد شد؛ هنرجو می‌تواند رسید جدید بفرستد." });
}
