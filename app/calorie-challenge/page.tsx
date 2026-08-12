"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import "./challenge.css";

type Capacity = { remaining: number; capacity: number; full: boolean };
const PAYMENT_EMAIL = "samizadehhamed24@gmail.com";

export default function CalorieChallengePage() {
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => { fetch("/api/calorie-challenge/status").then(r => r.json()).then(setCapacity).catch(() => null); }, []);

  function validateEmailMatch(form: HTMLFormElement | null) {
    if (!form) return;
    const email = form.elements.namedItem("email") as HTMLInputElement | null;
    const confirmation = form.elements.namedItem("confirmEmail") as HTMLInputElement | null;
    if (email && confirmation) confirmation.setCustomValidity(confirmation.value && email.value.trim() !== confirmation.value.trim() ? "ایمیل‌ها باید دقیقاً یکسان باشند." : "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (String(data.get("email") ?? "").trim() !== String(data.get("confirmEmail") ?? "").trim()) {
      setMessage({ text: "ایمیل و تکرار ایمیل باید دقیقاً یکسان باشند.", error: true });
      form.querySelector<HTMLInputElement>("#confirmEmail")?.focus(); return;
    }
    setBusy(true); setMessage(null);
    const response = await fetch("/api/calorie-challenge", { method: "POST", body: data });
    const result = await response.json() as { message?: string; error?: string }; setBusy(false);
    if (!response.ok) return setMessage({ text: result.error ?? "ثبت اطلاعات انجام نشد. دوباره تلاش کنید.", error: true });
    setMessage({ text: result.message ?? "درخواست ثبت‌نام شما دریافت شد." }); form.reset();
    setCapacity(await fetch("/api/calorie-challenge/status").then(r => r.json()));
  }

  return <main className="challenge-page" dir="rtl">
    <header className="challenge-header"><Link href="/" className="challenge-logo"><span>S</span><b>SAMIZ AI</b></Link><Link href="/" className="challenge-back">بازگشت به سایت</Link></header>
    <section className="challenge-hero">
      <div><p className="eyebrow">چالش تغییر سبک زندگی</p><h1>چالش ۴۰ روزه<br/><em>کالری‌شماری اصولی</em></h1><p>اگر از رژیم‌های سخت و شروع‌کردن‌های دوباره خسته شده‌ای، این چالش کمک می‌کند با کسری کالری، عادت‌های قابل‌ادامه و توجه به ذهن، مسیر واقعی خودت را بسازی.</p></div>
      <div className="challenge-price"><span>هزینه ثبت‌نام</span><strong>۸۵ <small>دلار کانادا</small></strong><div><b>{capacity ? capacity.remaining : "—"}</b><span>ظرفیت باقی‌مانده از ۳۰ نفر</span></div></div>
    </section>
    <section className="challenge-benefits" aria-label="امکانات چالش">
      <article><span>۰۱</span><h2>اپ فارسی اختصاصی</h2><p>دسترسی به اپلیکیشن فارسی کالری‌شماری ویژه اعضای گروه برای ثبت وعده‌ها و پیگیری روند.</p></article>
      <article><span>۰۲</span><h2>ذهن‌آگاهی و CBT</h2><p>حضور روان‌شناس دارای مدرک فوق‌لیسانس روان‌شناسی و آموزش‌هایی برای ذهن‌آگاهی و رویکرد CBT.</p></article>
      <article><span>۰۳</span><h2>حمایت گروهی ۴۰ روزه</h2><p>همراهی در فضای گروه، تمرکز روی تغذیه، فعالیت، عادت‌ها و ذهنیت برای ساختن مسیری قابل‌ادامه.</p></article>
    </section>
    <section className="challenge-registration">
      <aside><p className="eyebrow">مراحل ثبت‌نام</p><h2>جای خودت را رزرو کن</h2><ol>
        <li><span>۱</span><div><b>پرداخت ۸۵ دلار کانادا</b><p>مبلغ را با e‑Transfer به آدرس زیر ارسال کن.</p><code>{PAYMENT_EMAIL}</code></div></li>
        <li><span>۲</span><div><b>تکمیل اطلاعات</b><p>فرم را دقیق پر کن و تصویر رسید پرداخت را بفرست.</p></div></li>
        <li><span>۳</span><div><b>بررسی و تأیید</b><p>پس از تأیید رسید، نتیجه و اطلاعات ادامه مسیر به ایمیلت فرستاده می‌شود.</p></div></li>
      </ol><div className="challenge-disclaimer"><b>مهم:</b> این چالش جایگزین خدمات پزشکی یا درمانی نیست. اگر بیماری زمینه‌ای، بارداری، اختلال خوردن یا داروی مؤثر بر وزن داری، پیش از شرکت با پزشک خود مشورت کن.</div></aside>
      <div className="challenge-form-card">{capacity?.full ? <div className="full-state"><span>ظرفیت تکمیل شد</span><h2>ثبت‌نام این چالش بسته شده است.</h2></div> : <form onSubmit={submit}>
        <div className="form-title"><span>۱</span><div><b>اطلاعات تماس</b><small>برای تأیید ثبت‌نام و ارتباط با شما</small></div></div>
        <div><label htmlFor="fullName">نام و نام خانوادگی</label><input id="fullName" name="fullName" required minLength={3} maxLength={80} autoComplete="name" placeholder="نام کامل خود را وارد کنید"/></div>
        <div className="field-grid"><div><label htmlFor="email">ایمیل</label><input id="email" name="email" type="email" required maxLength={160} autoComplete="email" placeholder="name@example.com" onInput={e=>validateEmailMatch(e.currentTarget.form)}/></div><div><label htmlFor="confirmEmail">تکرار ایمیل</label><input id="confirmEmail" name="confirmEmail" type="email" required maxLength={160} autoComplete="off" placeholder="ایمیل را دوباره وارد کنید" onInput={e=>validateEmailMatch(e.currentTarget.form)}/></div></div>
        <div><label htmlFor="phone">شماره تماس</label><input id="phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="مثلاً +1 780 000 0000"/></div>
        <div className="app-data-note"><b>اطلاعات برنامه داخل اپ ثبت می‌شود</b><span>سن، قد، وزن و اطلاعات موردنیاز کالری‌شماری را بعد از تأیید ثبت‌نام، مستقیماً داخل اپ فارسی وارد می‌کنید.</span></div>
        <div className="form-title"><span>۲</span><div><b>رسید پرداخت</b><small>برای بررسی نهایی ثبت‌نام</small></div></div>
        <div><label htmlFor="receipt">آپلود رسید e‑Transfer</label><label className="upload-box" htmlFor="receipt"><span>انتخاب تصویر یا فایل رسید</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label><input className="file-input" id="receipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf"/></div>
        <label className="consent"><input type="checkbox" required/><span>تأیید می‌کنم بالای ۱۸ سال هستم و می‌دانم این چالش جایگزین توصیه یا درمان پزشکی نیست.</span></label>
        <label className="consent"><input type="checkbox" required/><span>با ذخیره و استفاده از نام، ایمیل و شماره تماس فقط برای بررسی ثبت‌نام و ارتباط درباره این چالش موافقم.</span></label>
        <button className="gold-button submit-button" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال رسید و ثبت درخواست"}</button>{message&&<p className={message.error?"form-message error":"form-message success"}>{message.text}</p>}
      </form>}</div>
    </section>
  </main>;
}
