import { AI_VIDEO_COURSE_CHANNEL_URL, AI_VIDEO_COURSE_NAME } from "./ai-video-course-config";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function channelUrl() {
  if (!AI_VIDEO_COURSE_CHANNEL_URL || !/^https:\/\/t\.me\//.test(AI_VIDEO_COURSE_CHANNEL_URL)) {
    throw new Error("AI_VIDEO_COURSE_CHANNEL_URL is not configured");
  }
  return AI_VIDEO_COURSE_CHANNEL_URL;
}

export function aiVideoCourseConfirmationMessage(fullName: string) {
  const safeName = escapeHtml(fullName);
  const safeUrl = escapeHtml(channelUrl());
  return {
    subject: `تأیید ثبت‌نام دوره «${AI_VIDEO_COURSE_NAME}»`,
    html: `<!doctype html><html lang="fa" dir="rtl"><body style="margin:0;background:#050708;color:#f2f6f4;font-family:Tahoma,Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:36px 20px"><div style="border:1px solid #24535a;border-radius:20px;background:#091014;padding:34px"><p style="margin:0 0 18px;color:#75dee7;font-size:12px;letter-spacing:2px">SAMIZ AI ACADEMY × MAGE BAHRAMI</p><h1 style="margin:0 0 22px;font-size:26px;line-height:1.8;color:#f0b86a">ثبت‌نام شما تأیید شد</h1><p style="font-size:16px;line-height:2;margin:0 0 14px">${safeName} عزیز،</p><p style="font-size:16px;line-height:2;margin:0 0 14px">ثبت‌نام شما در دوره «${AI_VIDEO_COURSE_NAME}» با موفقیت تأیید شد.</p><div style="margin:24px 0;padding:18px;border-right:3px solid #75dee7;background:#0d1b20"><strong style="color:#f0b86a">دوره به‌صورت ضبط‌شده برگزار می‌شود</strong><br><span style="font-size:14px;line-height:2;color:#b9c9cc">جلسات و اطلاعیه‌های دوره در کانال اختصاصی تلگرام منتشر می‌شوند.</span></div><a href="${safeUrl}" style="display:block;margin:14px 0 24px;padding:15px;text-align:center;background:linear-gradient(90deg,#75dee7,#f0b86a);color:#071014;text-decoration:none;border-radius:10px;font-weight:bold">ورود به کانال اختصاصی دوره</a><p style="font-size:13px;line-height:2;color:#83979b;margin:0">این لینک مخصوص شرکت‌کنندگان تأییدشده است؛ لطفاً آن را در اختیار دیگران قرار ندهید.</p></div><p style="text-align:center;color:#607074;font-size:12px;margin-top:18px">SAMIZ AI Academy</p></div></body></html>`,
  };
}

export async function sendAiVideoCourseConfirmationEmail(to: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...aiVideoCourseConfirmationMessage(fullName) }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
}

export async function sendAiVideoCourseConfirmationBatch(recipients: Array<{ email: string; fullName: string }>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(recipients.map(recipient => ({ from, to: [recipient.email], ...aiVideoCourseConfirmationMessage(recipient.fullName) }))),
  });
  if (!response.ok) throw new Error(`Resend batch request failed (${response.status})`);
}
