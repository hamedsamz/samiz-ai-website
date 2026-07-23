import { db } from "../../../../../../db/registrations";
import { isAdmin } from "../../../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await context.params;
  const { status } = await request.json() as { status?: string };
  if (status !== "approved" && status !== "rejected") return Response.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  const sql = db();
  const existing = await sql`SELECT status FROM course2_registrations WHERE id = ${id}`;
  if (!existing.length) return Response.json({ error: "ثبت‌نام پیدا نشد" }, { status: 404 });
  if (existing[0].status !== "pending") return Response.json({ error: "این ثبت‌نام قبلاً بررسی شده است." }, { status: 409 });
  await sql`UPDATE course2_registrations SET status = ${status}, updated_at = ${Date.now()} WHERE id = ${id}`;
  if (status === "rejected") await sql`UPDATE course2_registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ${id}`;
  return Response.json({ ok: true });
}
