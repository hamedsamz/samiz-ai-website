import { capacityStatus, db } from "../../../db/registrations";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  let registrationId: string | null = null;
  try {
    if ((await capacityStatus()).full) return Response.json({ error: "ظرفیت دوره تکمیل شده است." }, { status: 409 });
    const form = await request.formData();
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/[\s()-]/g, "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const receipt = form.get("receipt");
    if (fullName.length < 3 || fullName.length > 80) return Response.json({ error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    if (!/^\+?[0-9۰-۹]{7,15}$/.test(phone)) return Response.json({ error: "شماره تماس معتبر وارد کنید." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return Response.json({ error: "ایمیل معتبر وارد کنید." }, { status: 400 });
    if (!(receipt instanceof File) || receipt.size === 0) return Response.json({ error: "تصویر رسید را انتخاب کنید." }, { status: 400 });
    if (!allowedTypes.has(receipt.type) || receipt.size > 2.5 * 1024 * 1024) return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد." }, { status: 400 });

    const sql = db();
    const duplicate = await sql`SELECT id FROM registrations WHERE (phone = ${phone} OR email = ${email}) AND status IN ('pending', 'approved') LIMIT 1`;
    if (duplicate.length) return Response.json({ error: "با این شماره تماس یا ایمیل قبلاً ثبت‌نام شده است." }, { status: 409 });
    registrationId = crypto.randomUUID();
    const now = Date.now();
    const receiptData = Buffer.from(await receipt.arrayBuffer()).toString("base64");
    const inserted = await sql`WITH claimed AS (
      UPDATE registration_slots SET registration_id = ${registrationId}, reserved_at = ${now}
      WHERE id = (SELECT id FROM registration_slots WHERE registration_id IS NULL ORDER BY id LIMIT 1)
      RETURNING id
    ) INSERT INTO registrations (id, slot_id, full_name, phone, email, receipt_name, receipt_type, receipt_data, status, created_at, updated_at)
      SELECT ${registrationId}, id, ${fullName}, ${phone}, ${email}, ${receipt.name.slice(0, 160)}, ${receipt.type}, ${receiptData}, 'pending', ${now}, ${now} FROM claimed RETURNING id`;
    if (!inserted.length) return Response.json({ error: "ظرفیت دوره تکمیل شده است." }, { status: 409 });
    return Response.json({ ok: true, message: "رسید شما ثبت شد و تا ۲۴ ساعت آینده بررسی می‌شود." }, { status: 201 });
  } catch (error) {
    console.error("registration error", error);
    if (registrationId) try { await db()`UPDATE registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ${registrationId}`; } catch {}
    return Response.json({ error: "ثبت اطلاعات انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
