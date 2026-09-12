"use client";

import { useState, type FormEvent } from "react";
import {
  AI_VIDEO_COURSE_CARD_HOLDER,
  AI_VIDEO_COURSE_CARD_NUMBER,
  AI_VIDEO_COURSE_PAYMENT_TELEGRAM_URL,
} from "../../lib/ai-video-course-config";

type Location = "iran" | "international";

export default function VideoCourseRegistration() {
  const [location, setLocation] = useState<Location>("iran");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function copyCard() {
    await navigator.clipboard.writeText(AI_VIDEO_COURSE_CARD_NUMBER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("location", location);
    const response = await fetch("/api/ai-video-course/registration", { method: "POST", body: formData });
    const result = await response.json() as { message?: string; error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage({ text: result.error ?? "خطایی رخ داد؛ دوباره تلاش کنید.", error: true });
      return;
    }
    setMessage({ text: result.message ?? "درخواست شما ثبت شد." });
    form.reset();
    setFileName("");
  }

  return (
    <section className="avc-registration" id="registration">
      <aside className="avc-requirements" aria-label="پیش‌نیازهای ضروری دوره">
        <span aria-hidden="true">!</span>
        <div>
          <strong>پیش‌نیاز ضروری برای شرکت در دوره</strong>
          <p>برای شروع دوره، داشتن اکانت ChatGPT Plus و در انتهای دوره برای ساخت ویدیو، داشتن اشتراک یکی از پلتفرم‌های ارائه‌دهنده مدل‌های ساخت ویدیو مانند Higgsfield الزامی است.</p>
        </div>
      </aside>
      <div className="avc-registration-copy">
        <p className="avc-section-label">ثبت‌نام دوره</p>
        <h2>آماده‌ای کارگردانی کنی؟</h2>
        <p>محل زندگی خود را انتخاب کنید تا مبلغ و روش پرداخت مناسب نمایش داده شود.</p>
        <div className="avc-format-note">
          <small>نحوه برگزاری</small>
          <strong>ضبط‌شده و همیشه در دسترس</strong>
          <p>تمام جلسات در کانال اختصاصی تلگرام منتشر می‌شوند. بعد از تأیید رسید، لینک ورود به کانال از طریق ایمیل برایتان ارسال خواهد شد.</p>
        </div>
      </div>

      <div className="avc-form-card">
        <div className="avc-location-picker" role="radiogroup" aria-label="محل زندگی">
          <button type="button" role="radio" aria-checked={location === "iran"} className={location === "iran" ? "active" : ""} onClick={() => { setLocation("iran"); setMessage(null); }}><span>داخل ایران</span><small className="avc-picker-price"><del>۱۲۰ دلار</del><del>۹ میلیون تومان</del><b>۳ میلیون تومان</b></small></button>
          <button type="button" role="radio" aria-checked={location === "international"} className={location === "international" ? "active" : ""} onClick={() => { setLocation("international"); setMessage(null); }}><span>خارج از ایران</span><small>۱۲۰ تتر (USDT)</small></button>
        </div>

        {location === "iran" ? (
          <div className="avc-payment-card iran">
            <div><small>مبلغ ثبت‌نام</small><div><div className="avc-discount-price"><del>۱۲۰ دلار</del><del>۹,۰۰۰,۰۰۰ تومان</del><strong>۳,۰۰۰,۰۰۰ <i>تومان</i></strong></div><small className="avc-access-note">برای کسانی که توان پرداخت مبلغ دوره را ندارند</small></div></div>
            <p>مبلغ را به کارت زیر واریز کنید و سپس تصویر رسید را در فرم بارگذاری کنید.</p>
            <div className="avc-card-number" dir="ltr"><code>{AI_VIDEO_COURSE_CARD_NUMBER.replace(/(\d{4})(?=\d)/g, "$1 ")}</code><button type="button" onClick={copyCard}>{copied ? "کپی شد ✓" : "کپی شماره"}</button></div>
            <small className="avc-holder">به نام {AI_VIDEO_COURSE_CARD_HOLDER}</small>
          </div>
        ) : (
          <div className="avc-payment-card international">
            <div><small>مبلغ ثبت‌نام</small><strong>۱۲۰ <i>USDT</i></strong></div>
            <p>برای دریافت آدرس شبکه و جزئیات پرداخت تتر، در تلگرام به حامد پیام بدهید. بعد از پرداخت، رسید را در فرم زیر بارگذاری کنید.</p>
            <a href={AI_VIDEO_COURSE_PAYMENT_TELEGRAM_URL} target="_blank" rel="noreferrer">پیام در تلگرام · @hamedsamiz <span>↗</span></a>
          </div>
        )}

        <form onSubmit={submit}>
          <input type="hidden" name="location" value={location} />
          <div className="avc-field full"><label htmlFor="videoFullName">نام و نام خانوادگی</label><input id="videoFullName" name="fullName" required minLength={3} maxLength={80} autoComplete="name" placeholder="نام کامل خود را وارد کنید" /></div>
          <div className="avc-field"><label htmlFor="videoAge">سن</label><input id="videoAge" name="age" type="number" required min={12} max={100} inputMode="numeric" placeholder="مثلاً ۲۸" /></div>
          <div className="avc-field"><label htmlFor="videoPhone">شماره تماس دارای واتساپ</label><input id="videoPhone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="با کد کشور وارد کنید" /></div>
          <div className="avc-field"><label htmlFor="videoEmail">ایمیل</label><input id="videoEmail" name="email" type="email" required autoComplete="email" maxLength={160} placeholder="name@example.com" dir="ltr" /></div>
          <div className="avc-field"><label htmlFor="videoEmailConfirmation">تأیید ایمیل</label><input id="videoEmailConfirmation" name="emailConfirmation" type="email" required autoComplete="email" maxLength={160} placeholder="ایمیل را دوباره وارد کنید" dir="ltr" /></div>
          {location === "international" && <div className="avc-field full"><label htmlFor="videoTelegramUsername">یوزرنیم تلگرام <small>(اختیاری)</small></label><input id="videoTelegramUsername" name="telegramUsername" maxLength={80} placeholder="مثلاً hamedsamiz" dir="ltr" /></div>}
          <div className="avc-field full">
            <label htmlFor="videoReceipt">رسید پرداخت</label>
            <label className="avc-upload" htmlFor="videoReceipt"><span>{fileName || "انتخاب تصویر یا فایل رسید"}</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label>
            <input className="avc-file-input" id="videoReceipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setFileName(event.target.files?.[0]?.name ?? "")} />
          </div>
          <label className="avc-consent"><input type="checkbox" required /><span>تأیید می‌کنم اطلاعات واردشده صحیح است و پرداخت مربوط به ثبت‌نام همین دوره است.</span></label>
          <button className="avc-submit" disabled={busy}>{busy ? "در حال ثبت درخواست…" : "ارسال رسید و ثبت درخواست"}<span>↙</span></button>
          <div className="avc-review-note">
            <span aria-hidden="true">✓</span>
            <div><strong>بررسی رسید حداکثر تا ۴۸ ساعت</strong><p>پس از تأیید، ایمیل ثبت‌نام و لینک ورود به کانال اختصاصی دوره ارسال می‌شود. پوشه Spam را هم بررسی کنید.</p></div>
          </div>
          {message && <p className={message.error ? "avc-message error" : "avc-message success"}>{message.text}</p>}
        </form>
      </div>
    </section>
  );
}
