import {
  COURSE2_CAPACITY,
  COURSE2_CHARITY_CAPACITY,
  COURSE2_FEE_TOMAN,
  course2CapacityStatus,
  ensureCourse2Schema,
  type Course2PaymentType,
} from "../../../../db/course2-registrations";
import { db } from "../../../../db/registrations";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const educationOptions = new Set(["دیپلم و پایین‌تر", "کاردانی", "کارشناسی", "کارشناسی ارشد", "دکتری", "سایر"]);

export async function POST(request: Request) {
  let registrationId: string | null = null;
  try {
    await ensureCourse2Schema();
    if ((await course2CapacityStatus()).full) return Response.json({ error: "ظرفیت دوره تکمیل شده است." }, { status: 409 });
    const form = await request.formData();
    const expectedPaymentType = String(form.get("paymentType") ?? "") as Course2PaymentType;
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/[\s()-]/g, "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const age = Number(String(form.get("age") ?? ""));
    const education = String(form.get("education") ?? "").trim();
    const specialty = String(form.get("specialty") ?? "").trim();
    const occupation = String(form.get("occupation") ?? "").trim();
    const charityName = String(form.get("charityName") ?? "").trim();
    const paidAmountInput = Number(String(form.get("paidAmount") ?? COURSE2_FEE_TOMAN));
    const receipt = form.get("receipt");

    if (expectedPaymentType !== "charity" && expectedPaymentType !== "card") return Response.json({ error: "نوع پرداخت نامعتبر است؛ صفحه را تازه‌سازی کنید." }, { status: 400 });
    if (fullName.length < 3 || fullName.length > 80) return Response.json({ error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    if (!Number.isInteger(age) || age < 12 || age > 100) return Response.json({ error: "سن معتبر وارد کنید." }, { status: 400 });
    if (!educationOptions.has(education)) return Response.json({ error: "میزان تحصیلات را انتخاب کنید." }, { status: 400 });
    if (specialty.length > 120 || occupation.length < 2 || occupation.length > 120) return Response.json({ error: "اطلاعات تخصص و شغل را بررسی کنید." }, { status: 400 });
    if (!/^\+?[0-9۰-۹]{7,15}$/.test(phone)) return Response.json({ error: "شماره تماس معتبر وارد کنید." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return Response.json({ error: "ایمیل معتبر وارد کنید." }, { status: 400 });
    if (expectedPaymentType === "charity" && (charityName.length < 2 || charityName.length > 160)) return Response.json({ error: "نام خیریه را وارد کنید." }, { status: 400 });
    if (expectedPaymentType === "charity" && (!Number.isInteger(paidAmountInput) || paidAmountInput < COURSE2_FEE_TOMAN || paidAmountInput > 1_000_000_000)) return Response.json({ error: "مبلغ پرداخت‌شده باید حداقل ۲ میلیون تومان باشد." }, { status: 400 });
    if (!(receipt instanceof File) || receipt.size === 0) return Response.json({ error: "تصویر رسید را انتخاب کنید." }, { status: 400 });
    if (!allowedTypes.has(receipt.type) || receipt.size > 2.5 * 1024 * 1024) return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد." }, { status: 400 });

    const sql = db();
    const duplicate = await sql`SELECT id FROM course2_registrations WHERE (phone = ${phone} OR email = ${email}) AND status IN ('pending', 'approved') LIMIT 1`;
    if (duplicate.length) return Response.json({ error: "با این شماره تماس یا ایمیل قبلاً در این دوره ثبت‌نام شده است." }, { status: 409 });

    registrationId = crypto.randomUUID();
    const now = Date.now();
    const receiptData = Buffer.from(await receipt.arrayBuffer()).toString("base64");
    const minSlot = expectedPaymentType === "charity" ? 1 : COURSE2_CHARITY_CAPACITY + 1;
    const maxSlot = expectedPaymentType === "charity" ? COURSE2_CHARITY_CAPACITY : COURSE2_CAPACITY;
    const inserted = await sql`WITH claimed AS (
      UPDATE course2_registration_slots SET registration_id = ${registrationId}, reserved_at = ${now}
      WHERE id = (SELECT id FROM course2_registration_slots WHERE id BETWEEN ${minSlot} AND ${maxSlot} AND registration_id IS NULL ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING id
    ) INSERT INTO course2_registrations (
      id, slot_id, payment_type, full_name, age, education, specialty, occupation, phone, email,
      charity_name, paid_amount, receipt_name, receipt_type, receipt_data, status, created_at, updated_at
    ) SELECT ${registrationId}, id, ${expectedPaymentType}, ${fullName}, ${age}, ${education}, ${specialty || null}, ${occupation}, ${phone}, ${email},
      ${expectedPaymentType === "charity" ? charityName : null}, ${expectedPaymentType === "charity" ? paidAmountInput : COURSE2_FEE_TOMAN}, ${receipt.name.slice(0, 160)}, ${receipt.type}, ${receiptData}, 'pending', ${now}, ${now}
      FROM claimed RETURNING id`;
    if (!inserted.length) {
      const status = await course2CapacityStatus();
      const message = expectedPaymentType === "charity" && status.charityFull
        ? "ظرفیت بخش خیریه همین حالا تکمیل شد. صفحه را تازه‌سازی کنید تا اطلاعات پرداخت مرحله دوم نمایش داده شود."
        : "ظرفیت این بخش تکمیل شده است؛ صفحه را تازه‌سازی کنید.";
      return Response.json({ error: message }, { status: 409 });
    }
    return Response.json({ ok: true, message: "رسید شما ثبت شد و حداکثر تا ۲۴ ساعت آینده بررسی می‌شود." }, { status: 201 });
  } catch (error) {
    console.error("course 2 registration error", error);
    if (registrationId) try { await db()`UPDATE course2_registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ${registrationId}`; } catch {}
    return Response.json({ error: "ثبت اطلاعات انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
