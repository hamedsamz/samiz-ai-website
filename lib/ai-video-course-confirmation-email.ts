import { AI_VIDEO_COURSE_CHANNEL_URL, AI_VIDEO_COURSE_NAME } from "./ai-video-course-config";

type Recipient = { email: string; fullName: string };
type EmailKind = "confirmation" | "reminder";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function channelUrl() {
  if (!AI_VIDEO_COURSE_CHANNEL_URL || !/^https:\/\/t\.me\//.test(AI_VIDEO_COURSE_CHANNEL_URL)) {
    throw new Error("AI_VIDEO_COURSE_CHANNEL_URL is not configured");
  }
  return AI_VIDEO_COURSE_CHANNEL_URL;
}

function aiVideoCourseMessage(fullName: string, kind: EmailKind) {
  const safeName = escapeHtml(fullName);
  const url = channelUrl();
  const safeUrl = escapeHtml(url);
  const isReminder = kind === "reminder";
  const subject = isReminder
    ? `یادآوری مهم: ورود به کانال دوره «${AI_VIDEO_COURSE_NAME}»`
    : `تأیید ثبت‌نام دوره «${AI_VIDEO_COURSE_NAME}»`;
  const title = isReminder ? "یادآوری ورود به کانال دوره" : "ثبت‌نام شما تأیید شد";
  const intro = isReminder
    ? `این ایمیل برای یادآوری ورود شما به کانال اختصاصی دوره «${AI_VIDEO_COURSE_NAME}» ارسال شده است.`
    : `ثبت‌نام شما در دوره «${AI_VIDEO_COURSE_NAME}» با موفقیت تأیید شد.`;

  return {
    subject,
    text: `${fullName} عزیز،\n\n${intro}\n\nبرای ورود به کانال تلگرام از لینک زیر استفاده کنید:\n${url}\n\nجلسات و اطلاعیه‌های دوره فقط در کانال اختصاصی تلگرام منتشر می‌شوند. لطفاً همین حالا وارد کانال شوید.\n\nاین لینک مخصوص شرکت‌کنندگان تأییدشده است؛ لطفاً آن را در اختیار دیگران قرار ندهید.\n\nSAMIZ AI Academy`,
    html: `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f6f7;color:#111827;font-family:Tahoma,Arial,sans-serif" bgcolor="#f3f6f7">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">لینک مستقیم ورود به کانال اختصاصی دوره ساخت ویدیو با هوش مصنوعی</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f6f7" style="background-color:#f3f6f7">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:620px;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:18px">
        <tr><td align="right" style="padding:30px 26px;color:#111827">
          <p style="margin:0 0 14px;color:#087f8c;font-size:13px;font-weight:bold;letter-spacing:1px">SAMIZ AI ACADEMY × MAGE BAHRAMI</p>
          <h1 style="margin:0 0 18px;color:#9a5b08;font-size:25px;line-height:1.7">${title}</h1>
          <p style="margin:0 0 10px;color:#111827;font-size:16px;line-height:2">${safeName} عزیز،</p>
          <p style="margin:0 0 18px;color:#111827;font-size:16px;line-height:2">${intro}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td align="center" bgcolor="#45d6e5" style="background-color:#45d6e5;border-radius:10px">
              <a href="${safeUrl}" style="display:block;padding:16px 18px;color:#071014;font-size:17px;font-weight:bold;text-decoration:none">ورود به کانال تلگرام دوره</a>
            </td></tr>
          </table>
          <p style="margin:18px 0 7px;color:#334155;font-size:14px;line-height:1.9">اگر دکمه باز نشد، روی لینک مستقیم زیر بزنید یا آن را در مرورگر کپی کنید:</p>
          <p dir="ltr" style="margin:0 0 22px;padding:13px;background-color:#e8f7f9;border:1px solid #8fdce4;border-radius:8px;text-align:left;word-break:break-all">
            <a href="${safeUrl}" style="color:#075985;font-size:15px;font-weight:bold;text-decoration:underline">${safeUrl}</a>
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="background-color:#f8fafc;border-right:4px solid #0ea5b7">
            <tr><td style="padding:16px;color:#1f2937;font-size:15px;line-height:2">جلسات و اطلاعیه‌های دوره فقط در کانال اختصاصی تلگرام منتشر می‌شوند. لطفاً همین حالا وارد کانال شوید تا هیچ اطلاعیه‌ای را از دست ندهید.</td></tr>
          </table>
          <p style="margin:20px 0 0;color:#475569;font-size:13px;line-height:2">این لینک مخصوص شرکت‌کنندگان تأییدشده است؛ لطفاً آن را در اختیار دیگران قرار ندهید.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:#475569;font-size:12px">SAMIZ AI Academy</p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

export function aiVideoCourseConfirmationMessage(fullName: string) {
  return aiVideoCourseMessage(fullName, "confirmation");
}

export function aiVideoCourseReminderMessage(fullName: string) {
  return aiVideoCourseMessage(fullName, "reminder");
}

function emailSettings() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  return { apiKey, from };
}

async function sendOne(to: string, fullName: string, kind: EmailKind) {
  const { apiKey, from } = emailSettings();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...aiVideoCourseMessage(fullName, kind) }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
}

async function sendBatch(recipients: Recipient[], kind: EmailKind) {
  const { apiKey, from } = emailSettings();
  for (let start = 0; start < recipients.length; start += 100) {
    const batch = recipients.slice(start, start + 100);
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch.map(recipient => ({ from, to: [recipient.email], ...aiVideoCourseMessage(recipient.fullName, kind) }))),
    });
    if (!response.ok) throw new Error(`Resend batch request failed (${response.status})`);
  }
}

export async function sendAiVideoCourseConfirmationEmail(to: string, fullName: string) {
  await sendOne(to, fullName, "confirmation");
}

export async function sendAiVideoCourseReminderEmail(to: string, fullName: string) {
  await sendOne(to, fullName, "reminder");
}

export async function sendAiVideoCourseConfirmationBatch(recipients: Recipient[]) {
  await sendBatch(recipients, "confirmation");
}

export async function sendAiVideoCourseReminderBatch(recipients: Recipient[]) {
  await sendBatch(recipients, "reminder");
}
