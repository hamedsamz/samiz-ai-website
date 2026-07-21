import { db, ensureRegistrationSchema } from "../../../../db/registrations";
import { isAdmin } from "../../../../lib/admin-auth";
import { sendConfirmationBatch, sendConfirmationEmail } from "../../../../lib/confirmation-email";

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureRegistrationSchema();
  const body = await request.json() as { action?: string; id?: string; email?: string; fullName?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.fullName ?? "").trim();
  try {
    if (body.action === "test") {
      if (!emailPattern.test(email)) return Response.json({ error: "ایمیل آزمایشی معتبر نیست." }, { status: 400 });
      await sendConfirmationEmail(email, fullName || "کاربر آزمایشی");
      return Response.json({ ok: true, message: "ایمیل آزمایشی ارسال شد." });
    }
    if (body.action === "manual") {
      if (!emailPattern.test(email) || fullName.length < 2) return Response.json({ error: "نام و ایمیل معتبر وارد کنید." }, { status: 400 });
      const existing = await db()`SELECT email FROM external_confirmation_emails WHERE email = ${email}`;
      if (existing.length) return Response.json({ error: "برای این ایمیل قبلاً پیام ارسال شده است." }, { status: 409 });
      await sendConfirmationEmail(email, fullName);
      await db()`INSERT INTO external_confirmation_emails (email, full_name, sent_at) VALUES (${email}, ${fullName}, ${Date.now()})`;
      return Response.json({ ok: true, message: "ایمیل این فرد ارسال و ثبت شد." });
    }
    if (body.action === "single") {
      const rows = await db()`SELECT id, full_name AS "fullName", email, confirmation_email_sent_at AS "sentAt" FROM registrations WHERE id = ${body.id ?? ""} AND status = 'approved'`;
      const row = rows[0] as { id: string; fullName: string; email: string | null; sentAt: number | null } | undefined;
      if (!row) return Response.json({ error: "ثبت‌نام تأییدشده پیدا نشد." }, { status: 404 });
      if (!row.email) return Response.json({ error: "این فرد ایمیل ندارد." }, { status: 400 });
      if (row.sentAt) return Response.json({ error: "ایمیل این فرد قبلاً ارسال شده است." }, { status: 409 });
      await sendConfirmationEmail(row.email, row.fullName);
      await db()`UPDATE registrations SET confirmation_email_sent_at = ${Date.now()} WHERE id = ${row.id}`;
      return Response.json({ ok: true, message: "ایمیل تأیید ارسال شد." });
    }
    if (body.action === "bulk") {
      const rows = await db()`SELECT id, full_name AS "fullName", email FROM registrations WHERE status = 'approved' AND email IS NOT NULL AND confirmation_email_sent_at IS NULL ORDER BY created_at LIMIT 100` as Array<{ id: string; fullName: string; email: string }>;
      if (!rows.length) return Response.json({ error: "ایمیل ارسال‌نشده‌ای برای افراد تأییدشده وجود ندارد." }, { status: 409 });
      await sendConfirmationBatch(rows.map(row => ({ email: row.email, fullName: row.fullName })));
      const now = Date.now();
      const sql = db();
      await sql.transaction(rows.map(row => sql`UPDATE registrations SET confirmation_email_sent_at = ${now} WHERE id = ${row.id} AND confirmation_email_sent_at IS NULL`));
      return Response.json({ ok: true, message: `${rows.length} ایمیل تأیید ارسال شد.`, sent: rows.length });
    }
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error) {
    console.error("confirmation email error", error);
    return Response.json({ error: "ارسال ایمیل انجام نشد؛ تنظیمات یا گزارش Resend را بررسی کنید." }, { status: 500 });
  }
}
