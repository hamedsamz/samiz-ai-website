import { AI_VIDEO_COURSE_REGISTRATION_OPEN, COURSE_REGISTRATION_CLOSED_MESSAGE } from "../../../../lib/course-registration-status";
import { ensureAiVideoCourseSchema, type AiVideoCourseLocation } from "../../../../db/ai-video-course-registrations";
import { db } from "../../../../db/registrations";
import { AI_VIDEO_COURSE_PLANS, isAiVideoCoursePlan, normalizeAiVideoCourseEmail } from "../../../../lib/ai-video-course-config";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  if (!AI_VIDEO_COURSE_REGISTRATION_OPEN) {
    return Response.json({ error: COURSE_REGISTRATION_CLOSED_MESSAGE }, { status: 409 });
  }

  const requestId = crypto.randomUUID();
  console.info("[ai-video-registration] request started", { requestId });
  try {
    const form = await request.formData();
    const location = String(form.get("location") ?? "") as AiVideoCourseLocation;
    const plan = form.get("plan");
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/[\s()-]/g, "").trim();
    const email = normalizeAiVideoCourseEmail(form.get("email"));
    const emailConfirmation = normalizeAiVideoCourseEmail(form.get("emailConfirmation"));
    const telegramUsername = String(form.get("telegramUsername") ?? "").trim().replace(/^@/, "");
    const age = Number(String(form.get("age") ?? ""));
    const receipt = form.get("receipt");
    console.info("[ai-video-registration] form parsed", {
      requestId,
      location,
      receiptSize: receipt instanceof File ? receipt.size : 0,
      receiptType: receipt instanceof File ? receipt.type : "missing",
    });

    if (location !== "iran" && location !== "international") return Response.json({ error: "محل زندگی را انتخاب کنید." }, { status: 400 });
    if (!isAiVideoCoursePlan(plan)) return Response.json({ error: "یکی از دو پلن ثبت‌نام را انتخاب کنید." }, { status: 400 });
    if (fullName.length < 3 || fullName.length > 80) return Response.json({ error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    if (!Number.isInteger(age) || age < 12 || age > 100) return Response.json({ error: "سن معتبر وارد کنید." }, { status: 400 });
    if (!/^\+?[0-9۰-۹]{7,15}$/.test(phone)) return Response.json({ error: "شماره تماس دارای واتساپ را درست وارد کنید." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return Response.json({ error: "ایمیل معتبر وارد کنید." }, { status: 400 });
    if (email !== emailConfirmation) return Response.json({ error: "ایمیل و تکرار ایمیل یکسان نیستند." }, { status: 400 });
    if (telegramUsername.length > 80 || (telegramUsername && !/^[a-zA-Z0-9_]{5,80}$/.test(telegramUsername))) return Response.json({ error: "یوزرنیم تلگرام را بدون لینک و به شکل صحیح وارد کنید." }, { status: 400 });
    if (!(receipt instanceof File) || receipt.size === 0) return Response.json({ error: "تصویر رسید پرداخت را انتخاب کنید." }, { status: 400 });
    if (!allowedTypes.has(receipt.type) || receipt.size > 2.5 * 1024 * 1024) return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد." }, { status: 400 });

    await ensureAiVideoCourseSchema();
    const sql = db();
    const now = Date.now();
    const receiptData = Buffer.from(await receipt.arrayBuffer()).toString("base64");
    const paidAmount = AI_VIDEO_COURSE_PLANS[plan].fee;
    const inserted = await sql`INSERT INTO ai_video_course_registrations (
      id, location, plan, full_name, age, phone, email, telegram_username, paid_amount, payment_currency,
      receipt_name, receipt_type, receipt_data, status, created_at, updated_at
    ) VALUES (
      ${crypto.randomUUID()}, ${location}, ${plan}, ${fullName}, ${age}, ${phone}, ${email}, ${telegramUsername || null}, ${paidAmount}, 'toman',
      ${receipt.name.slice(0, 160)}, ${receipt.type}, ${receiptData}, 'pending', ${now}, ${now}
    ) ON CONFLICT DO NOTHING RETURNING id`;
    if (!inserted.length) {
      return Response.json({ error: "با این شماره تماس یا ایمیل قبلاً برای این نوبت دوره ثبت‌نام شده است." }, { status: 409 });
    }
    console.info("[ai-video-registration] request saved", { requestId, location, plan, paidAmount });
    return Response.json({ ok: true, message: "درخواست ثبت‌نام شما با موفقیت ثبت شد. نتیجه بررسی از طریق ایمیل اعلام می‌شود." }, { status: 201 });
  } catch (error) {
    console.error("[ai-video-registration] request failed", { requestId, error });
    return Response.json({ error: "ثبت اطلاعات انجام نشد. لطفاً دوباره تلاش کنید." }, { status: 500 });
  }
}
