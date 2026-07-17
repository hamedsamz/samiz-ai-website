import { bindings, isAdminRequest } from "../../../../../db/registrations";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return new Response("Unauthorized", { status: 403 });
  const { id } = await context.params;
  const { DB, BUCKET } = await bindings();
  const row = await DB.prepare("SELECT receipt_key AS receiptKey, receipt_name AS receiptName, receipt_type AS receiptType FROM registrations WHERE id = ?").bind(id).first<{ receiptKey: string; receiptName: string; receiptType: string }>();
  if (!row) return new Response("Not found", { status: 404 });
  const object = await BUCKET.get(row.receiptKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": row.receiptType, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.receiptName)}`, "Cache-Control": "private, no-store" } });
}
