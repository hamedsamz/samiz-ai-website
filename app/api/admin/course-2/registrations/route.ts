import { db } from "../../../../../db/registrations";
import { course2CapacityStatus, ensureCourse2Schema, releaseExpiredCourse2Holds } from "../../../../../db/course2-registrations";
import { isAdmin } from "../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureCourse2Schema();
  await releaseExpiredCourse2Holds();
  const rows = await db()`SELECT id, slot_id AS "slotId", payment_type AS "paymentType", full_name AS "fullName", age, education, specialty, occupation, phone, email, charity_name AS "charityName", paid_amount AS "paidAmount", receipt_name AS "receiptName", receipt_type AS "receiptType", status, created_at AS "createdAt", confirmation_email_sent_at AS "emailSentAt" FROM course2_registrations ORDER BY created_at DESC`;
  return Response.json({ registrations: rows, capacity: await course2CapacityStatus() }, { headers: { "Cache-Control": "no-store" } });
}
