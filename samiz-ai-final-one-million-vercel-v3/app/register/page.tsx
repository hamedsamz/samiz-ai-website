"use client";

import { useEffect, useState, type FormEvent } from "react";
import "./register-details.css";

type Capacity = { remaining: number; capacity: number; full: boolean };

export default function RegisterPage() {
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => { fetch("/api/registration/status").then(r => r.json()).then(setCapacity).catch(() => null); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const form = event.currentTarget;
    const response = await fetch("/api/registration", { method: "POST", body: new FormData(form) });
    const result = await response.json() as { message?: string; error?: string };
    setBusy(false);
    if (!response.ok) return setMessage({ text: result.error ?? "خطایی رخ داد.", error: true });
    setMessage({ text: result.message ?? "ثبت‌نام انجام شد." });
    form.reset();
    const status = await fetch("/api/registration/status").then(r => r.json()); setCapacity(status);
  }

  return <main className="registration-page fa" dir="rtl">
    <header className="registration-header"><a href="/" className="registration-logo"><span className="mini-mark">S</span><b>SAMIZ AI</b></a><a href="/" className="back-link">بازگشت به سایت</a></header>
    <section className="registration-shell">
      <div className="registration-intro">
        <p className="eyebrow">SAMIZ AI ACADEMY</p>
        <h1>ثبت‌نام دوره مقدماتی مهندسی پرامپت</h1>
        <p>در این دوره، هزینه ثبت‌نام مستقیماً توسط شما به یک مؤسسه خیریه پرداخت می‌شود. برای رزرو جای خود، مراحل زیر را انجام دهید.</p>

        <div className="donation-highlight">
          <span>حداقل مبلغ حمایت</span>
          <strong>یک میلیون تومان</strong>
          <p>پرداخت مستقیم به یکی از مؤسسات خیریه معتبر داخل کشور؛ ترجیحاً مؤسسات فعال در مناطق جنوب کشور.</p>
        </div>

        <div className="registration-steps">
          <h2>مراحل ثبت‌نام</h2>
          <ol>
            <li><b>انتخاب خیریه</b><span>یک مؤسسه خیریه معتبر را انتخاب کنید.</span></li>
            <li><b>انجام پرداخت</b><span>حداقل مبلغ اعلام‌شده را مستقیماً به خیریه بپردازید.</span></li>
            <li><b>ارسال رسید</b><span>فرم روبه‌رو را تکمیل و تصویر رسید را بارگذاری کنید.</span></li>
          </ol>
        </div>

        <div className="course-outline">
          <div><span>سرفصل‌های اولیه دوره</span><small>این بخش بعداً تکمیل و به‌روزرسانی می‌شود.</small></div>
          <ul>
            <li>اصول پرامپت‌نویسی و ساختار یک درخواست حرفه‌ای</li>
            <li>ایده‌پردازی و تولید محتوا با ابزارهای هوش مصنوعی</li>
            <li>ساخت تصویر و ویدیوهای تبلیغاتی با AI</li>
            <li>طراحی فرایند کاری و مسیرهای درآمدزایی</li>
          </ul>
        </div>

        <div className="capacity-card"><span>ظرفیت باقی‌مانده</span><strong>{capacity ? `${capacity.remaining} از ${capacity.capacity}` : "در حال بررسی…"}</strong><small>رسید شما حداکثر تا ۲۴ ساعت بررسی می‌شود.</small></div>
      </div>
      <div className="registration-form-card">
        {capacity?.full ? <div className="full-state"><span>ظرفیت تکمیل شد</span><h2>ثبت‌نام این دوره بسته شده است.</h2><p>در صورت آزادشدن ظرفیت، فرم دوباره فعال می‌شود.</p></div> : <form onSubmit={submit}>
          <div><label htmlFor="fullName">نام و نام خانوادگی</label><input id="fullName" name="fullName" required minLength={3} maxLength={80} placeholder="نام کامل خود را وارد کنید" /></div>
          <div><label htmlFor="phone">شماره تماس دارای واتساپ</label><input id="phone" name="phone" type="tel" required inputMode="tel" placeholder="مثلاً 09123456789" /></div>
          <div><label htmlFor="email">ایمیل</label><input id="email" name="email" type="email" required autoComplete="email" maxLength={160} placeholder="مثلاً name@example.com" /></div>
          <div><label htmlFor="receipt">آپلود رسید خیریه</label><label className="upload-box" htmlFor="receipt"><span>انتخاب تصویر یا فایل رسید</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label><input className="file-input" id="receipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" /></div>
          <label className="consent"><input type="checkbox" required /><span>تأیید می‌کنم این رسید مربوط به پرداخت من به یک مؤسسه خیریه است.</span></label>
          <button className="gold-button submit-button" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال رسید و ثبت درخواست"}</button>
          {message && <p className={message.error ? "form-message error" : "form-message success"}>{message.text}</p>}
        </form>}
      </div>
    </section>
  </main>;
}
