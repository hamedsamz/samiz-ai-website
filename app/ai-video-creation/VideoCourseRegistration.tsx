"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  AI_VIDEO_COURSE_CARD_HOLDER,
  AI_VIDEO_COURSE_CARD_NUMBER,
  AI_VIDEO_COURSE_PAYMENT_TELEGRAM_URL,
  AI_VIDEO_COURSE_SUPPORT_DISCOUNT_CODE,
} from "../../lib/ai-video-course-config";

type Location = "iran" | "international";
const MAX_RECEIPT_SIZE = 2.5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export default function VideoCourseRegistration() {
  const [location, setLocation] = useState<Location>("iran");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountMessage, setDiscountMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function copyCard() {
    await navigator.clipboard.writeText(AI_VIDEO_COURSE_CARD_NUMBER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function applyDiscountCode() {
    const isValid = discountCode.trim().toLocaleLowerCase("en-US") === AI_VIDEO_COURSE_SUPPORT_DISCOUNT_CODE.toLocaleLowerCase("en-US");
    setDiscountApplied(isValid);
    setDiscountMessage(isValid
      ? { text: "کد تخفیف حمایتی اعمال شد؛ مبلغ قابل پرداخت ۳ میلیون تومان است." }
      : { text: "کد تخفیف معتبر نیست. عبارت Mehr را وارد کنید.", error: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("location", location);
    formData.set("discountCode", location === "iran" && discountApplied ? discountCode.trim() : "");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

    try {
      const response = await fetch("/api/ai-video-course/registration", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok) {
        setMessage({ text: result.error ?? "ارسال فرم کامل نشد. حجم و فرمت رسید را بررسی و دوباره تلاش کنید.", error: true });
        return;
      }
      setMessage({ text: result.message ?? "درخواست شما ثبت شد." });
      form.reset();
      setFileName("");
      setDiscountCode("");
      setDiscountApplied(false);
      setDiscountMessage(null);
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setMessage({
        text: timedOut
          ? "ارسال درخواست بیشتر از حد معمول طول کشید. اینترنت خود را بررسی کنید و دوباره بزنید؛ اگر درخواست قبلی ثبت شده باشد، سیستم به شما اطلاع می‌دهد."
          : "ارتباط با سرور قطع شد. اینترنت خود را بررسی کنید و دوباره روی ثبت درخواست بزنید.",
        error: true,
      });
    } finally {
      window.clearTimeout(timeoutId);
      setBusy(false);
    }
  }

  function selectReceipt(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setMessage(null);
    if (!file) {
      setFileName("");
      return;
    }
    if (!ALLOWED_RECEIPT_TYPES.has(file.type) || file.size > MAX_RECEIPT_SIZE) {
      event.currentTarget.value = "";
      setFileName("");
      setMessage({ text: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد.", error: true });
      return;
    }
    setFileName(file.name);
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
          <button type="button" role="radio" aria-checked={location === "iran"} className={location === "iran" ? "active" : ""} onClick={() => { setLocation("iran"); setMessage(null); }}><span>داخل ایران</span><small>قیمت اصلی: ۹ میلیون تومان</small></button>
          <button type="button" role="radio" aria-checked={location === "international"} className={location === "international" ? "active" : ""} onClick={() => { setLocation("international"); setMessage(null); setDiscountApplied(false); setDiscountMessage(null); }}><span>خارج از ایران</span><small>۱۲۰ تتر (USDT)</small></button>
        </div>

        {location === "iran" ? (
          <div className="avc-payment-card iran">
            <div className="avc-payment-heading">
              <small>{discountApplied ? "مبلغ پس از تخفیف حمایتی" : "قیمت اصلی دوره"}</small>
              {discountApplied ? <div className="avc-applied-price"><del>۹,۰۰۰,۰۰۰ تومان</del><strong>۳,۰۰۰,۰۰۰ <i>تومان</i></strong></div> : <strong>۹,۰۰۰,۰۰۰ <i>تومان</i></strong>}
            </div>
            <p className="avc-supportive-copy">با توجه به شرایط کشور، اگر قادر به پرداخت مبلغ کامل نیستید، جهت بهره‌مندی از تخفیف حمایتی ۶۶٫۶۷٪ و پرداخت ۳ میلیون تومان، کد <code dir="ltr">Mehr</code> را وارد کنید.</p>
            <div className="avc-coupon">
              <label htmlFor="videoDiscountCode">کد تخفیف حمایتی</label>
              <div>
                <input id="videoDiscountCode" value={discountCode} onChange={event => { setDiscountCode(event.target.value); setDiscountApplied(false); setDiscountMessage(null); }} placeholder="Mehr" dir="ltr" autoComplete="off" />
                <button type="button" onClick={applyDiscountCode}>{discountApplied ? "اعمال شد ✓" : "اعمال کد"}</button>
              </div>
              {discountMessage && <p className={`avc-coupon-message ${discountMessage.error ? "error" : "success"}`} aria-live="polite">{discountMessage.text}</p>}
            </div>
            <p>{discountApplied ? "مبلغ حمایتی ۳ میلیون تومان" : "قیمت اصلی ۹ میلیون تومان"} را به کارت زیر واریز کنید و سپس تصویر رسید را در فرم بارگذاری کنید.</p>
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
          <input type="hidden" name="discountCode" value={location === "iran" && discountApplied ? discountCode.trim() : ""} />
          <div className="avc-field full"><label htmlFor="videoFullName">نام و نام خانوادگی</label><input id="videoFullName" name="fullName" required minLength={3} maxLength={80} autoComplete="name" placeholder="نام کامل خود را وارد کنید" /></div>
          <div className="avc-field"><label htmlFor="videoAge">سن</label><input id="videoAge" name="age" type="number" required min={12} max={100} inputMode="numeric" placeholder="مثلاً ۲۸" /></div>
          <div className="avc-field"><label htmlFor="videoPhone">شماره تماس دارای واتساپ</label><input id="videoPhone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="با کد کشور وارد کنید" /></div>
          <div className="avc-field"><label htmlFor="videoEmail">ایمیل</label><input id="videoEmail" name="email" type="email" required autoComplete="email" maxLength={160} placeholder="name@example.com" dir="ltr" /></div>
          <div className="avc-field"><label htmlFor="videoEmailConfirmation">تأیید ایمیل</label><input id="videoEmailConfirmation" name="emailConfirmation" type="email" required autoComplete="email" maxLength={160} placeholder="ایمیل را دوباره وارد کنید" dir="ltr" /></div>
          {location === "international" && <div className="avc-field full"><label htmlFor="videoTelegramUsername">یوزرنیم تلگرام <small>(اختیاری)</small></label><input id="videoTelegramUsername" name="telegramUsername" maxLength={80} placeholder="مثلاً hamedsamiz" dir="ltr" /></div>}
          <div className="avc-field full">
            <label htmlFor="videoReceipt">رسید پرداخت</label>
            <label className="avc-upload" htmlFor="videoReceipt"><span>{fileName || "انتخاب تصویر یا فایل رسید"}</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label>
            <input className="avc-file-input" id="videoReceipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={selectReceipt} />
          </div>
          <label className="avc-consent"><input type="checkbox" required /><span>تأیید می‌کنم اطلاعات واردشده صحیح است و پرداخت مربوط به ثبت‌نام همین دوره است.</span></label>
          <button className="avc-submit" type="submit" disabled={busy}>{busy ? "در حال ارسال؛ لطفاً این صفحه را نبندید…" : "ارسال رسید و ثبت درخواست"}<span>↙</span></button>
          <div className="avc-review-note">
            <span aria-hidden="true">✓</span>
            <div><strong>بررسی رسید حداکثر تا ۴۸ ساعت</strong><p>پس از تأیید، ایمیل ثبت‌نام و لینک ورود به کانال اختصاصی دوره ارسال می‌شود. پوشه Spam را هم بررسی کنید.</p></div>
          </div>
          {message && <p className={message.error ? "avc-message error" : "avc-message success"} role="status" aria-live="polite">{message.text}</p>}
        </form>
      </div>
    </section>
  );
}
