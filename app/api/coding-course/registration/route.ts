import { ensureCodingCourseSchema, type CodingCourseLocation } from "../../../../db/coding-course-registrations";
import { db } from "../../../../db/registrations";
import { CODING_COURSE_INTERNATIONAL_FEE, CODING_COURSE_IRAN_FEE } from "../../../../lib/coding-course-config";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  try {
    await ensureCodingCourseSchema();
    const form = await request.formData();
    const location = String(form.get("location") ?? "") as CodingCourseLocation;
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/[\s()-]/g, "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const emailConfirmation = String(form.get("emailConfirmation") ?? "").trim().toLowerCase();
    const telegramUsername = String(form.get("telegramUsername") ?? "").trim().replace(/^@/, "");
    const age = Number(String(form.get("age") ?? ""));
    const receipt = form.get("receipt");

    if (location !== "iran" && location !== "international") return Response.json({ error: "محل زندگی را انتخاب کنید." }, { status: 400 });
    if (fullName.length < 3 || fullName.length > 80) return Response.json({ error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    if (!Number.isInteger(age) || age < 12 || age > 100) return Response.json({ error: "سن معتبر وارد کنید." }, { status: 400 });
    if (!/^\+?[0-9۰-۹]{7,15}$/.test(phone)) return Response.json({ error: "شماره تماس دارای واتساپ را درست وارد کنید." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return Response.json({ error: "ایمیل معتبر وارد کنید." }, { status: 400 });
    if (email !== emailConfirmation) return Response.json({ error: "ایمیل و تکرار ایمیل یکسان نیستند." }, { status: 400 });
    if (telegramUsername.length > 80 || (telegramUsername && !/^[a-zA-Z0-9_]{5,80}$/.test(telegramUsername))) return Response.json({ error: "یوزرنیم تلگرام را بدون لینک و به شکل صحیح وارد کنید." }, { status: 400 });
    if (!(receipt instanceof File) || receipt.size === 0) return Response.json({ error: "تصویر رسید پرداخت را انتخاب کنید." }, { status: 400 });
    if (!allowedTypes.has(receipt.type) || receipt.size > 2.5 * 1024 * 1024) return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد." }, { status: 400 });

    const sql = db();
    const duplicate = await sql`SELECT id FROM coding_course_registrations WHERE (phone = ${phone} OR email = ${email}) AND status IN ('pending', 'approved') LIMIT 1`;
    if (duplicate.length) return Response.json({ error: "با این شماره تماس یا ایمیل قبلاً برای این دوره ثبت‌نام شده است." }, { status: 409 });

    const now = Date.now();
    const receiptData = Buffer.from(await receipt.arrayBuffer()).toString("base64");
    const paidAmount = location === "iran" ? CODING_COURSE_IRAN_FEE : CODING_COURSE_INTERNATIONAL_FEE;
    const paymentCurrency = location === "iran" ? "toman" : "usdt";
    await sql`INSERT INTO coding_course_registrations (
      id, location, full_name, age, phone, email, telegram_username, paid_amount, payment_currency,
      receipt_name, receipt_type, receipt_data, status, created_at, updated_at
    ) VALUES (
      ${crypto.randomUUID()}, ${location}, ${fullName}, ${age}, ${phone}, ${email}, ${telegramUsername || null}, ${paidAmount}, ${paymentCurrency},
      ${receipt.name.slice(0, 160)}, ${receipt.type}, ${receiptData}, 'pending', ${now}, ${now}
    )`;
    return Response.json({ ok: true, message: "درخواست ثبت‌نام شما با موفقیت ثبت شد. نتیجه بررسی از طریق ایمیل اعلام می‌شود." }, { status: 201 });
  } catch (error) {
    console.error("coding course registration error", error);
    return Response.json({ error: "ثبت اطلاعات انجام نشد. لطفاً دوباره تلاش کنید." }, { status: 500 });
  }
}
