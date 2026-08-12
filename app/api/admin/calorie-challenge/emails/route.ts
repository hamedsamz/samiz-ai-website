import { challengeDb, ensureChallengeSchema } from "../../../../../db/calorie-challenge";
import { isAdmin } from "../../../../../lib/admin-auth";
import { sendChallengeConfirmationEmail } from "../../../../../lib/challenge-confirmation-email";

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureChallengeSchema();
  const body = await request.json() as { action?: string; email?: string; fullName?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.fullName ?? "").trim();
  try {
    if (body.action === "test") {
      if (!emailPattern.test(email)) return Response.json({ error: "ایمیل آزمایشی معتبر نیست." }, { status: 400 });
      await sendChallengeConfirmationEmail(email, fullName || "کاربر آزمایشی");
      return Response.json({ ok: true, message: "ایمیل آزمایشی همراه لینک کانال ارسال شد." });
    }
    if (body.action === "manual") {
      if (!emailPattern.test(email) || fullName.length < 2) return Response.json({ error: "نام و ایمیل معتبر وارد کنید." }, { status: 400 });
      const sql = challengeDb();
      const existing = await sql`SELECT email FROM calorie_challenge_external_emails WHERE email = ${email}`;
      if (existing.length) return Response.json({ error: "برای این ایمیل قبلاً پیام دستی ارسال شده است." }, { status: 409 });
      await sendChallengeConfirmationEmail(email, fullName);
      await sql`INSERT INTO calorie_challenge_external_emails (email, full_name, sent_at) VALUES (${email}, ${fullName}, ${Date.now()})`;
      return Response.json({ ok: true, message: "ایمیل تأیید و لینک کانال برای این فرد ارسال و ثبت شد." });
    }
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  } catch (error) {
    console.error("challenge email tool error", error);
    return Response.json({ error: "ارسال ایمیل انجام نشد؛ تنظیمات یا گزارش Resend را بررسی کنید." }, { status: 500 });
  }
}
