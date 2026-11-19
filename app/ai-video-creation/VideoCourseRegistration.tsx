"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  AI_VIDEO_COURSE_CARD_HOLDER,
  AI_VIDEO_COURSE_PAYMENT_TELEGRAM_URL,
  AI_VIDEO_COURSE_PLANS,
  AI_VIDEO_INSTALLMENT_DAYS,
  AI_VIDEO_SUPPORT_CAPACITY,
  AI_VIDEO_COURSE_START_DATE,
  normalizeAiVideoCourseEmail,
  type AiVideoCoursePlan,
} from "../../lib/ai-video-course-config";

type Location = "iran" | "international";
const formatPrice = new Intl.NumberFormat("fa-IR");
const MAX_RECEIPT_SIZE = 2.5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export default function VideoCourseRegistration() {
  const [location, setLocation] = useState<Location>("iran");
  const [plan, setPlan] = useState<AiVideoCoursePlan | null>(null);
  const [paymentOption, setPaymentOption] = useState<"full" | "installments">("full");
  const [supportRemaining, setSupportRemaining] = useState<number | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);
  const selectedPlan = plan ? AI_VIDEO_COURSE_PLANS[plan] : null;
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/ai-video-course/registration", { cache: "no-store" })
      .then(response => response.json())
      .then(data => { if (typeof data.support?.remaining === "number") setSupportRemaining(data.support.remaining); })
      .catch(() => {});
  }, []);
  const amountNow = selectedPlan ? (plan === "with-support" && paymentOption === "installments" ? selectedPlan.fee / 2 : selectedPlan.fee) : 0;

  async function copyCard(cardNumber: string) {
    await navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan) return;
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("location", location);
    if (normalizeAiVideoCourseEmail(formData.get("email")) !== normalizeAiVideoCourseEmail(formData.get("emailConfirmation"))) {
      setEmailMismatch(true);
      form.querySelector<HTMLInputElement>('[name="emailConfirmation"]')?.focus();
      return;
    }
    formData.set("plan", plan);
    formData.set("paymentOption", plan === "with-support" ? paymentOption : "full");
    setBusy(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

    try {
      const response = await fetch("/api/ai-video-course/registration", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!response.headers.get("content-type")?.includes("application/json")) {
        setMessage({ text: "تأیید مرورگر اجازهٔ ارسال نداد. لینک ثبت‌نام را مستقیم در Safari یا Chrome باز کنید و دوباره تلاش کنید. اگر قبلاً درخواست ثبت شده باشد، سیستم به شما اطلاع می‌دهد.", error: true });
        return;
      }
      const result = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok) {
        setMessage({ text: result.error ?? "ارسال فرم کامل نشد. حجم و فرمت رسید را بررسی و دوباره تلاش کنید.", error: true });
        return;
      }
      setMessage({ text: result.message ?? "درخواست شما ثبت شد." });
      form.reset();
      setFileName("");
      setEmailMismatch(false);
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
        <p>یکی از دو پلن را انتخاب کنید. شروع دوره {AI_VIDEO_COURSE_START_DATE} است.</p>
        <div className="avc-format-note">
          <small>نحوه برگزاری</small>
          <strong>ضبط‌شده و همیشه در دسترس</strong>
          <p>هر پلن کانال تلگرام جداگانه‌ای دارد. بعد از تأیید رسید، لینک ورود به کانال پلن انتخابی به ایمیل ثبت‌نام ارسال می‌شود.</p>
        </div>
      </div>

      <div className="avc-form-card">
        <fieldset className="avc-plan-picker avc-course-plan-picker" disabled={busy}>
          <legend>ابتدا پلن خود را انتخاب کنید</legend>
          <div className="avc-location-picker">
            {(Object.keys(AI_VIDEO_COURSE_PLANS) as AiVideoCoursePlan[]).map(option => (
              <label key={option} className={plan === option ? "active" : ""}>
                <input type="radio" name="videoPlan" value={option} checked={plan === option} aria-controls="video-purchase-details" disabled={option === "with-support" && supportRemaining === 0} onChange={() => { setPlan(option); setPaymentOption("full"); setCopied(false); setMessage(null); }} />
                <span>{AI_VIDEO_COURSE_PLANS[option].label}</span>
                <small className="avc-picker-price"><del>{formatPrice.format(AI_VIDEO_COURSE_PLANS[option].originalFee)}</del><b>{formatPrice.format(AI_VIDEO_COURSE_PLANS[option].fee)} تومان</b></small>
                <small>{option === "with-support" ? supportRemaining === 0 ? "ظرفیت تکمیل شده" : `ظرفیت محدود · ${formatPrice.format(AI_VIDEO_SUPPORT_CAPACITY)} نفر` : "ظرفیت نامحدود"}</small>
              </label>
            ))}
          </div>
        </fieldset>

        {!plan && <p className="avc-plan-prompt">برای مشاهده اطلاعات پرداخت و فرم ثبت‌نام، یکی از پلن‌های بالا را انتخاب کنید.</p>}
        {selectedPlan && <div id="video-purchase-details">
        {plan === "with-support" && <fieldset className="avc-plan-picker avc-installment-picker" disabled={busy}>
          <legend>روش پرداخت</legend>
          <div className="avc-location-picker">
            <label className={paymentOption === "full" ? "active" : ""}><input type="radio" name="paymentChoice" checked={paymentOption === "full"} onChange={() => setPaymentOption("full")} /><span>پرداخت یکجا</span><small>۸ میلیون تومان</small></label>
            <label className={paymentOption === "installments" ? "active" : ""}><input type="radio" name="paymentChoice" checked={paymentOption === "installments"} onChange={() => setPaymentOption("installments")} /><span>پرداخت دو مرحله‌ای</span><small>۴ میلیون اکنون + ۴ میلیون، ۲۰ روز بعد</small></label>
          </div>
        </fieldset>}

        <div className="avc-location-picker" role="group" aria-label="محل زندگی">
          <button type="button" aria-pressed={location === "iran"} disabled={busy} className={location === "iran" ? "active" : ""} onClick={() => { setLocation("iran"); setMessage(null); }}><span>داخل ایران</span><small>کارت‌به‌کارت</small></button>
          <button type="button" aria-pressed={location === "international"} disabled={busy} className={location === "international" ? "active" : ""} onClick={() => { setLocation("international"); setMessage(null); }}><span>خارج از ایران</span><small>هماهنگی پرداخت در تلگرام</small></button>
        </div>

        <div className={`avc-payment-card ${location}`}>
          <div className="avc-payment-heading">
            <small>{selectedPlan.label}</small>
            <div className="avc-price-stack"><del>{formatPrice.format(selectedPlan.originalFee)} تومان</del><strong>{formatPrice.format(selectedPlan.fee)} <i>تومان</i></strong></div>
          </div>
          <p className="avc-payment-summary">{paymentOption === "installments" && plan === "with-support" ? `مبلغ قابل واریز اکنون: ${formatPrice.format(amountNow)} تومان. قسط دوم ${formatPrice.format(amountNow)} تومان، ${AI_VIDEO_INSTALLMENT_DAYS} روز پس از ارسال رسید قسط اول؛ لینک کانال پس از تأیید قسط اول ایمیل می‌شود.` : `مبلغ قابل واریز اکنون: ${formatPrice.format(amountNow)} تومان.`}</p>
          {location === "iran" ? (
            <>
              <p>مبلغ قابل واریز اکنون را به کارت زیر واریز کنید و تصویر رسید را در فرم بارگذاری کنید.</p>
              <div className="avc-card-number" dir="ltr"><code>{selectedPlan.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}</code><button type="button" onClick={() => copyCard(selectedPlan.cardNumber)}>{copied ? "کپی شد ✓" : "کپی شماره"}</button></div>
              <small className="avc-holder">به نام {AI_VIDEO_COURSE_CARD_HOLDER}</small>
            </>
          ) : (
            <>
              <p>برای هماهنگی معادل مبلغ قابل پرداخت اکنون و جزئیات پرداخت، در تلگرام به حامد پیام بدهید. پس از پرداخت، رسید را بارگذاری کنید.</p>
              <a href={AI_VIDEO_COURSE_PAYMENT_TELEGRAM_URL} target="_blank" rel="noreferrer">پیام در تلگرام · @hamedsamiz <span>↗</span></a>
            </>
          )}
        </div>

        <form onSubmit={submit}>
          <p className="avc-browser-note">اگر این صفحه را داخل اینستاگرام باز کرده‌اید، پیش از ارسال رسید از منوی مرورگر گزینهٔ «Open in browser» را بزنید و ثبت‌نام را در Safari یا Chrome انجام دهید.</p>
          <div className="avc-field full"><label htmlFor="videoFullName">نام و نام خانوادگی</label><input id="videoFullName" name="fullName" required minLength={3} maxLength={80} autoComplete="name" placeholder="نام کامل خود را وارد کنید" /></div>
          <div className="avc-field"><label htmlFor="videoAge">سن</label><input id="videoAge" name="age" type="number" required min={12} max={100} inputMode="numeric" placeholder="مثلاً ۲۸" /></div>
          <div className="avc-field"><label htmlFor="videoPhone">شماره تماس دارای واتساپ</label><input id="videoPhone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="با کد کشور وارد کنید" /></div>
          <div className="avc-field"><label htmlFor="videoEmail">ایمیل</label><input id="videoEmail" name="email" onChange={() => setEmailMismatch(false)} type="email" required autoComplete="email" maxLength={160} placeholder="name@example.com" dir="ltr" /></div>
          <div className="avc-field"><label htmlFor="videoEmailConfirmation">ایمیل را دوباره وارد کنید</label><input id="videoEmailConfirmation" name="emailConfirmation" type="email" required autoComplete="off" onChange={() => setEmailMismatch(false)} aria-invalid={emailMismatch} aria-describedby={emailMismatch ? "videoEmailError" : undefined} maxLength={160} placeholder="ایمیل را دوباره وارد کنید" dir="ltr" /></div>
          {emailMismatch && <p id="videoEmailError" className="avc-message error" role="alert">ایمیل و تکرار ایمیل یکسان نیستند.</p>}
          {location === "international" && <div className="avc-field full"><label htmlFor="videoTelegramUsername">یوزرنیم تلگرام <small>(اختیاری)</small></label><input id="videoTelegramUsername" name="telegramUsername" maxLength={80} placeholder="مثلاً hamedsamiz" dir="ltr" /></div>}
          <div className="avc-field full">
            <label htmlFor="videoReceipt">رسید پرداخت</label>
            <label className="avc-upload" htmlFor="videoReceipt"><span>{fileName || "انتخاب تصویر یا فایل رسید"}</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label>
            <input className="avc-file-input" id="videoReceipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={selectReceipt} />
          </div>
          <label className="avc-consent"><input type="checkbox" required /><span>تأیید می‌کنم اطلاعات واردشده صحیح است و پرداخت مربوط به ثبت‌نام همین دوره است.</span></label>
          <button className="avc-submit" type="submit" disabled={busy || (plan === "with-support" && supportRemaining === 0)}>{busy ? "در حال ارسال؛ لطفاً این صفحه را نبندید…" : "ارسال رسید و ثبت درخواست"}<span>↙</span></button>
          <div className="avc-review-note">
            <span aria-hidden="true">✓</span>
            <div><strong>بررسی رسید حداکثر تا ۴۸ ساعت</strong><p>پس از تأیید، لینک ورود به کانال پلن انتخابی به همین ایمیل ارسال می‌شود. پوشه Spam را هم بررسی کنید.</p></div>
          </div>
          {message && <p className={message.error ? "avc-message error" : "avc-message success"} role="status" aria-live="polite">{message.text}</p>}
        </form>
        </div>}
      </div>
    </section>
  );
}
