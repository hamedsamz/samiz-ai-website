function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

const TELEGRAM_CHANNEL = "https://t.me/+TeP6f6GhlFIyY2Nk";

export function challengeConfirmationMessage(fullName: string) {
  const safeName = escapeHtml(fullName);
  return {
    subject: "تأیید ثبت‌نام چالش ۴۰ روزه کالری‌شماری",
    html: `<!doctype html><html lang="fa" dir="rtl"><body style="margin:0;background:#090907;color:#f7f1e3;font-family:Tahoma,Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:36px 20px"><div style="border:1px solid #6f5625;border-radius:18px;background:#11110e;padding:32px"><p style="margin:0 0 18px;color:#d9aa49;font-size:13px;letter-spacing:2px">SAMIZ AI</p><h1 style="margin:0 0 22px;font-size:25px;line-height:1.8;color:#f3cf76">ثبت‌نام شما تأیید شد 🌱</h1><p style="font-size:16px;line-height:2;margin:0 0 14px">${safeName} عزیز،</p><p style="font-size:16px;line-height:2;margin:0 0 14px">رسید پرداخت شما تأیید شد و ثبت‌نامتان در چالش ۴۰ روزه کالری‌شماری قطعی است.</p><div style="margin:24px 0;padding:18px;border-right:3px solid #d9aa49;background:#18150f"><strong style="color:#f3cf76">قدم بعدی: ورود به کانال چالش</strong><br><span style="font-size:14px;line-height:2;color:#d3cbbb">برنامه شروع، اطلاعیه‌ها و راهنمای دسترسی به اپ فارسی اختصاصی در کانال تلگرام چالش منتشر می‌شود.</span></div><a href="${TELEGRAM_CHANNEL}" style="display:block;margin:18px 0 26px;padding:15px;text-align:center;background:#d9aa49;color:#090907;text-decoration:none;border-radius:10px;font-weight:bold">ورود به کانال تلگرام چالش</a><p style="font-size:13px;line-height:2;color:#aaa396;margin:0 0 18px">اگر دکمه بالا باز نشد، این لینک را در مرورگر خود وارد کنید:<br><span dir="ltr" style="color:#f3cf76">${TELEGRAM_CHANNEL}</span></p><p style="font-size:14px;line-height:2;color:#aaa396;margin:0">با احترام<br>تیم چالش تغییر سبک زندگی</p></div><p style="text-align:center;color:#746f65;font-size:12px;margin-top:18px">SAMIZ AI</p></div></body></html>`,
  };
}

export async function sendChallengeConfirmationEmail(to: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const message = challengeConfirmationMessage(fullName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...message }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
}
