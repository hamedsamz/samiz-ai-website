import { bindings, isAdminRequest } from "../../../../../db/registrations";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json() as { status?: string };
  if (body.status !== "approved" && body.status !== "rejected") return Response.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  const { DB } = await bindings();
  const existing = await DB.prepare("SELECT status FROM registrations WHERE id = ?").bind(id).first<{ status: string }>();
  if (!existing) return Response.json({ error: "ثبت‌نام پیدا نشد" }, { status: 404 });
  if (existing.status !== "pending") return Response.json({ error: "این ثبت‌نام قبلاً بررسی شده است." }, { status: 409 });
  await DB.prepare("UPDATE registrations SET status = ?, updated_at = ? WHERE id = ?").bind(body.status, Date.now(), id).run();
  if (body.status === "rejected") await DB.prepare("UPDATE registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ?").bind(id).run();
  return Response.json({ ok: true });
}
