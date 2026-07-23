"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { COURSE2_CARD_HOLDER, COURSE2_CARD_NUMBER } from "../../lib/course2-config";
import "../register/register-details.css";
import "./register-course2.css";

type PaymentType = "charity" | "card";
type Capacity = {
  remaining: number;
  capacity: number;
  full: boolean;
  paymentType: PaymentType;
  charityCapacity: number;
  charityUsed: number;
  charityRemaining: number;
  charityFull: boolean;
  charityApproved: number;
  charityApprovedTotal: number;
  cardCapacity: number;
  cardUsed: number;
  cardRemaining: number;
};

const formatToman = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function Course2RegisterPage() {
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const cardReady = Boolean(COURSE2_CARD_NUMBER && COURSE2_CARD_HOLDER);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/course-2/registration/status", { cache: "no-store" });
    if (response.ok) setCapacity(await response.json());
  }, []);

  useEffect(() => {
    // Initial capacity is supplied by the course status API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = event.currentTarget;
    const response = await fetch("/api/course-2/registration", { method: "POST", body: new FormData(form) });
    const result = await response.json() as { message?: string; error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage({ text: result.error ?? "خطایی رخ داد.", error: true });
      await refresh();
      return;
    }
    setMessage({ text: result.message ?? "ثبت‌نام انجام شد." });
    form.reset();
    await refresh();
  }

  const paymentType = capacity?.paymentType ?? "charity";
  const charityReviewComplete = capacity?.charityApproved === capacity?.charityCapacity;

  return <main className="registration-page course2-page fa" dir="rtl">
    <header className="registration-header"><Link href="/" className="registration-logo"><span className="mini-mark">S</span><b>SAMIZ AI</b></Link><Link href="/" className="back-link">بازگشت به سایت</Link></header>
    <section className="registration-shell">
      <div className="registration-intro">
        <p className="eyebrow">SAMIZ AI ACADEMY · دوره جدید</p>
        <h1 className="registration-page-title"><span className="registration-title-prefix">ثبت‌نام دوره</span><span className="registration-course-name">«ورود به دنیای هوش مصنوعی با یادگیری مهندسی پرامپت»</span></h1>
        <p>ظرفیت این دوره ۱۰۰ نفر است. ۲۰ نفر اول هزینه ثبت‌نام را مستقیماً به خیریه انتخابی خود پرداخت می‌کنند و پس از تکمیل این بخش، ثبت‌نام ۸۰ نفر بعدی با پرداخت به شماره کارت دوره ادامه پیدا می‌کند.</p>

        <div className="donation-highlight"><span>مبلغ ثبت‌نام</span><strong>۲ میلیون تومان</strong><p>{paymentType === "charity" ? "پرداخت مستقیم به یک مؤسسه خیریه معتبر به انتخاب شما" : "پرداخت به شماره کارت دوره و بارگذاری رسید"}</p></div>
        <div className="course-start-card"><span>تاریخ شروع دوره</span><strong>۱۵ مرداد</strong><p>اولین جلسه دوره در این تاریخ آپلود خواهد شد.</p></div>

        {capacity?.charityFull && <div className="charity-result-card">
          <span>ظرفیت خیریه تکمیل شد</span>
          {charityReviewComplete ? <><strong>{formatToman(capacity.charityApprovedTotal)} تومان</strong><p>مجموع پرداخت‌های خیریه تأییدشده توسط شرکت‌کنندگان این دوره</p></> : <><strong>حداقل ۴۰ میلیون تومان</strong><p>رسیدهای این مبلغ ثبت شده‌اند و نتیجه نهایی پس از بررسی همه رسیدها اعلام می‌شود. مبلغ تأییدشده تا این لحظه: {formatToman(capacity.charityApprovedTotal)} تومان</p></>}
        </div>}

        <div className="registration-steps"><h2>مراحل ثبت‌نام</h2><ol>
          {paymentType === "charity" ? <>
            <li><b>انتخاب خیریه</b><span>یک مؤسسه خیریه معتبر داخل ایران را انتخاب کنید.</span></li>
            <li><b>پرداخت مستقیم</b><span>حداقل ۲ میلیون تومان مستقیماً به خیریه انتخابی خود پرداخت کنید.</span></li>
            <li><b>ثبت اطلاعات و رسید</b><span>فرم روبه‌رو را تکمیل و تصویر رسید را بارگذاری کنید.</span></li>
          </> : <>
            <li><b>مشاهده اطلاعات کارت</b><span>شماره کارت و نام صاحب حساب را با دقت بررسی کنید.</span></li>
            <li><b>پرداخت هزینه دوره</b><span>مبلغ ۲ میلیون تومان را به شماره کارت اعلام‌شده پرداخت کنید.</span></li>
            <li><b>ثبت اطلاعات و رسید</b><span>فرم روبه‌رو را تکمیل و تصویر رسید را بارگذاری کنید.</span></li>
          </>}
        </ol></div>

        <div className="course-outline"><div><span>دوره شامل ۳ بخش است:</span></div><ul><li>مهندسی پرامپت</li><li>تولید محتوا با کمک AI</li><li>تأثیر پرامپت در ساخت ویدیوهای تبلیغاتی با AI</li></ul><p className="course-delivery-note">دوره به‌صورت ضبط‌شده ارائه می‌شود و ویدیوها به‌طور منظم در اختیار شما قرار می‌گیرند. همچنین تیم مدرسین پاسخ‌گوی پرسش‌های شما خواهد بود.</p></div>

        <div className="capacity-card"><span>ظرفیت باقی‌مانده کل دوره</span><strong>{capacity ? `${capacity.remaining} از ${capacity.capacity}` : "در حال بررسی…"}</strong><small>{paymentType === "charity" && capacity ? `${capacity.charityRemaining} ظرفیت از بخش خیریه باقی مانده است.` : capacity ? `${capacity.cardRemaining} ظرفیت از مرحله دوم باقی مانده است.` : "رسید شما حداکثر تا ۲۴ ساعت بررسی می‌شود."}</small></div>
      </div>

      <div className="registration-form-card">
        {!capacity ? <div className="full-state"><h2>در حال دریافت ظرفیت…</h2></div> : capacity.full ? <div className="full-state"><span>ظرفیت تکمیل شد</span><h2>ثبت‌نام این دوره بسته شده است.</h2><p>از همراهی شما سپاسگزاریم.</p></div> : paymentType === "card" && !cardReady ? <div className="full-state awaiting-card"><span>مرحله اول تکمیل شد</span><h2>اطلاعات پرداخت مرحله دوم به‌زودی اعلام می‌شود.</h2><p>پس از درج شماره کارت، ثبت‌نام ۸۰ نفر بعدی از همین صفحه فعال خواهد شد.</p></div> : <form onSubmit={submit}>
          <input type="hidden" name="paymentType" value={paymentType} />
          <div className="form-stage-badge"><span>{paymentType === "charity" ? "ثبت‌نام بخش خیریه" : "ثبت‌نام مرحله دوم"}</span><strong>{paymentType === "charity" ? `${capacity.charityRemaining} ظرفیت باقی‌مانده` : `${capacity.cardRemaining} ظرفیت باقی‌مانده`}</strong></div>

          {paymentType === "card" && <div className="card-details"><span>شماره کارت دوره</span><strong dir="ltr">{COURSE2_CARD_NUMBER}</strong><small>به نام {COURSE2_CARD_HOLDER}</small><p>مبلغ قابل پرداخت: ۲ میلیون تومان</p></div>}

          <div><label htmlFor="fullName">نام و نام خانوادگی</label><input id="fullName" name="fullName" required minLength={3} maxLength={80} placeholder="نام کامل خود را وارد کنید" /></div>
          <div className="form-row"><div><label htmlFor="age">سن</label><input id="age" name="age" type="number" required min={12} max={100} inputMode="numeric" placeholder="مثلاً ۲۸" /></div><div><label htmlFor="education">میزان تحصیلات</label><select id="education" name="education" required defaultValue=""><option value="" disabled>انتخاب کنید</option><option>دیپلم و پایین‌تر</option><option>کاردانی</option><option>کارشناسی</option><option>کارشناسی ارشد</option><option>دکتری</option><option>سایر</option></select></div></div>
          <div><label htmlFor="specialty">تخصص <small>(در صورت دارا بودن)</small></label><input id="specialty" name="specialty" maxLength={120} placeholder="مثلاً طراحی گرافیک" /></div>
          <div><label htmlFor="occupation">شغل</label><input id="occupation" name="occupation" required minLength={2} maxLength={120} placeholder="شغل فعلی خود را وارد کنید" /></div>
          <div><label htmlFor="phone">شماره تماس دارای واتساپ</label><input id="phone" name="phone" type="tel" required inputMode="tel" placeholder="مثلاً 09123456789" /></div>
          <div><label htmlFor="email">ایمیل</label><input id="email" name="email" type="email" required autoComplete="email" maxLength={160} placeholder="مثلاً name@example.com" /></div>
          {paymentType === "charity" && <><div><label htmlFor="charityName">نام خیریه</label><input id="charityName" name="charityName" required minLength={2} maxLength={160} placeholder="نام خیریه‌ای که انتخاب کرده‌اید" /></div><div><label htmlFor="paidAmount">مبلغ پرداخت‌شده به خیریه (تومان)</label><input id="paidAmount" name="paidAmount" type="number" required min={2000000} step={1000} inputMode="numeric" defaultValue={2000000} /></div></>}
          <div><label htmlFor="receipt">{paymentType === "charity" ? "آپلود رسید خیریه" : "آپلود رسید پرداخت"}</label><label className="upload-box" htmlFor="receipt"><span>انتخاب تصویر یا فایل رسید</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label><input className="file-input" id="receipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" /></div>
          <label className="consent"><input type="checkbox" required /><span>{paymentType === "charity" ? "تأیید می‌کنم این رسید مربوط به پرداخت مستقیم من به خیریه انتخابی است." : "تأیید می‌کنم مبلغ ۲ میلیون تومان را به شماره کارت اعلام‌شده پرداخت کرده‌ام."}</span></label>
          <button className="gold-button submit-button" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال رسید و ثبت درخواست"}</button>
          {message && <p className={message.error ? "form-message error" : "form-message success"}>{message.text}</p>}
        </form>}
      </div>
    </section>
  </main>;
}
