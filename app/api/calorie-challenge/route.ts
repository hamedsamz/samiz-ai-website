import { CHALLENGE_CAPACITY, challengeCapacityStatus, challengeDb } from "../../../db/calorie-challenge";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
function normalizeDigits(value: string) { return value.replace(/[۰-۹]/g, character => String("۰۱۲۳۴۵۶۷۸۹".indexOf(character))); }

export async function POST(request: Request) {
  let registrationId: string | null = null;
  try {
    if ((await challengeCapacityStatus()).full) return Response.json({ error: "ظرفیت چالش تکمیل شده است." }, { status: 409 });
    const form = await request.formData();
    const fullName = String(form.get("fullName") ?? "").trim();
    const emailInput = String(form.get("email") ?? "").trim();
    const confirmEmail = String(form.get("confirmEmail") ?? "").trim();
    const email = emailInput.toLowerCase();
    const phone = normalizeDigits(String(form.get("phone") ?? "")).replace(/[\s()-]/g, "").trim();
    const receipt = form.get("receipt");
    if (fullName.length < 3 || fullName.length > 80) return Response.json({ error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return Response.json({ error: "ایمیل معتبر وارد کنید." }, { status: 400 });
    if (emailInput !== confirmEmail) return Response.json({ error: "ایمیل و تکرار ایمیل باید دقیقاً یکسان باشند." }, { status: 400 });
    if (!/^\+?[0-9]{7,15}$/.test(phone)) return Response.json({ error: "شماره تماس معتبر وارد کنید." }, { status: 400 });
    if (!(receipt instanceof File) || receipt.size === 0) return Response.json({ error: "تصویر رسید را انتخاب کنید." }, { status: 400 });
    if (!allowedTypes.has(receipt.type) || receipt.size > 2.5 * 1024 * 1024) return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد." }, { status: 400 });

    const sql = challengeDb();
    const duplicate = await sql`SELECT id FROM calorie_challenge_registrations WHERE (phone = ${phone} OR email = ${email}) AND status IN ('pending', 'approved') LIMIT 1`;
    if (duplicate.length) return Response.json({ error: "با این شماره تماس یا ایمیل قبلاً ثبت‌نام شده است." }, { status: 409 });
    registrationId = crypto.randomUUID(); const now = Date.now();
    const receiptData = Buffer.from(await receipt.arrayBuffer()).toString("base64");
    const inserted = await sql`WITH claimed AS (
      UPDATE calorie_challenge_slots SET registration_id = ${registrationId}, reserved_at = ${now}
      WHERE id = (SELECT id FROM calorie_challenge_slots WHERE id <= ${CHALLENGE_CAPACITY} AND registration_id IS NULL ORDER BY id LIMIT 1)
      RETURNING id
    ) INSERT INTO calorie_challenge_registrations (id, slot_id, full_name, email, phone, receipt_name, receipt_type, receipt_data, status, created_at, updated_at)
      SELECT ${registrationId}, id, ${fullName}, ${email}, ${phone}, ${receipt.name.slice(0,160)}, ${receipt.type}, ${receiptData}, 'pending', ${now}, ${now} FROM claimed RETURNING id`;
    if (!inserted.length) return Response.json({ error: "ظرفیت چالش تکمیل شده است." }, { status: 409 });
    return Response.json({ ok: true, message: "درخواست شما ثبت شد. رسید حداکثر تا ۲۴ ساعت آینده بررسی و نتیجه به ایمیلتان ارسال می‌شود." }, { status: 201 });
  } catch (error) {
    console.error("challenge registration error", error);
    if (registrationId) try { await challengeDb()`UPDATE calorie_challenge_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ${registrationId}`; } catch {}
    return Response.json({ error: "ثبت اطلاعات انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
