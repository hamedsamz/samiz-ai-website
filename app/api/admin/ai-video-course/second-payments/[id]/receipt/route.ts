import { db } from "../../../../../../../db/registrations";
import { isAdmin } from "../../../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const rows = await db()`SELECT second_receipt_name AS "name", second_receipt_type AS "type", second_receipt_data AS "data"
    FROM ai_video_course_registrations WHERE id = ${id} AND second_receipt_data IS NOT NULL`;
  const row = rows[0] as { name: string; type: string; data: string } | undefined;
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.data, "base64"), { headers: {
    "Content-Type": row.type,
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.name)}`,
    "Cache-Control": "private, no-store",
  } });
}
