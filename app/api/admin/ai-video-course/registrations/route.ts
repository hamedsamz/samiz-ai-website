import { aiVideoCourseStats, ensureAiVideoCourseSchema } from "../../../../../db/ai-video-course-registrations";
import { db } from "../../../../../db/registrations";
import { isAdmin } from "../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureAiVideoCourseSchema();
  const registrations = await db()`SELECT
    id, location, plan, full_name AS "fullName", age, phone, email, telegram_username AS "telegramUsername",
    paid_amount AS "paidAmount", payment_currency AS "paymentCurrency", receipt_name AS "receiptName",
    receipt_type AS "receiptType", status, confirmation_email_sent_at AS "emailSentAt", created_at AS "createdAt",
    payment_option AS "paymentOption", total_amount AS "totalAmount", first_paid_at AS "firstPaidAt",
    second_due_at AS "secondDueAt", second_status AS "secondStatus", second_paid_at AS "secondPaidAt",
    second_receipt_name AS "secondReceiptName", payment_token AS "paymentToken", seat_number AS "seatNumber"
    FROM ai_video_course_registrations ORDER BY created_at DESC`;
  return Response.json({ registrations, stats: await aiVideoCourseStats() }, { headers: { "Cache-Control": "no-store" } });
}
