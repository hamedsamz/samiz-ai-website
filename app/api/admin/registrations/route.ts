import { bindings, ensureRegistrationSchema, isAdminRequest, releaseExpiredHolds } from "../../../../db/registrations";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  await ensureRegistrationSchema();
  await releaseExpiredHolds();
  const { DB } = await bindings();
  const rows = await DB.prepare(`SELECT id, slot_id AS slotId, full_name AS fullName, phone,
    receipt_name AS receiptName, receipt_type AS receiptType, status, created_at AS createdAt
    FROM registrations ORDER BY created_at DESC`).all();
  return Response.json({ registrations: rows.results }, { headers: { "Cache-Control": "no-store" } });
}
