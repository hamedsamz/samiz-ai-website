import { challengeDb } from "../../../../../db/calorie-challenge";
import { isAdmin } from "../../../../../lib/admin-auth";
import { sendChallengeConfirmationEmail } from "../../../../../lib/challenge-confirmation-email";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await context.params; const { status } = await request.json() as { status?: string };
  if (status !== "approved" && status !== "rejected") return Response.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  const sql = challengeDb();
  const existing = await sql`SELECT status, email, full_name AS "fullName" FROM calorie_challenge_registrations WHERE id = ${id}`;
  if (!existing.length) return Response.json({ error: "ثبت‌نام پیدا نشد" }, { status: 404 });
  if (existing[0].status !== "pending") return Response.json({ error: "این ثبت‌نام قبلاً بررسی شده است." }, { status: 409 });
  const now = Date.now(); await sql`UPDATE calorie_challenge_registrations SET status = ${status}, updated_at = ${now} WHERE id = ${id}`;
  if (status === "rejected") { await sql`UPDATE calorie_challenge_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ${id}`; return Response.json({ ok: true, emailSent: false }); }
  try {
    await sendChallengeConfirmationEmail(String(existing[0].email), String(existing[0].fullName));
    await sql`UPDATE calorie_challenge_registrations SET confirmation_email_sent_at = ${now}, updated_at = ${now} WHERE id = ${id}`;
    return Response.json({ ok: true, emailSent: true });
  } catch (error) { console.error("challenge confirmation email error", error); return Response.json({ ok: true, emailSent: false }); }
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await context.params; const sql = challengeDb();
  const rows = await sql`SELECT status, email, full_name AS "fullName" FROM calorie_challenge_registrations WHERE id = ${id}`;
  if (!rows.length || rows[0].status !== "approved") return Response.json({ error: "ثبت‌نام تأییدشده پیدا نشد." }, { status: 404 });
  try {
    await sendChallengeConfirmationEmail(String(rows[0].email), String(rows[0].fullName)); const now = Date.now();
    await sql`UPDATE calorie_challenge_registrations SET confirmation_email_sent_at = ${now}, updated_at = ${now} WHERE id = ${id}`;
    return Response.json({ ok: true, emailSent: true });
  } catch (error) { console.error("challenge confirmation resend error", error); return Response.json({ error: "ارسال ایمیل انجام نشد." }, { status: 500 }); }
}
