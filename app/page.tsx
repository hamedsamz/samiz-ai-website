"use client";

import { FormEvent, useState } from "react";

const services = [
  { icon: "✦", title: "طراحی لبخند", text: "طراحی دیجیتال لبخند متناسب با فرم چهره و ویژگی‌های منحصربه‌فرد شما." },
  { icon: "◒", title: "ایمپلنت دندان", text: "جایگزینی ایمن و ماندگار دندان با برنامه‌ریزی دقیق و تجهیزات پیشرفته." },
  { icon: "◇", title: "لمینت سرامیکی", text: "اصلاح رنگ، فرم و هماهنگی دندان‌ها با ظاهری طبیعی و ظریف." },
  { icon: "◎", title: "ارتودنسی", text: "درمان ناهماهنگی دندان‌ها با روش‌های مدرن و طرح درمان شخصی‌سازی‌شده." },
  { icon: "◐", title: "سفید کردن دندان", text: "روشن‌تر شدن لبخند با روش حرفه‌ای، کنترل‌شده و کم‌حساسیت." },
  { icon: "+", title: "دندان‌پزشکی عمومی", text: "معاینه، ترمیم، جرم‌گیری و مراقبت‌های پیشگیرانه برای سلامت همیشگی دهان." },
];

const faqs = [
  ["اولین جلسه مشاوره چگونه برگزار می‌شود؟", "در جلسه نخست، وضعیت دهان و دندان بررسی می‌شود، تصاویر لازم تهیه شده و مناسب‌ترین مسیر درمان همراه با زمان‌بندی و هزینه تقریبی توضیح داده می‌شود."],
  ["آیا امکان پرداخت مرحله‌ای وجود دارد؟", "برای برخی درمان‌های چندمرحله‌ای، امکان تنظیم برنامه پرداخت متناسب با مراحل درمان وجود دارد."],
  ["مدت زمان طراحی لبخند چقدر است؟", "مدت درمان به شرایط دندان‌ها و روش انتخابی بستگی دارد. پس از معاینه، جدول زمانی دقیق در اختیار شما قرار می‌گیرد."],
  ["برای شرایط اورژانسی چه‌کار کنیم؟", "با شماره کلینیک تماس بگیرید تا نزدیک‌ترین زمان ممکن برای ارزیابی و کنترل مشکل برای شما در نظر گرفته شود."],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [sent, setSent] = useState(false);

  function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <main dir="rtl">
      <header className="header">
        <a className="brand" href="#home" aria-label="صفحه اصلی">
          <span>AUREA</span><small>DENTAL CLINIC</small>
        </a>
        <button className="menuButton" onClick={() => setMenuOpen(!menuOpen)} aria-label="باز کردن منو">{menuOpen ? "×" : "☰"}</button>
        <nav className={menuOpen ? "nav open" : "nav"} onClick={() => setMenuOpen(false)}>
          <a href="#home">خانه</a><a href="#services">خدمات</a><a href="#doctor">درباره ما</a><a href="#gallery">نمونه‌کارها</a><a href="#contact">تماس با ما</a>
        </nav>
        <a className="headerCta" href="#appointment">رزرو وقت</a>
      </header>

      <section className="hero" id="home">
        <div className="heroVisual">
          <img src="/clinic-interior.png" alt="فضای داخلی مدرن کلینیک دندان‌پزشکی اورئا" />
          <div className="imageLabel"><span>فضایی آرام</span><small>برای تجربه‌ای متفاوت</small></div>
        </div>
        <div className="heroCopy">
          <p className="eyebrow">تجربه‌ای متفاوت از دندان‌پزشکی</p>
          <h1>لبخندی که با<br/><em>زیبایی</em> آغاز می‌شود</h1>
          <p className="lead">دندان‌پزشکی زیبایی و درمانی در فضایی آرام، با استانداردهای روز و توجهی که شایسته شماست.</p>
          <div className="heroActions"><a className="goldButton" href="#appointment">رزرو وقت مشاوره <span>←</span></a><a className="textLink" href="#services">مشاهده خدمات</a></div>
          <div className="trust"><div><strong>+۱۲</strong><span>سال تجربه</span></div><div><strong>+۳۸۰۰</strong><span>مراجع راضی</span></div><div><strong>۹۸٪</strong><span>رضایت مراجعان</span></div></div>
        </div>
      </section>

      <section className="intro section"><div><p className="eyebrow">چرا کلینیک اورئا؟</p><h2>دقت در درمان،<br/>ظرافت در نتیجه</h2></div><p>ما باور داریم دندان‌پزشکی حرفه‌ای فقط درمان یک دندان نیست؛ ترکیبی از علم، هنر و ایجاد حس آرامش است. از نخستین مشاوره تا پایان درمان، تمام جزئیات با دقت برای شما برنامه‌ریزی می‌شود.</p></section>

      <section className="services section" id="services">
        <div className="sectionHead"><div><p className="eyebrow">خدمات تخصصی</p><h2>همه‌چیز برای یک لبخند سالم</h2></div><p>خدمات جامع درمانی و زیبایی، با طرح درمان اختصاصی برای نیازهای شما.</p></div>
        <div className="serviceGrid">{services.map((service, i) => <article className="serviceCard" key={service.title}><span className="serviceNo">۰{i + 1}</span><i>{service.icon}</i><h3>{service.title}</h3><p>{service.text}</p><a href="#appointment" aria-label={`رزرو ${service.title}`}>اطلاعات بیشتر ←</a></article>)}</div>
      </section>

      <section className="doctor section" id="doctor">
        <div className="doctorPortrait"><div className="portraitArt"><span>دکتر آریا مهر</span></div><div className="experience"><strong>۱۲+</strong><span>سال تجربه حرفه‌ای</span></div></div>
        <div className="doctorCopy"><p className="eyebrow">درباره پزشک</p><h2>دانش، تجربه و<br/>توجه به جزئیات</h2><h3>دکتر آریا مهر</h3><p className="doctorRole">جراح و دندان‌پزشک زیبایی</p><p>هدف ما ساختن تجربه‌ای آرام، شفاف و قابل اعتماد است. پیش از هر درمان، گزینه‌ها با زبان ساده توضیح داده می‌شوند تا با آگاهی کامل تصمیم بگیرید.</p><ul><li>عضو انجمن دندان‌پزشکان زیبایی</li><li>دارای گواهی طراحی دیجیتال لبخند</li><li>بیش از ۳۸۰۰ درمان موفق</li></ul><a className="outlineButton" href="#appointment">دریافت مشاوره</a></div>
      </section>

      <section className="gallery section" id="gallery">
        <div className="sectionHead"><div><p className="eyebrow">نمونه درمان‌ها</p><h2>نتیجه‌ای طبیعی، متناسب با شما</h2></div><p>نمونه‌های نمایشی؛ تصاویر واقعی کلینیک در نسخه نهایی جایگزین می‌شوند.</p></div>
        <div className="galleryGrid"><div className="case caseOne"><span>طراحی لبخند</span></div><div className="case caseTwo"><span>لمینت سرامیکی</span></div><div className="case caseThree"><span>سفید کردن</span></div></div>
      </section>

      <section className="testimonial section"><p className="eyebrow">تجربه مراجعان</p><blockquote>«از همان جلسه اول، توضیحات دقیق و فضای آرام کلینیک باعث شد با اطمینان درمانم را شروع کنم. نتیجه کاملاً طبیعی و بهتر از چیزی شد که تصور می‌کردم.»</blockquote><div className="client"><span>ن. ش</span><div><strong>مراجع طراحی لبخند</strong><small>★★★★★</small></div></div></section>

      <section className="faq section"><div><p className="eyebrow">سوالات متداول</p><h2>پاسخ سوال‌های شما</h2><p>اگر پاسخ پرسش خود را پیدا نکردید، با ما تماس بگیرید.</p><a className="textLink" href="#contact">ارتباط با کلینیک ←</a></div><div className="faqList">{faqs.map(([q, a], i) => <article className={openFaq === i ? "faqItem active" : "faqItem"} key={q}><button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}><span>{q}</span><b>{openFaq === i ? "−" : "+"}</b></button><p>{a}</p></article>)}</div></section>

      <section className="appointment section" id="appointment">
        <div className="appointmentCopy"><p className="eyebrow">رزرو وقت مشاوره</p><h2>اولین قدم برای<br/>لبخند جدید شما</h2><p>فرم را تکمیل کنید تا برای هماهنگی زمان مناسب با شما تماس بگیریم.</p><div className="contactBits"><span>☎ ۰۲۱ ۲۲۳۳ ۴۴۵۵</span><span>◷ شنبه تا پنجشنبه، ۹ تا ۱۹</span><span>⌖ تهران، خیابان نمونه، پلاک ۱۲</span></div></div>
        <form onSubmit={submitAppointment}><label>نام و نام خانوادگی<input required name="name" placeholder="نام شما" /></label><label>شماره تماس<input required name="phone" inputMode="tel" placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰" /></label><label>خدمت مورد نظر<select name="service" defaultValue=""><option value="" disabled>انتخاب کنید</option>{services.map(s => <option key={s.title}>{s.title}</option>)}</select></label><label>توضیحات<textarea name="message" rows={3} placeholder="در صورت نیاز توضیح کوتاهی بنویسید" /></label><button className="goldButton" type="submit">ثبت درخواست مشاوره ←</button>{sent && <p className="success">درخواست شما ثبت شد. برای هماهنگی با شما تماس می‌گیریم.</p>}</form>
      </section>

      <footer id="contact"><div className="footerTop"><div className="brand footerBrand"><span>AUREA</span><small>DENTAL CLINIC</small><p>لبخندی سالم، طبیعی و ماندگار.</p></div><div><h4>دسترسی سریع</h4><a href="#services">خدمات</a><a href="#doctor">درباره پزشک</a><a href="#gallery">نمونه‌کارها</a></div><div><h4>ارتباط با ما</h4><p>۰۲۱ ۲۲۳۳ ۴۴۵۵</p><p>info@aureadental.ir</p><p>تهران، خیابان نمونه، پلاک ۱۲</p></div><div><h4>ساعات کاری</h4><p>شنبه تا چهارشنبه: ۹–۱۹</p><p>پنجشنبه: ۹–۱۴</p><p>جمعه: تعطیل</p></div></div><div className="footerBottom"><span>© ۱۴۰۵ کلینیک دندان‌پزشکی اورئا</span><span>این وب‌سایت نسخه نمایشی است.</span></div></footer>
    </main>
  );
}
