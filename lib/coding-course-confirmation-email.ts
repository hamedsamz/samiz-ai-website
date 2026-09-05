import { CODING_COURSE_CHANNEL_URL, CODING_COURSE_NAME, CODING_COURSE_START_DATE } from "./coding-course-config";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function channelUrl() {
  if (!CODING_COURSE_CHANNEL_URL || !/^https:\/\/t\.me\//.test(CODING_COURSE_CHANNEL_URL)) {
    throw new Error("CODING_COURSE_CHANNEL_URL is not configured");
  }
  return CODING_COURSE_CHANNEL_URL;
}

export function codingCourseConfirmationMessage(fullName: string) {
  const safeName = escapeHtml(fullName);
  const safeUrl = escapeHtml(channelUrl());
  return {
    subject: `تأیید ثبت‌نام دوره «${CODING_COURSE_NAME}»`,
    html: `<!doctype html><html lang="fa" dir="rtl"><body style="margin:0;background:#05080b;color:#eef6f7;font-family:Tahoma,Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:36px 20px"><div style="border:1px solid #1b5964;border-radius:20px;background:#091014;padding:34px"><p style="margin:0 0 18px;color:#65d8e7;font-size:12px;letter-spacing:2px">SAMIZ AI ACADEMY × DR. HADI ROSHAN</p><h1 style="margin:0 0 22px;font-size:26px;line-height:1.8;color:#f2ce76">ثبت‌نام شما تأیید شد</h1><p style="font-size:16px;line-height:2;margin:0 0 14px">${safeName} عزیز،</p><p style="font-size:16px;line-height:2;margin:0 0 14px">ثبت‌نام شما در دوره «${CODING_COURSE_NAME}» با موفقیت تأیید شد.</p><div style="margin:24px 0;padding:18px;border-right:3px solid #65d8e7;background:#0d1b20"><strong style="color:#f2ce76">شروع دوره: ${CODING_COURSE_START_DATE}</strong><br><span style="font-size:14px;line-height:2;color:#b9c9cc">جلسات دوره در کانال اختصاصی تلگرام منتشر می‌شوند. اطلاعیه‌ها و برنامه انتشار نیز از همین کانال در دسترس شماست.</span></div><a href="${safeUrl}" style="display:block;margin:14px 0 24px;padding:15px;text-align:center;background:linear-gradient(90deg,#65d8e7,#f2ce76);color:#071014;text-decoration:none;border-radius:10px;font-weight:bold">ورود به کانال اختصاصی دوره</a><p style="font-size:13px;line-height:2;color:#83979b;margin:0">این لینک مخصوص شرکت‌کنندگان تأییدشده دوره است؛ لطفاً آن را در اختیار دیگران قرار ندهید.</p></div><p style="text-align:center;color:#607074;font-size:12px;margin-top:18px">SAMIZ AI Academy</p></div></body></html>`,
  };
}

export async function sendCodingCourseConfirmationEmail(to: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...codingCourseConfirmationMessage(fullName) }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
}

export async function sendCodingCourseConfirmationBatch(recipients: Array<{ email: string; fullName: string }>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(recipients.map(recipient => ({ from, to: [recipient.email], ...codingCourseConfirmationMessage(recipient.fullName) }))),
  });
  if (!response.ok) throw new Error(`Resend batch request failed (${response.status})`);
}
