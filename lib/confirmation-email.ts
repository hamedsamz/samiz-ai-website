const COURSE_NAME = "ورود به دنیای هوش مصنوعی با یادگیری مهندسی پرامپت";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

export function confirmationMessage(fullName: string) {
  const safeName = escapeHtml(fullName);
  return {
    subject: `تأیید ثبت‌نام دوره «${COURSE_NAME}»`,
    html: `<!doctype html><html lang="fa" dir="rtl"><body style="margin:0;background:#090907;color:#f7f1e3;font-family:Tahoma,Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:36px 20px"><div style="border:1px solid #6f5625;border-radius:18px;background:#11110e;padding:32px"><p style="margin:0 0 18px;color:#d9aa49;font-size:13px;letter-spacing:2px">SAMIZ AI ACADEMY</p><h1 style="margin:0 0 22px;font-size:25px;line-height:1.8;color:#f3cf76">ثبت‌نام شما تأیید شد</h1><p style="font-size:16px;line-height:2;margin:0 0 14px">${safeName} عزیز،</p><p style="font-size:16px;line-height:2;margin:0 0 14px">ثبت‌نام شما در دوره «${COURSE_NAME}» با موفقیت تأیید شد.</p><div style="margin:24px 0;padding:18px;border-right:3px solid #d9aa49;background:#18150f"><strong style="color:#f3cf76">شروع دوره: ۱۰ مرداد</strong><br><span style="font-size:14px;line-height:2;color:#d3cbbb">دوره به‌صورت ضبط‌شده ارائه می‌شود، ویدیوها منظم بارگذاری خواهند شد و تیم مدرسین پاسخ‌گوی پرسش‌های شما خواهد بود.</span></div><p style="font-size:15px;line-height:2;margin:0 0 10px">لینک زیر مربوط به کانال رسمی تلگرام دوره است. برای دریافت ویدیوها و اطلاعیه‌های دوره، وارد کانال شوید:</p><a href="https://t.me/+2VNUldiOQTczNzdh" style="display:block;margin:14px 0 24px;padding:14px;text-align:center;background:#d9aa49;color:#090907;text-decoration:none;border-radius:10px;font-weight:bold">ورود به کانال تلگرام دوره</a><p style="font-size:14px;line-height:2;color:#aaa396;margin:0">اطلاعات تکمیلی دوره از طریق کانال و راه‌های ارتباطی ثبت‌شده برای شما ارسال خواهد شد.</p></div><p style="text-align:center;color:#746f65;font-size:12px;margin-top:18px">SAMIZ AI Academy</p></div></body></html>`,
  };
}

export async function sendConfirmationEmail(to: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const message = confirmationMessage(fullName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...message }),
  });
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`);
}

export async function sendConfirmationBatch(recipients: Array<{ email: string; fullName: string }>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email service is not configured");
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(recipients.map(recipient => ({
      from, to: [recipient.email], ...confirmationMessage(recipient.fullName),
    }))),
  });
  if (!response.ok) throw new Error(`Resend batch request failed (${response.status})`);
}
