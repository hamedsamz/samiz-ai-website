"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Lang = "en" | "fa";
const SLIDE_COUNT = 3;

const copy = {
  en: {
    nav: ["Home", "AI Videos", "Courses", "AI News"],
    contact: "Contact",
    eyebrow: "AI CREATIVE STUDIO + ACADEMY",
    titleA: "SAMIZ AI. ",
    titleB: "Create, Learn, Lead with AI.",
    lead: "High-converting AI videos, practical courses, events, and the latest AI intelligence — all in one place.",
    founderQuote: "AI is not going to replace you. But someone who knows how to use it probably will.",
    founderLead: "Here, we learn how to create more boldly, work more intelligently, and become more visible with AI.",
    founderIntro: "I’m Hamed Sami Zadeh. I help turn AI from a complex tool into a practical, real-world skill.",
    flipHint: "Click to learn more",
    flipBack: "Click to return",
    primary: "View Portfolio",
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
    portfolioTitle: "AI-Generated Advertising Video Samples",
    services: [
      ["Product Ads", "Cinematic product stories made for social campaigns."],
      ["Short-form Video", "Fast, memorable videos built for Reels, Shorts and TikTok."],
      ["AI Spokesperson", "Natural presenter-led content without a traditional shoot."],
    ],
    academy: "SAMIZ ACADEMY",
    academyTitle: "Introductory Prompt Engineering Course",
    parts: ["Prompt Engineering Principles & Content Creation", "Advertising Video Production & Monetization"],
    instructors: ["Hamed Sami Zadeh & Dr. Abutaleb Moradi", "Mage Bahrami"],
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
    cta: "Let’s create something meaningful together.",
    ctaSub: "For advertising campaigns, educational collaborations, and creative AI projects, connect with Samiz.",
    start: "Start a Project",
    footer: "AI creative studio and academy based in Alberta, Canada.",
  },
  fa: {
    nav: ["خانه", "ویدیوهای تبلیغاتی", "دوره‌ها", "اخبار هوش مصنوعی"],
    contact: "تماس با ما",
    eyebrow: "استودیوی خلاقیت + آکادمی هوش مصنوعی",
    titleA: "SAMIZ AI؛ ",
    titleB: "بساز، یاد بگیر و با هوش مصنوعی پیشتاز باش.",
    lead: "ویدیوهای تبلیغاتی تأثیرگذار، دوره‌های کاربردی، رویدادها و تازه‌ترین اخبار هوش مصنوعی؛ همه در یک‌جا.",
    founderQuote: "هوش مصنوعی قرار نیست جای شما را بگیرد؛ اما کسی که بلد است از آن استفاده کند، احتمالاً این کار را می‌کند.",
    founderLead: "اینجا یاد می‌گیریم چطور با هوش مصنوعی خلاق‌تر بسازیم، هوشمندانه‌تر کار کنیم و اثرگذارتر دیده شویم.",
    founderIntro: "من حامد سمیع‌زاده‌ام؛ اینجا کمک می‌کنم هوش مصنوعی را از یک ابزار پیچیده، به یک مهارت واقعی و کاربردی تبدیل کنید.",
    flipHint: "برای آشنایی بیشتر کلیک کنید",
    flipBack: "برای بازگشت کلیک کنید",
    primary: "مشاهده نمونه‌کارها",
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
    portfolioTitle: "نمونه ویدیوهای تبلیغاتی ساخته‌شده توسط هوش مصنوعی",
    services: [
      ["تبلیغات محصول", "روایت‌های سینمایی از محصول برای کمپین‌های شبکه‌های اجتماعی."],
      ["ویدیوهای کوتاه", "ویدیوهای سریع و ماندگار برای ریلز، شورتس و تیک‌تاک."],
      ["سخنگوی هوش مصنوعی", "محتوای طبیعی با مجری، بدون نیاز به فیلم‌برداری سنتی."],
    ],
    academy: "آکادمی سمیز",
    academyTitle: "دوره مقدماتی مهندسی پرامپت",
    parts: ["اصول مهندسی پرامپت و تولید محتوا", "ساخت ویدئوی تبلیغاتی و رسیدن به درآمد"],
    instructors: ["حامد سمیع زاده و دکتر ابوطالب مرادی", "میج بهرامی"],
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
    cta: "بیایید باهم چیزی اثرگذار خلق کنیم",
    ctaSub: "برای کمپین‌های تبلیغاتی، همکاری‌های آموزشی و پروژه‌های خلاقانه هوش مصنوعی، با سمیز در ارتباط باشید.",
    start: "شروع پروژه",
    footer: "استودیوی خلاقیت و آکادمی هوش مصنوعی در آلبرتا، کانادا.",
  },
};

const newsItems = {
  en: [
    { tag: "AI ADOPTION", title: "How to manage AI investments in the agentic era", url: "https://openai.com/index/managing-ai-investments-in-agentic-era/", image: "https://images.ctfassets.net/kftzwdyauwt9/1qXMreHMXalbFSVXr2CJXW/acbd7f4e05bd38b80a99523967ef69b7/Frame.png?fm=webp&q=75&w=1200" },
    { tag: "PRODUCT", title: "GPT-5.6 is now the preferred model in Microsoft 365 Copilot", url: "https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot/", image: "https://images.ctfassets.net/kftzwdyauwt9/3MPipvFMxS8m3kTyCtwFgj/015747dcd34cb667a221688cfca64e0f/Frame.png?fm=webp&q=75&w=1200" },
    { tag: "MODELS", title: "GPT-5.6: Frontier intelligence that scales with your ambition", url: "https://openai.com/index/gpt-5-6/", image: "https://images.ctfassets.net/kftzwdyauwt9/1a9IPPV5nXWydTBosgmgYI/8e03f28ca04f26edc8bc81cdba387df1/5-6.jpg?fm=webp&q=75&w=1200" },
  ],
  fa: [
    { tag: "کاربرد هوش مصنوعی", title: "پنج گام عملی برای مدیریت سرمایه‌گذاری در عصر عامل‌های هوش مصنوعی", url: "https://openai.com/index/managing-ai-investments-in-agentic-era/", image: "https://images.ctfassets.net/kftzwdyauwt9/1qXMreHMXalbFSVXr2CJXW/acbd7f4e05bd38b80a99523967ef69b7/Frame.png?fm=webp&q=75&w=1200" },
    { tag: "محصول", title: "GPT-5.6 به مدل منتخب Microsoft 365 Copilot تبدیل شد", url: "https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot/", image: "https://images.ctfassets.net/kftzwdyauwt9/3MPipvFMxS8m3kTyCtwFgj/015747dcd34cb667a221688cfca64e0f/Frame.png?fm=webp&q=75&w=1200" },
    { tag: "مدل‌ها", title: "معرفی GPT-5.6؛ هوش مرزی با بهره‌وری بیشتر", url: "https://openai.com/index/gpt-5-6/", image: "https://images.ctfassets.net/kftzwdyauwt9/1a9IPPV5nXWydTBosgmgYI/8e03f28ca04f26edc8bc81cdba387df1/5-6.jpg?fm=webp&q=75&w=1200" },
  ],
};

function Mark() {
  return <span className="mark" aria-hidden="true"><i>S</i><b>AI</b></span>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="icon-dot" cx="17.4" cy="6.7" r="1" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.6Z" /><path d="M8.2 7.6c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4-.1.7.5 1 1.3 1.8 2.3 2.3.3.2.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .3-.2 1.4-1 2-.7.6-1.6.8-2.6.5-1.4-.4-2.8-1.1-4.1-2.3-1.1-1-2.1-2.4-2.5-3.8-.4-1.2 0-2.4.6-3Z" /></svg>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("fa");
  const [menu, setMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isFounderCardFlipped, setIsFounderCardFlipped] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const didDrag = useRef(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
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
    setIsDragging(false);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const nextOffset = event.clientX - dragStartX.current;
    dragOffsetRef.current = nextOffset;
    if (Math.abs(nextOffset) > 6 && !didDrag.current) {
      didDrag.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
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
          {t.nav.map((item, i) => <a key={item} href={["#top", "#portfolio", "#academy", "#news"][i]} onClick={() => setMenu(false)}>{item}</a>)}
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
          <div className="actions"><a className="text-button" href="#academy">{t.secondary} <span>→</span></a></div>
        </div>
        <button type="button" className={`hero-portrait${isFounderCardFlipped ? " is-flipped" : ""}`} onClick={() => setIsFounderCardFlipped(value => !value)} aria-pressed={isFounderCardFlipped} aria-label={isFounderCardFlipped ? t.flipBack : t.flipHint}>
          <span className="founder-card-inner">
            <span className="founder-card-face founder-card-front"><img src="/images/hamed-sami-zadeh.jpg" alt={lang === "fa" ? "حامد سمیع‌زاده" : "Hamed Sami Zadeh"} /><span className="founder-card-caption"><strong>{lang === "fa" ? "حامد سمیع‌زاده" : "Hamed Sami Zadeh"}</strong><small>Founder · SAMIZ AI</small></span><span className="flip-hint">↻ {t.flipHint}</span></span>
            <span className="founder-card-face founder-card-back"><small className="founder-card-kicker">SAMIZ AI · FOUNDER</small><strong>{t.founderQuote}</strong><p>{t.founderLead}</p><p className="founder-personal">{t.founderIntro}</p><span className="flip-back">↻ {t.flipBack}</span></span>
          </span>
        </button>

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
            <article className="course-designed-card cylinder-card" data-active={activeSlide === 0} style={slideStyle(0)}>
              <div className="course-slide-content">
                <div className="course-slide-copy">
                  <span className="course-slide-kicker">SAMIZ AI ACADEMY</span>
                  <h2>{lang === "fa" ? "دوره مقدماتی مهندسی پرامپت" : "Introductory Prompt Engineering Course"}</h2>
                  <p>{lang === "fa" ? "اصول پرامپت نویسی، تولید محتوا و ساخت ویدیوهای تبلیغاتی" : "Prompt writing fundamentals, content creation, and advertising video production"}</p>
                  <a className="course-details-button" href="#academy">{lang === "fa" ? "جزئیات بیشتر" : "More details"}<span>↓</span></a>
                </div>
                <div className="course-slide-art" aria-hidden="true">
                  <div className="course-orbit"></div>
                  <div className="prompt-panel"><span>&gt;_</span><i></i><i></i><i></i></div>
                  <div className="video-stack"><b></b><b></b><b></b><span>▶</span></div>
                </div>
              </div>
            </article>
            <article className="peek-card video-card cylinder-card" data-active={activeSlide === 1} style={slideStyle(1)}><div className="card-art play-art"><span>▶</span></div><div className="teaser-copy"><small>{t.videoKicker}</small><h3>{t.videoTitle}</h3><a className="outline-button" href="#portfolio">{t.primary}</a></div></article>
            <article className="peek-card news-card cylinder-card" data-active={activeSlide === 2} style={slideStyle(2)}><div className="card-art globe-art"><span>AI</span></div><div className="teaser-copy"><small>{t.newsKicker}</small><h3>{t.newsTitle}</h3><a className="outline-button" href="#news">{t.updates}</a></div></article>
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

      <section className="section academy" id="academy">
        <div className="academy-art"><div className="academy-ring"><Mark /></div><span className="float f1">ROLE</span><span className="float f2">GOAL</span><span className="float f3">CONTEXT</span></div>
        <div className="academy-copy"><p className="eyebrow">{t.academy}</p><h2 className="academy-course-title">{t.academyTitle}</h2><div className="curriculum">{t.parts.map((part, i) => <div key={part}><p><b>{part}</b><small>{t.instructors[i]}</small></p></div>)}</div><button className="gold-button">{t.soon}</button></div>
      </section>

      <section className="section video-showcase" id="portfolio">
        <div className="video-showcase-heading"><h2>{t.portfolioTitle}</h2></div>
        <div className="video-showcase-grid">
          {["01", "02", "03"].map((id, index) => (
            <div className="video-frame" key={id}>
              <video
                ref={(video) => { videoRefs.current[index] = video; }}
                controls
                controlsList="nofullscreen"
                loop
                playsInline
                preload="metadata"
                poster={`/videos/video-${id}.jpg`}
                aria-label={`${t.portfolioTitle} ${index + 1}`}
                onPlay={(event) => {
                  videoRefs.current.forEach((video) => {
                    if (video && video !== event.currentTarget) video.pause();
                  });
                }}
                onClick={(event) => {
                  const video = event.currentTarget;
                  const bounds = video.getBoundingClientRect();
                  if (event.clientY >= bounds.bottom - 55) return;
                  if (video.paused) void video.play();
                  else video.pause();
                }}
              >
                <source src={`/videos/video-${id}.mp4`} type="video/mp4" />
              </video>
            </div>
          ))}
        </div>
      </section>

      <section className="section news" id="news">
        <div className="section-heading"><div><p className="eyebrow">{t.updates}</p><h2>{t.updatesTitle}</h2></div></div>
        <div className="news-grid">{newsItems[lang].map((article) => <a className="news-card-link" href={article.url} target="_blank" rel="noreferrer" key={article.url}><article><div className="news-art news-photo" style={{ backgroundImage: `url(${article.image})` }}></div><small>{article.tag}</small><h3>{article.title}</h3><span className="news-card-arrow">↗</span></article></a>)}</div>
      </section>

      <section className="final-cta" id="contact"><div><p className="eyebrow">SAMIZ AI</p><h2>{t.cta}</h2><p>{t.ctaSub}</p></div><div className="contact-socials"><a className="social-icon instagram-icon" href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon /></a><a className="social-icon whatsapp-icon" href="https://wa.me/18259250075" target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon /></a></div></section>

      <footer><a className="logo" href="#top"><Mark /><span>SAMIZ AI</span></a><p>{t.footer}</p><a href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer">@hamedsamizadeh</a></footer>
    </main>
  );
}
