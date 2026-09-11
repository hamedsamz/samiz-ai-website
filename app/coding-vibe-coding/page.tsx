"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  CODING_COURSE_CARD_HOLDER,
  CODING_COURSE_CARD_NUMBER,
  CODING_COURSE_PAYMENT_TELEGRAM_URL,
} from "../../lib/coding-course-config";
import "./coding-course.css";

type Location = "iran" | "international";

const curriculum = [
  {
    number: "01",
    title: "ورود حرفه‌ای به دنیای AI",
    text: "شناخت درست ابزارهای هوش مصنوعی، طرز فکر حل مسئله و استفاده هدفمند از AI در کار و یادگیری.",
    tags: ["AI Fundamentals", "Workflow"],
  },
  {
    number: "02",
    title: "مهندسی پرامپت کاربردی",
    text: "از ساختار یک پرامپت روشن تا نقش‌دهی، محدودیت‌گذاری، نمونه‌دهی، زنجیره‌سازی و اصلاح مرحله‌به‌مرحله خروجی.",
    tags: ["Prompting", "Maker–Checker"],
  },
  {
    number: "03",
    title: "پایتون مقدماتی از صفر",
    text: "راه‌اندازی محیط، متغیرها، ورودی و خروجی، شرط‌ها، حلقه‌ها، لیست‌ها، مدیریت خطا و توابع با زبان ساده.",
    tags: ["Python", "Logic"],
  },
  {
    number: "04",
    title: "ساخت پروژه با وایب‌کدینگ",
    text: "تبدیل ایده به برنامه‌های واقعی، خواندن و اصلاح کد تولیدشده با AI و ترکیب همه مهارت‌ها در پروژه نهایی.",
    tags: ["Vibe Coding", "Projects"],
  },
];

export default function CodingVibeCodingPage() {
  const [location, setLocation] = useState<Location>("iran");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function copyCard() {
    await navigator.clipboard.writeText(CODING_COURSE_CARD_NUMBER);
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
    const response = await fetch("/api/coding-course/registration", { method: "POST", body: formData });
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
    <main className="cvc-page fa" dir="rtl">
      <header className="cvc-header">
        <Link href="/" className="cvc-brand" aria-label="SAMIZ AI">
          <span>S</span><strong>SAMIZ AI</strong><small>ACADEMY</small>
        </Link>
        <div className="cvc-header-links">
          <Link href="/courses">همه دوره‌ها</Link>
          <a href="#registration" className="cvc-header-cta">ثبت‌نام دوره <i>↙</i></a>
        </div>
      </header>

      <section className="cvc-hero">
        <div className="cvc-hero-copy">
          <div className="cvc-status"><span /> ثبت‌نام دوره جدید آغاز شد</div>
          <p className="cvc-overline">CODING × AI × PYTHON</p>
          <h2 className="cvc-hero-heading">آموزش هوش مصنوعی از پایه، به‌صورت اصولی و مفهومی</h2>
          <h1><span>کدینگ،</span><em>وایب‌کدینگ</em></h1>
          <p className="cvc-lead">از اولین پرامپت تا اولین پروژه پایتون؛ مسیری عملی برای یادگیری هوش مصنوعی، مهندسی پرامپت و برنامه‌نویسی با کمک AI.</p>
          <div className="cvc-teachers">
            <div><small>مدرس هوش مصنوعی و وایب‌کدینگ</small><strong>حامد سمیع‌زاده</strong></div>
            <span>×</span>
            <div><small>مدرس پایتون و مبانی کدنویسی</small><strong>دکتر هادی روشن</strong></div>
          </div>
          <div className="cvc-hero-actions">
            <a href="#registration" className="cvc-primary">رزرو جایگاه <span>↙</span></a>
            <a href="#curriculum" className="cvc-secondary">مشاهده مسیر یادگیری</a>
          </div>
        </div>

        <div className="cvc-terminal" aria-label="نمای مسیر دوره">
          <div className="cvc-terminal-bar"><span /><span /><span /><b>course.py</b></div>
          <div className="cvc-terminal-code" dir="ltr">
            <p><i>01</i><span className="cyan">goal</span> = <span className="yellow">&quot;turn ideas into code&quot;</span></p>
            <p><i>02</i><span className="purple">learn</span>(<span className="yellow">&quot;prompt engineering&quot;</span>)</p>
            <p><i>03</i><span className="purple">learn</span>(<span className="yellow">&quot;python basics&quot;</span>)</p>
            <p><i>04</i><span className="cyan">project</span> = AI.<span className="purple">build</span>(idea)</p>
            <p className="terminal-output"><i>05</i>✓ You are ready to build.</p>
          </div>
          <div className="cvc-terminal-foot"><span>NO PREREQUISITES</span><b>BEGINNER → BUILDER</b></div>
        </div>
      </section>

      <section className="cvc-facts">
        <div><small>شروع انتشار جلسات</small><strong>۱ مهر</strong></div>
        <div><small>سطح دوره</small><strong>از صفر تا ساخت پروژه</strong></div>
        <div><small>محل برگزاری</small><strong>کانال اختصاصی تلگرام</strong></div>
        <div><small>پیش‌نیاز</small><strong>بدون نیاز به تجربه قبلی</strong></div>
      </section>

      <section className="cvc-audience">
        <p className="cvc-section-label">ساخته‌شده برای شروع واقعی</p>
        <div>
          <h2>برای همه سطوح؛ حتی اگر تا امروز یک خط کد هم ننوشته‌اید.</h2>
          <p>مطالب از پایه و با مثال‌های قابل‌فهم شروع می‌شوند. هم استفاده حرفه‌ای از هوش مصنوعی و پرامپت‌نویسی را یاد می‌گیرید، هم منطق و مبانی پایتون را؛ تا فقط مصرف‌کننده ابزارهای AI نباشید و بتوانید ایده‌های خودتان را بسازید.</p>
        </div>
      </section>

      <section className="cvc-curriculum" id="curriculum">
        <div className="cvc-section-head">
          <div><p className="cvc-section-label">مسیر یادگیری</p><h2>دو مهارت، یک مسیر منسجم</h2></div>
          <p>سرفصل‌ها به‌صورت پروژه‌محور طراحی شده‌اند؛ مفاهیم پرامپت و پایتون در طول مسیر به هم متصل می‌شوند.</p>
        </div>
        <div className="cvc-curriculum-grid">
          {curriculum.map(item => (
            <article key={item.number}>
              <div><span>{item.number}</span><i>↙</i></div>
              <h3>{item.title}</h3><p>{item.text}</p>
              <footer>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</footer>
            </article>
          ))}
        </div>
        <div className="cvc-projects"><strong>پروژه‌هایی که در مسیر می‌سازید</strong><span>کارت معرفی هوشمند</span><span>ارزیاب نمره</span><span>بازی حدس عدد</span><span>فهرست خرید</span><span>پروژه نهایی ترکیبی</span></div>
      </section>

      <section className="cvc-instructors">
        <div className="cvc-section-head"><div><p className="cvc-section-label">مدرس‌ها</p><h2>ترکیب تجربه AI و آموزش اصولی کدنویسی</h2></div></div>
        <div className="cvc-instructor-grid">
          <article><span>AI</span><div><small>هوش مصنوعی، پرامپت و وایب‌کدینگ</small><h3>حامد سمیع‌زاده</h3><p>آموزش استفاده هدفمند از ابزارهای هوش مصنوعی، طراحی پرامپت‌های حرفه‌ای و تبدیل ایده به پروژه با رویکرد وایب‌کدینگ.</p></div></article>
          <article><span>PY</span><div><small>پایتون و منطق برنامه‌نویسی</small><h3>دکتر هادی روشن</h3><p>آموزش گام‌به‌گام مبانی پایتون، درک ساختار کد و اصلاح خروجی‌های AI برای ساختن پروژه‌های قابل‌اتکا.</p></div></article>
        </div>
      </section>

      <section className="cvc-registration" id="registration">
        <div className="cvc-registration-copy">
          <p className="cvc-section-label">ثبت‌نام دوره</p>
          <h2>از اینجا شروع کنید.</h2>
          <p>محل زندگی خود را انتخاب کنید تا مبلغ و روش پرداخت مناسب به شما نمایش داده شود.</p>
          <div className="cvc-start-note"><small>شروع دوره</small><strong>۱ مهر</strong><p>جلسات در کانال اختصاصی تلگرام منتشر می‌شوند. لینک ورود پس از بررسی و تأیید ثبت‌نام به ایمیل شما ارسال خواهد شد.</p></div>
        </div>

        <div className="cvc-form-card">
          <div className="cvc-location-picker" role="radiogroup" aria-label="محل زندگی">
            <button type="button" role="radio" aria-checked={location === "iran"} className={location === "iran" ? "active" : ""} onClick={() => { setLocation("iran"); setMessage(null); }}><span>داخل ایران</span><small>۳ میلیون تومان</small></button>
            <button type="button" role="radio" aria-checked={location === "international"} className={location === "international" ? "active" : ""} onClick={() => { setLocation("international"); setMessage(null); }}><span>خارج از ایران</span><small>۴۵ تتر (USDT)</small></button>
          </div>

          {location === "iran" ? (
            <div className="cvc-payment-card iran">
              <div><small>مبلغ ثبت‌نام</small><strong>۳,۰۰۰,۰۰۰ <i>تومان</i></strong></div>
              <p>مبلغ را به کارت زیر واریز کنید و سپس تصویر رسید را در فرم بارگذاری کنید.</p>
              <div className="cvc-card-number" dir="ltr"><code>{CODING_COURSE_CARD_NUMBER.replace(/(\d{4})(?=\d)/g, "$1 ")}</code><button type="button" onClick={copyCard}>{copied ? "کپی شد ✓" : "کپی شماره"}</button></div>
              <small className="cvc-holder">به نام {CODING_COURSE_CARD_HOLDER}</small>
            </div>
          ) : (
            <div className="cvc-payment-card international">
              <div><small>مبلغ ثبت‌نام</small><strong>۴۵ <i>USDT</i></strong></div>
              <p>برای دریافت آدرس شبکه و جزئیات پرداخت تتر، در تلگرام به حامد پیام بدهید. بعد از پرداخت، رسید را در فرم زیر بارگذاری کنید.</p>
              <a href={CODING_COURSE_PAYMENT_TELEGRAM_URL} target="_blank" rel="noreferrer">پیام در تلگرام · @hamedsamiz <span>↗</span></a>
            </div>
          )}

          <form onSubmit={submit}>
            <input type="hidden" name="location" value={location} />
            <div className="cvc-field full"><label htmlFor="fullName">نام و نام خانوادگی</label><input id="fullName" name="fullName" required minLength={3} maxLength={80} autoComplete="name" placeholder="نام کامل خود را وارد کنید" /></div>
            <div className="cvc-field"><label htmlFor="age">سن</label><input id="age" name="age" type="number" required min={12} max={100} inputMode="numeric" placeholder="مثلاً ۲۸" /></div>
            <div className="cvc-field"><label htmlFor="phone">شماره تماس دارای واتساپ</label><input id="phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="با کد کشور وارد کنید" /></div>
            <div className="cvc-field"><label htmlFor="email">ایمیل</label><input id="email" name="email" type="email" required autoComplete="email" maxLength={160} placeholder="name@example.com" dir="ltr" /></div>
            <div className="cvc-field"><label htmlFor="emailConfirmation">تأیید ایمیل</label><input id="emailConfirmation" name="emailConfirmation" type="email" required autoComplete="email" maxLength={160} placeholder="ایمیل را دوباره وارد کنید" dir="ltr" /></div>
            {location === "international" && <div className="cvc-field full"><label htmlFor="telegramUsername">یوزرنیم تلگرام <small>(اختیاری)</small></label><input id="telegramUsername" name="telegramUsername" maxLength={80} placeholder="مثلاً hamedsamiz" dir="ltr" /></div>}
            <div className="cvc-field full">
              <label htmlFor="receipt">رسید پرداخت</label>
              <label className="cvc-upload" htmlFor="receipt"><span>{fileName || "انتخاب تصویر یا فایل رسید"}</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label>
              <input className="cvc-file-input" id="receipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setFileName(event.target.files?.[0]?.name ?? "")} />
            </div>
            <label className="cvc-consent"><input type="checkbox" required /><span>تأیید می‌کنم اطلاعات واردشده صحیح است و پرداخت مربوط به ثبت‌نام همین دوره است.</span></label>
            <button className="cvc-submit" disabled={busy}>{busy ? "در حال ثبت درخواست…" : "ارسال رسید و ثبت درخواست"}<span>↙</span></button>
            <div className="cvc-review-note">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>بررسی رسید حداکثر تا ۴۸ ساعت</strong>
                <p>رسید شما حداکثر تا ۴۸ ساعت پس از بارگذاری بررسی می‌شود. بعد از تأیید، ایمیل تأیید ثبت‌نام و لینک ورود به کانال دوره برایتان ارسال خواهد شد. پوشه Spam را هم بررسی کنید.</p>
              </div>
            </div>
            {message && <p className={message.error ? "cvc-message error" : "cvc-message success"}>{message.text}</p>}
          </form>
        </div>
      </section>

      <section className="cvc-support" aria-labelledby="support-title">
        <div>
          <p className="cvc-section-label">پشتیبانی ثبت‌نام</p>
          <h2 id="support-title">سؤالی دارید؟ مستقیم پیام بدهید.</h2>
          <p>برای پرسش‌های مربوط به پرداخت، ارسال رسید یا ثبت‌نام دوره در واتساپ با ما در ارتباط باشید.</p>
        </div>
        <a href="https://wa.me/18259250075" target="_blank" rel="noreferrer" aria-label="پیام به پشتیبانی ثبت‌نام در واتساپ">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.2 1.6 6L0 24l6.4-1.7a11.8 11.8 0 0 0 5.7 1.5h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.5-8.5Zm-8.4 18.3c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.5 4.7Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.7-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6l-1-2.4c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 3s1.3 3.5 1.5 3.8c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.3-.3-.4-.6-.6Z" /></svg>
          <span><small>پشتیبانی در واتساپ</small><strong>پیام به حامد سمیع‌زاده</strong></span>
          <i>↗</i>
        </a>
      </section>

      <footer className="cvc-footer"><span>SAMIZ AI ACADEMY</span><p>دوره کدینگ، وایب‌کدینگ · حامد سمیع‌زاده × دکتر هادی روشن</p><Link href="/courses">مشاهده همه دوره‌ها</Link></footer>
    </main>
  );
}
