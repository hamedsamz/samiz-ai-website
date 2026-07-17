import { db, ensureRegistrationSchema, releaseExpiredHolds } from "../../../../db/registrations";
import { isAdmin } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureRegistrationSchema(); await releaseExpiredHolds();
  const rows = await db()`SELECT id, slot_id AS "slotId", full_name AS "fullName", phone, email, receipt_name AS "receiptName", receipt_type AS "receiptType", status, created_at AS "createdAt" FROM registrations ORDER BY created_at DESC`;
  return Response.json({ registrations: rows }, { headers: { "Cache-Control": "no-store" } });
}
