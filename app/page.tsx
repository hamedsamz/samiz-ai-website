"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Lang = "en" | "fa";
const SLIDE_COUNT = 4;

const copy = {
  en: {
    nav: ["Home", "AI Videos", "Courses", "Events", "AI News"],
    contact: "Contact",
    eyebrow: "AI CREATIVE STUDIO + ACADEMY",
    titleA: "SAMIZ AI. ",
    titleB: "Create, Learn, Lead with AI.",
    lead: "High-converting AI videos, practical courses, events, and the latest AI intelligence — all in one place.",
    primary: "Order an AI Video",
    secondary: "Explore Courses",
    featured: "FEATURED COURSE",
    course: "Prompt Engineering",
    courseSub: "From Better Prompts to Real Results",
    meta: ["Live cohort", "6 weeks", "Persian + English"],
    view: "View Course",
    videoKicker: "AI VIDEO SERVICES",
    videoTitle: "Ads that stop the scroll",
    newsKicker: "AI NEWS",
    newsTitle: "What changed this week in AI",
    strip: ["AI VIDEO", "CREATIVE STRATEGY", "PRACTICAL EDUCATION", "AI INTELLIGENCE"],
    servicesKicker: "WHAT WE CREATE",
    servicesTitle: "Advertising videos built for attention.",
    servicesLead: "From the first idea to the final cut, we combine creative direction, AI production and human taste.",
    services: [
      ["Product Ads", "Cinematic product stories made for social campaigns."],
      ["Short-form Video", "Fast, memorable videos built for Reels, Shorts and TikTok."],
      ["AI Spokesperson", "Natural presenter-led content without a traditional shoot."],
    ],
    academy: "SAMIZ ACADEMY",
    academyTitle: "Learn AI by building real things.",
    parts: ["Prompt Engineering Principles", "AI-Assisted Content Creation", "AI Advertising Video & Monetization"],
    instructors: ["Dr. Abutaleb Moradi", "Hamed Samizadeh", "Meij Bahrami"],
    soon: "Registration opening soon",
    event: "UPCOMING EVENT",
    eventTitle: "Practical AI for Content Creators",
    eventDesc: "A focused live session on turning AI tools into a repeatable creative workflow.",
    updates: "LATEST INTELLIGENCE",
    updatesTitle: "AI news, made useful.",
    articles: [
      ["MODELS", "A clearer way to understand the new generation of AI models"],
      ["VIDEO AI", "What creators should watch in the next wave of AI video"],
      ["PROMPTING", "Why context matters more than clever prompt tricks"],
    ],
    cta: "Ready to turn your idea into a video?",
    ctaSub: "Tell us what you are building. We will help shape the right creative direction.",
    start: "Start a Project",
    footer: "AI creative studio and academy based in Alberta, Canada.",
  },
  fa: {
    nav: ["خانه", "ویدیوهای تبلیغاتی", "دوره‌ها", "رویدادها", "اخبار هوش مصنوعی"],
    contact: "تماس با ما",
    eyebrow: "استودیوی خلاقیت + آکادمی هوش مصنوعی",
    titleA: "SAMIZ AI؛ ",
    titleB: "بساز، یاد بگیر و با هوش مصنوعی پیشتاز باش.",
    lead: "ویدیوهای تبلیغاتی تأثیرگذار، دوره‌های کاربردی، رویدادها و تازه‌ترین اخبار هوش مصنوعی؛ همه در یک‌جا.",
    primary: "سفارش ویدیوی تبلیغاتی",
    secondary: "مشاهده دوره‌ها",
    featured: "دوره ویژه",
    course: "مهندسی پرامپت",
    courseSub: "از پرامپت بهتر تا نتیجه واقعی",
    meta: ["کلاس زنده", "۶ هفته", "فارسی + انگلیسی"],
    view: "مشاهده دوره",
    videoKicker: "خدمات ویدیویی AI",
    videoTitle: "تبلیغاتی که مخاطب را متوقف می‌کنند",
    newsKicker: "اخبار هوش مصنوعی",
    newsTitle: "این هفته در هوش مصنوعی چه تغییراتی رخ داد؟",
    strip: ["ویدیوی AI", "استراتژی خلاق", "آموزش کاربردی", "هوش و تحلیل AI"],
    servicesKicker: "چه چیزی می‌سازیم",
    servicesTitle: "ویدیوهای تبلیغاتی ساخته‌شده برای جلب توجه.",
    servicesLead: "از ایده اولیه تا تدوین نهایی، مسیر خلاقیت، تولید با AI و سلیقه انسانی را کنار هم قرار می‌دهیم.",
    services: [
      ["تبلیغات محصول", "روایت‌های سینمایی از محصول برای کمپین‌های شبکه‌های اجتماعی."],
      ["ویدیوهای کوتاه", "ویدیوهای سریع و ماندگار برای ریلز، شورتس و تیک‌تاک."],
      ["سخنگوی هوش مصنوعی", "محتوای طبیعی با مجری، بدون نیاز به فیلم‌برداری سنتی."],
    ],
    academy: "آکادمی سمیز",
    academyTitle: "هوش مصنوعی را با ساخت پروژه‌های واقعی یاد بگیرید.",
    parts: ["اصول مهندسی پرامپت", "تولید محتوا با کمک هوش مصنوعی", "ساخت ویدیو تبلیغاتی و رسیدن به درآمد"],
    instructors: ["دکتر ابوطالب مرادی", "حامد سمیزاده", "میج بهرامی"],
    soon: "ثبت‌نام به‌زودی آغاز می‌شود",
    event: "رویداد آینده",
    eventTitle: "هوش مصنوعی کاربردی برای تولیدکنندگان محتوا",
    eventDesc: "یک جلسه زنده و متمرکز برای تبدیل ابزارهای AI به یک فرایند خلاقانه تکرارپذیر.",
    updates: "تازه‌ترین تحلیل‌ها",
    updatesTitle: "اخبار AI، ساده و کاربردی.",
    articles: [
      ["مدل‌ها", "نسل جدید مدل‌های هوش مصنوعی را چطور بهتر بشناسیم؟"],
      ["ویدیوی AI", "موج بعدی ویدیوهای هوش مصنوعی چه چیزی برای تولیدکنندگان دارد؟"],
      ["پرامپت‌نویسی", "چرا کانتکست از ترفندهای پرامپت‌نویسی مهم‌تر است؟"],
    ],
    cta: "آماده‌اید ایده‌تان را به ویدیو تبدیل کنید؟",
    ctaSub: "درباره پروژه‌تان بگویید تا بهترین مسیر خلاقانه را باهم شکل بدهیم.",
    start: "شروع پروژه",
    footer: "استودیوی خلاقیت و آکادمی هوش مصنوعی در آلبرتا، کانادا.",
  },
};

function Mark() {
  return <span className="mark" aria-hidden="true"><i>S</i><b>AI</b></span>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("fa");
  const [menu, setMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const didDrag = useRef(false);
  const t = copy[lang];

  useEffect(() => {
    const saved = localStorage.getItem("samiz-lang") as Lang | null;
    const preferred = saved === "fa" || saved === "en" ? saved : "fa";
    const frame = requestAnimationFrame(() => setLang(preferred));
    return () => cancelAnimationFrame(frame);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    localStorage.setItem("samiz-lang", next);
  };

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  const moveSlider = (direction: -1 | 1) => {
    setActiveSlide(slide => (slide + direction + SLIDE_COUNT) % SLIDE_COUNT);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    dragOffsetRef.current = 0;
    didDrag.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const nextOffset = event.clientX - dragStartX.current;
    dragOffsetRef.current = nextOffset;
    if (Math.abs(nextOffset) > 6) didDrag.current = true;
    setDragOffset(nextOffset);
  };

  const finishDrag = () => {
    if (dragStartX.current === null) return;
    const offset = dragOffsetRef.current;
    dragStartX.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    if (Math.abs(offset) >= 70) moveSlider(offset < 0 ? 1 : -1);
    window.setTimeout(() => { didDrag.current = false; }, 0);
  };

  const slideStyle = (index: number) => {
    const wrapped = (index - activeSlide + SLIDE_COUNT) % SLIDE_COUNT;
    const position = wrapped > SLIDE_COUNT / 2 ? wrapped - SLIDE_COUNT : wrapped;
    const distance = Math.abs(position);
    const side = position < 0 ? -1 : 1;
    const x = distance === 0
      ? "0px"
      : `${side < 0 ? "calc(-1 * " : ""}var(--wing-${distance === 1 ? "near" : "far"})${side < 0 ? ")" : ""}`;
    const z = distance === 0 ? "0px" : `calc(-1 * var(--wing-depth-${distance === 1 ? "near" : "far"}))`;
    const angle = distance === 0 ? 0 : side * (distance === 1 ? -42 : -65);
    const scale = distance === 0 ? 1 : distance === 1 ? .88 : .72;
    return {
      transform: `translateX(-50%) translateX(${x}) translateX(${dragOffset}px) translateZ(${z}) rotateY(${angle}deg) scale(${scale})`,
      opacity: distance === 0 ? 1 : distance === 1 ? .78 : .28,
      zIndex: 10 - distance,
    };
  };

  return (
    <main dir={lang === "fa" ? "rtl" : "ltr"} lang={lang} className={lang === "fa" ? "fa" : "en"}>
      <header className="header">
        <a className="logo" href="#top" aria-label="Samiz AI home"><Mark /><span>SAMIZ AI</span></a>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          {t.nav.map((item, i) => <a key={item} href={["#top", "#services", "#academy", "#events", "#news"][i]} onClick={() => setMenu(false)}>{item}</a>)}
        </nav>
        <div className="header-actions">
          <div className="lang" aria-label="Language selector"><button className={lang === "en" ? "active" : ""} onClick={() => changeLang("en")}>EN</button><span>/</span><button className={lang === "fa" ? "active" : ""} onClick={() => changeLang("fa")}>فا</button></div>
          <a className="outline-button desktop-contact" href="#contact">{t.contact}</a>
          <button className="menu-button" aria-label="Toggle menu" onClick={() => setMenu(!menu)}><span></span><span></span></button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.titleA}<em>{t.titleB}</em></h1>
          <p className="lead">{t.lead}</p>
          <div className="actions"><a className="gold-button" href="#contact"><span>✦</span>{t.primary}</a><a className="text-button" href="#academy">{t.secondary} <span>→</span></a></div>
        </div>
        <div className="gold-visual" aria-hidden="true"><div className="orb"></div><div className="beam beam-one"></div><div className="beam beam-two"></div><div className="portal"></div></div>

        <div
          className={`feature-stage${isDragging ? " dragging" : ""}`}
          aria-label={lang === "fa" ? "اسلایدر خدمات و دوره‌ها" : "Services and courses slider"}
          onPointerDown={startDrag}
          onPointerMove={updateDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onClickCapture={(event) => {
            if (!didDrag.current) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <div className="coverflow-track">
            <article className="peek-card video-card cylinder-card" data-active={activeSlide === 0} style={slideStyle(0)}><div className="card-art play-art"><span>▶</span></div><div className="teaser-copy"><small>{t.videoKicker}</small><h3>{t.videoTitle}</h3><a className="outline-button" href="#services">{t.primary}</a></div></article>
            <article className="main-card cylinder-card" data-active={activeSlide === 1} style={slideStyle(1)}>
              <div className="course-copy"><small className="pill">★ {t.featured}</small><h2>{t.course}</h2><p>{t.courseSub}</p><div className="meta">{t.meta.map(x => <span key={x}>{x}</span>)}</div><a className="gold-button compact" href="#academy">{t.view} <span>→</span></a></div>
              <div className="prompt-art"><div className="prompt-window"><b>&gt;_</b><p>Create a high-converting video ad for a product.</p></div><span className="tag t1">Role</span><span className="tag t2">Goal</span><span className="tag t3">Audience</span><span className="tag t4">Tone</span></div>
            </article>
            <article className="peek-card news-card cylinder-card" data-active={activeSlide === 2} style={slideStyle(2)}><div className="card-art globe-art"><span>AI</span></div><div className="teaser-copy"><small>{t.newsKicker}</small><h3>{t.newsTitle}</h3><a className="outline-button" href="#news">{t.updates}</a></div></article>
            <article className="peek-card event-feature cylinder-card" data-active={activeSlide === 3} style={slideStyle(3)}><div className="card-art event-mini-art"><span>LIVE</span></div><div className="teaser-copy"><small>{t.event}</small><h3>{t.eventTitle}</h3><p>{t.eventDesc}</p><a className="outline-button" href="#events">{t.soon}</a></div></article>
          </div>
        </div>
        <div className="slider-controls">
          <button type="button" onClick={() => moveSlider(-1)} aria-label={lang === "fa" ? "حرکت به چپ" : "Previous card"}>←</button>
          <div className="pagination" aria-label={lang === "fa" ? "انتخاب کارت" : "Choose a card"}>
            {Array.from({ length: SLIDE_COUNT }, (_, index) => (
              <button key={index} type="button" className={activeSlide === index ? "active" : ""} onClick={() => goToSlide(index)} aria-label={`${index + 1} ${lang === "fa" ? `از ${SLIDE_COUNT}` : `of ${SLIDE_COUNT}`}`}>0{index + 1}</button>
            ))}
          </div>
          <button type="button" onClick={() => moveSlider(1)} aria-label={lang === "fa" ? "حرکت به راست" : "Next card"}>→</button>
        </div>
      </section>

      <section className="strip">{t.strip.map(x => <span key={x}>✦ {x}</span>)}</section>

      <section className="section services" id="services">
        <div className="section-heading"><div><p className="eyebrow">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2></div><p>{t.servicesLead}</p></div>
        <div className="service-grid">{t.services.map((s, i) => <article key={s[0]}><span className="number">0{i + 1}</span><div className={`service-icon icon-${i}`}></div><h3>{s[0]}</h3><p>{s[1]}</p><a href="#contact" aria-label={s[0]}>↗</a></article>)}</div>
      </section>

      <section className="section academy" id="academy">
        <div className="academy-art"><div className="academy-ring"><Mark /></div><span className="float f1">ROLE</span><span className="float f2">GOAL</span><span className="float f3">CONTEXT</span></div>
        <div className="academy-copy"><p className="eyebrow">{t.academy}</p><h2>{t.academyTitle}</h2><div className="curriculum">{t.parts.map((part, i) => <div key={part}><span>0{i + 1}</span><p><b>{part}</b><small>{t.instructors[i]}</small></p></div>)}</div><button className="gold-button">{t.soon}</button></div>
      </section>

      <section className="section event-news" id="events">
        <article className="event-card"><p className="eyebrow">{t.event}</p><h2>{t.eventTitle}</h2><p>{t.eventDesc}</p><div className="event-meta"><span>LIVE</span><span>ONLINE</span><span>FA + EN</span></div><a href="#contact" className="outline-button">{t.soon}</a></article>
        <div className="event-orbit" aria-hidden="true"><span>AI</span></div>
      </section>

      <section className="section news" id="news">
        <div className="section-heading"><div><p className="eyebrow">{t.updates}</p><h2>{t.updatesTitle}</h2></div></div>
        <div className="news-grid">{t.articles.map((a, i) => <article key={a[1]}><div className={`news-art n${i}`}><span>{i === 0 ? "◎" : i === 1 ? "▶" : "{ }"}</span></div><small>{a[0]}</small><h3>{a[1]}</h3><a href="#contact">↗</a></article>)}</div>
      </section>

      <section className="final-cta" id="contact"><div><p className="eyebrow">SAMIZ AI</p><h2>{t.cta}</h2><p>{t.ctaSub}</p></div><a className="gold-button" href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">{t.start} <span>→</span></a></section>

      <footer><a className="logo" href="#top"><Mark /><span>SAMIZ AI</span></a><p>{t.footer}</p><a href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">@hamedsamizadeh</a></footer>
    </main>
  );
}
