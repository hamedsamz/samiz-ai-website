import { db } from "../../../../db/registrations";
import { ensureAiVideoCourseSchema } from "../../../../db/ai-video-course-registrations";
import { AI_VIDEO_COURSE_PLANS } from "../../../../lib/ai-video-course-config";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function GET(request: Request) {
  await ensureAiVideoCourseSchema();
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (token.length !== 72) return Response.json({ error: "لینک پرداخت معتبر نیست." }, { status: 404 });
  const rows = await db()`SELECT full_name AS "fullName", second_due_at AS "dueAt", second_status AS "secondStatus", second_paid_at AS "secondPaidAt"
    FROM ai_video_course_registrations WHERE payment_token = ${token} AND plan = 'with-support' AND payment_option = 'installments' AND status = 'approved'`;
  if (!rows.length) return Response.json({ error: "لینک پرداخت معتبر نیست یا قسط اول هنوز تأیید نشده است." }, { status: 404 });
  return Response.json({ ...rows[0], amount: AI_VIDEO_COURSE_PLANS["with-support"].fee / 2, cardNumber: AI_VIDEO_COURSE_PLANS["with-support"].cardNumber }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const token = String(form.get("token") ?? "");
    const receipt = form.get("receipt");
    if (token.length !== 72) return Response.json({ error: "لینک پرداخت معتبر نیست." }, { status: 404 });
    if (!(receipt instanceof File) || !allowedTypes.has(receipt.type) || receipt.size === 0 || receipt.size > 2.5 * 1024 * 1024) {
      return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد." }, { status: 400 });
    }
    await ensureAiVideoCourseSchema();
    const now = Date.now();
    const receiptData = Buffer.from(await receipt.arrayBuffer()).toString("base64");
    const rows = await db()`UPDATE ai_video_course_registrations SET second_receipt_name = ${receipt.name.slice(0, 160)},
      second_receipt_type = ${receipt.type}, second_receipt_data = ${receiptData}, second_status = 'pending', second_paid_at = NULL, updated_at = ${now}
      WHERE payment_token = ${token} AND plan = 'with-support' AND payment_option = 'installments' AND status = 'approved'
        AND (second_status IS NULL OR second_status = 'rejected') RETURNING id`;
    if (!rows.length) return Response.json({ error: "رسید قبلاً ارسال شده یا این لینک فعال نیست. اگر رسید رد شده باشد، می‌توانید دوباره ارسال کنید." }, { status: 409 });
    return Response.json({ message: "رسید قسط دوم ثبت شد. وضعیت بررسی را از همین لینک می‌توانید ببینید." });
  } catch (error) {
    console.error("ai video second payment upload error", error);
    return Response.json({ error: "ارسال رسید انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
