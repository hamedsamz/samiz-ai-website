import { db } from "../../../../../../db/registrations";
import { isAdmin } from "../../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const rows = await db()`SELECT receipt_name AS "receiptName", receipt_type AS "receiptType", receipt_data AS "receiptData" FROM course2_registrations WHERE id = ${id}`;
  if (!rows.length) return new Response("Not found", { status: 404 });
  const row = rows[0] as { receiptName: string; receiptType: string; receiptData: string };
  return new Response(Buffer.from(row.receiptData, "base64"), { headers: { "Content-Type": row.receiptType, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.receiptName)}`, "Cache-Control": "private, no-store" } });
}
