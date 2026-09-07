"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "fa" | "en";

const copy = {
  fa: {
    nav: ["خانه", "دوره‌ها", "نمونه‌کارها", "خدمات", "اخبار AI"],
    contact: "شروع همکاری",
    heroKicker: "آکادمی هوش مصنوعی + استودیوی خلاق",
    heroTitleA: "یاد بگیر.",
    heroTitleB: "بساز.",
    heroTitleC: "دیده شو.",
    heroLead: "سمیز جایی است برای یادگیری کاربردی هوش مصنوعی، ساخت ویدیوهای تبلیغاتی متفاوت و دنبال‌کردن مهم‌ترین تغییرات دنیای AI.",
    heroPrimary: "مشاهده دوره‌ها",
    heroSecondary: "دیدن نمونه‌کارها",
    heroScroll: "برای شروع اسکرول کنید",
    heroStages: [
      ["۰۱ / یادگیری", "هوش مصنوعی را بفهم.", "آموزش کاربردی و مفهومی؛ برای اینکه فقط مصرف‌کننده ابزارها نباشی."],
      ["۰۲ / ساختن", "ایده‌ات را بساز.", "از اولین پرامپت تا پروژه‌های واقعی، وب‌سایت، اپلیکیشن و ویدیوی هوش مصنوعی."],
      ["۰۳ / رشد", "دیده شو.", "دانش، خلاقیت و اجرا را کنار هم می‌گذاریم تا اثری بسازی که متوقف‌کننده اسکرول باشد."],
    ],
    reelLabel: "ویدیوی منتخب",
    marquee: ["آموزش کاربردی AI", "ویدیوی تبلیغاتی", "ساخت اپلیکیشن", "اخبار هوش مصنوعی"],
    courseKicker: "دوره منتخب / ۰۱",
    courseTitle: "کدینگ، وایب‌کدینگ؛ از اولین پرامپت تا اولین پروژه پایتون",
    courseText: "یک مسیر پروژه‌محور و بدون پیش‌نیاز برای یادگیری هوش مصنوعی، مهندسی پرامپت، مبانی پایتون و ساخت پروژه با کمک AI؛ با تدریس حامد سمیع‌زاده و دکتر هادی روشن.",
    courseFacts: [["شروع", "۱ مهر"], ["سطح", "از صفر"], ["رویکرد", "پروژه‌محور"]],
    courseCta: "جزئیات و ثبت‌نام",
    workKicker: "SAMIZ FILMS / نمونه‌کارها",
    workTitle: "تصویرهایی که برای توقف اسکرول ساخته شده‌اند.",
    workText: "هر ویدیو با یک هدف روشن شروع می‌شود: جلب توجه، ساختن حس و رساندن پیام برند در چند ثانیه.",
    playHint: "برای پخش کلیک کنید",
    capabilitiesKicker: "آنچه در سمیز انجام می‌شود",
    capabilitiesTitle: "یک برند؛ سه مسیر برای حرکت جلوتر.",
    cards: [
      ["۰۱", "آکادمی", "دوره‌های کاربردی برای تبدیل AI به یک مهارت واقعی.", "مشاهده دوره", "#course"],
      ["۰۲", "استودیوی ویدیو", "ایده‌پردازی و تولید ویدیوهای تبلیغاتی با هوش مصنوعی.", "دیدن ویدیوها", "#work"],
      ["۰۳", "محصولات AI", "طراحی ابزارها و اپلیکیشن‌های هوشمند برای نیاز واقعی.", "شروع گفتگو", "#contact"],
    ],
    newsKicker: "SAMIZ INTELLIGENCE",
    newsTitle: "خبر کمتر. فهم بیشتر.",
    newsText: "مهم‌ترین اتفاقات هوش مصنوعی را انتخاب می‌کنیم، ساده توضیح می‌دهیم و نشان می‌دهیم چرا برای کار و آینده شما مهم‌اند.",
    newsTags: ["کسب‌وکار AI", "محصول", "مدل‌ها"],
    newsTitles: ["مدیریت سرمایه‌گذاری در عصر عامل‌های هوش مصنوعی", "GPT-5.6 مدل منتخب Microsoft 365 Copilot شد", "معرفی GPT-5.6؛ هوش مرزی در مقیاس بزرگ"],
    founderKicker: "بنیان‌گذار سمیز",
    founderTitle: "فناوری پیچیده، با زبان روشن.",
    founderText: "من حامد سمیع‌زاده‌ام. هدفم این است که هوش مصنوعی را از یک موضوع پیچیده و دور، به ابزاری قابل‌فهم برای ساختن، یادگرفتن و رشد تبدیل کنم.",
    pythonLabel: "ابزار رایگان",
    pythonTitle: "آزمایشگاه آنلاین پایتون",
    pythonText: "کد بنویسید، همان‌جا اجرا کنید و با نمونه‌های فارسی تمرین کنید.",
    pythonCta: "ورود به آزمایشگاه",
    finalKicker: "یک ایده دارید؟",
    finalTitle: "بیایید آن را به چیزی تبدیل کنیم که دیده شود.",
    finalText: "برای دوره‌های آموزشی، ساخت ویدیوهای تبلیغاتی و پروژه‌های هوش مصنوعی با سمیز در ارتباط باشید.",
    whatsapp: "گفتگو در واتساپ",
    instagram: "اینستاگرام",
    footerLine: "آکادمی و استودیوی خلاق هوش مصنوعی — آلبرتا، کانادا",
    top: "بازگشت به بالا",
  },
  en: {
    nav: ["Home", "Courses", "Selected work", "Services", "AI News"],
    contact: "Start a project",
    heroKicker: "AI ACADEMY + CREATIVE STUDIO",
    heroTitleA: "Learn.",
    heroTitleB: "Create.",
    heroTitleC: "Get seen.",
    heroLead: "Samiz is where practical AI education, distinctive advertising films, and the developments shaping artificial intelligence come together.",
    heroPrimary: "Explore courses",
    heroSecondary: "View selected work",
    heroScroll: "Scroll to begin",
    heroStages: [
      ["01 / LEARN", "Understand AI.", "Practical, concept-led education—so you can do more than simply use the tools."],
      ["02 / CREATE", "Build your idea.", "Move from your first prompt to real projects, intelligent products, and AI films."],
      ["03 / GROW", "Get seen.", "Bring knowledge, creativity, and execution together to create work worth stopping for."],
    ],
    reelLabel: "Featured film",
    marquee: ["PRACTICAL AI EDUCATION", "AI ADVERTISING FILMS", "INTELLIGENT APPS", "AI INTELLIGENCE"],
    courseKicker: "FEATURED COURSE / 01",
    courseTitle: "Coding & Vibe Coding: from your first prompt to your first Python project",
    courseText: "A beginner-friendly, project-led path through AI, prompt engineering, Python fundamentals, and building real projects with AI; taught in Persian by Hamed Sami Zadeh and Dr. Hadi Roshan.",
    courseFacts: [["START", "1 Mehr"], ["LEVEL", "Beginner"], ["METHOD", "Project-led"]],
    courseCta: "Course details and registration",
    workKicker: "SAMIZ FILMS / SELECTED WORK",
    workTitle: "Images made to stop the scroll.",
    workText: "Every film begins with a clear objective: capture attention, create emotion, and communicate the brand in seconds.",
    playHint: "Select a film to play",
    capabilitiesKicker: "WHAT SAMIZ DOES",
    capabilitiesTitle: "One brand. Three ways to move ahead.",
    cards: [
      ["01", "Academy", "Practical courses that turn AI into a real skill.", "Explore courses", "#course"],
      ["02", "Video studio", "Concept and AI production for high-impact advertising films.", "View the films", "#work"],
      ["03", "AI products", "Useful intelligent tools and applications built around real needs.", "Start a conversation", "#contact"],
    ],
    newsKicker: "SAMIZ INTELLIGENCE",
    newsTitle: "Less news. More understanding.",
    newsText: "We select the AI developments that matter, explain them clearly, and show why they matter to your work and future.",
    newsTags: ["AI BUSINESS", "PRODUCT", "MODELS"],
    newsTitles: ["Managing investment in the age of AI agents", "GPT-5.6 becomes the preferred model in Microsoft 365 Copilot", "Introducing GPT-5.6: frontier intelligence at scale"],
    founderKicker: "FOUNDER OF SAMIZ",
    founderTitle: "Complex technology, spoken clearly.",
    founderText: "I'm Hamed Sami Zadeh. My goal is to turn AI from a distant, complicated subject into an understandable tool for creating, learning, and growing.",
    pythonLabel: "FREE TOOL",
    pythonTitle: "Online Python Lab",
    pythonText: "Write code, run it in the browser, and learn through practical examples.",
    pythonCta: "Open Python Lab",
    finalKicker: "HAVE AN IDEA?",
    finalTitle: "Let's turn it into something worth seeing.",
    finalText: "Connect with Samiz for practical courses, advertising films, and intelligent product projects.",
    whatsapp: "Talk on WhatsApp",
    instagram: "Instagram",
    footerLine: "AI academy and creative studio — Alberta, Canada",
    top: "Back to top",
  },
};

const newsLinks = [
  "https://openai.com/index/managing-ai-investments-in-agentic-era/",
  "https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot/",
  "https://openai.com/index/gpt-5-6/",
];
const newsImages = [
  "https://images.ctfassets.net/kftzwdyauwt9/1qXMreHMXalbFSVXr2CJXW/acbd7f4e05bd38b80a99523967ef69b7/Frame.png?fm=webp&q=75&w=1200",
  "https://images.ctfassets.net/kftzwdyauwt9/3MPipvFMxS8m3kTyCtwFgj/015747dcd34cb667a221688cfca64e0f/Frame.png?fm=webp&q=75&w=1200",
  "https://images.ctfassets.net/kftzwdyauwt9/1a9IPPV5nXWydTBosgmgYI/8e03f28ca04f26edc8bc81cdba387df1/5-6.jpg?fm=webp&q=75&w=1200",
];

function Brand() {
  return <span className="neo-brand"><b>S</b><i>AI</i><strong>SAMIZ</strong></span>;
}
function Arrow() { return <span aria-hidden="true">↗</span>; }
function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle className="fill-dot" cx="17.4" cy="6.7" r="1"/></svg>;
}
function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 11.8a8.4 8.4 0 0 1-12.5 7.3l-4.4 1.4 1.4-4.2a8.4 8.4 0 1 1 15.5-4.5Z"/><path className="phone-fill" d="M8.1 7.7c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4-.1.7.5 1 1.3 1.8 2.3 2.3.3.2.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .3-.2 1.4-1 2-.7.6-1.6.8-2.6.5-1.4-.4-2.8-1.1-4.1-2.3-1.1-1-2.1-2.4-2.5-3.8-.4-1.2 0-2.4.6-3Z"/></svg>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("fa");
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroStage, setHeroStage] = useState(0);
  const scrollHeroRef = useRef<HTMLElement | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const t = copy[lang];

  useEffect(() => {
    const saved = localStorage.getItem("samiz-lang");
    if (saved === "fa" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateHero = () => {
      frame = 0;
      const hero = scrollHeroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      hero.style.setProperty("--scroll-progress", progress.toFixed(4));
      const nextStage = progress < 0.3 ? 0 : progress < 0.67 ? 1 : 2;
      setHeroStage((current) => current === nextStage ? current : nextStage);
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHero);
    };
    updateHero();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const setLanguage = (next: Lang) => {
    setLang(next);
    localStorage.setItem("samiz-lang", next);
    setMenuOpen(false);
  };

  const anchors = ["#top", "#course", "#work", "#services", "#news"];

  return (
    <main id="top" className={`neo-home ${lang === "fa" ? "is-fa" : "is-en"}`} dir={lang === "fa" ? "rtl" : "ltr"} lang={lang}>
      <header className="neo-header">
        <a href="#top" className="neo-logo" aria-label="Samiz AI"><Brand /></a>
        <nav className={menuOpen ? "neo-nav is-open" : "neo-nav"} aria-label={lang === "fa" ? "منوی اصلی" : "Main navigation"}>
          {t.nav.map((item, index) => <a href={anchors[index]} key={item} onClick={() => setMenuOpen(false)}>{item}</a>)}
        </nav>
        <div className="neo-header-actions">
          <div className="neo-lang"><button onClick={() => setLanguage("fa")} className={lang === "fa" ? "active" : ""}>فا</button><span>/</span><button onClick={() => setLanguage("en")} className={lang === "en" ? "active" : ""}>EN</button></div>
          <a href="#contact" className="neo-contact">{t.contact}<Arrow /></a>
          <button className={menuOpen ? "neo-menu is-open" : "neo-menu"} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={lang === "fa" ? "باز کردن منو" : "Open menu"}><span/><span/></button>
        </div>
      </header>

      <section className="neo-scroll-hero" ref={scrollHeroRef}>
        <div className="neo-scroll-stage">
          <div className="neo-scroll-grid" aria-hidden="true" />
          <div className="neo-orbit orbit-one" aria-hidden="true" />
          <div className="neo-orbit orbit-two" aria-hidden="true" />
          <div className="neo-brain-scene" aria-hidden="true">
            <span className="neo-brain-core" />
            <img className="neo-brain brain-left" src="/images/ai-brain-header.webp" alt="" />
            <img className="neo-brain brain-right" src="/images/ai-brain-header.webp" alt="" />
          </div>

          <div className="neo-scroll-brand" aria-hidden="true">SAMIZ <i>AI</i></div>
          <div className="neo-stage-copy" aria-live="polite">
            {t.heroStages.map(([label, title, text], index) => (
              <div className={heroStage === index ? "neo-stage-text is-active" : "neo-stage-text"} key={label}>
                <p>{label}</p>
                <h1>{title}</h1>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="neo-scroll-footer">
            <div className="neo-actions"><a href="#course" className="neo-button solid">{t.heroPrimary}<Arrow /></a><a href="#work" className="neo-button text">{t.heroSecondary}<span>↓</span></a></div>
            <div className="neo-scroll-cue"><span>{t.heroScroll}</span><i><b /></i></div>
            <div className="neo-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(heroStage + 1) / 3})` }} /></div>
          </div>
        </div>
      </section>

      <div className="neo-marquee" aria-hidden="true"><div>{[...t.marquee, ...t.marquee].map((item, index) => <span key={`${item}-${index}`}>{item}<i>✦</i></span>)}</div></div>

      <section className="neo-course neo-shell" id="course">
        <div className="neo-course-side"><span className="neo-section-number">01</span><p>{t.courseKicker}</p></div>
        <div className="neo-course-main"><h2>{t.courseTitle}</h2><p>{t.courseText}</p><div className="neo-course-facts">{t.courseFacts.map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><a href="/coding-vibe-coding" className="neo-button outline">{t.courseCta}<Arrow /></a></div>
      </section>

      <section className="neo-work" id="work">
        <div className="neo-shell neo-section-head"><div><p className="neo-kicker">{t.workKicker}</p><h2>{t.workTitle}</h2></div><p>{t.workText}</p></div>
        <div className="neo-film-grid">
          {["01","02","03"].map((id,index) => (
            <article className="neo-film" key={id}>
              <video ref={video => {videoRefs.current[index]=video}} controls loop playsInline preload="metadata" poster={`/videos/video-${id}.jpg`} onPlay={event => videoRefs.current.forEach(video => {if(video && video!==event.currentTarget) video.pause()})}><source src={`/videos/video-${id}.mp4`} type="video/mp4"/></video>
              <div className="neo-film-meta"><span>FILM / 0{index+1}</span><small>{t.playHint}</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="neo-services neo-shell" id="services">
        <div className="neo-section-head"><div><p className="neo-kicker">{t.capabilitiesKicker}</p><h2>{t.capabilitiesTitle}</h2></div></div>
        <div className="neo-service-grid">
          {t.cards.map(([number,title,text,label,href],index) => <a href={href} className={`neo-service-card card-${index+1}`} key={title}><div><span>{number}</span><Arrow /></div><h3>{title}</h3><p>{text}</p><strong>{label}</strong>{index>0 && <img src={index===1?"/images/slide-video-ad.png":"/images/slide-ai-app-studio.webp"} alt=""/>}</a>)}
        </div>
      </section>

      <section className="neo-news" id="news">
        <div className="neo-shell">
          <div className="neo-news-intro"><p className="neo-kicker">{t.newsKicker}</p><h2>{t.newsTitle}</h2><p>{t.newsText}</p></div>
          <div className="neo-news-list">
            {newsLinks.map((link,index) => <a href={link} target="_blank" rel="noreferrer" key={link}><span className="neo-news-index">0{index+1}</span><div className="neo-news-thumb"><img src={newsImages[index]} alt=""/></div><div><small>{t.newsTags[index]}</small><h3>{t.newsTitles[index]}</h3></div><Arrow /></a>)}
          </div>
        </div>
      </section>

      <section className="neo-about neo-shell">
        <div className="neo-about-image"><img src="/images/hamed-sami-zadeh.jpg" alt={lang==="fa"?"حامد سمیع‌زاده":"Hamed Sami Zadeh"}/><span>HAMED / SAMIZ</span></div>
        <div className="neo-about-copy"><p className="neo-kicker">{t.founderKicker}</p><h2>{t.founderTitle}</h2><p>{t.founderText}</p></div>
        <a className="neo-python-card" href="/python"><small>{t.pythonLabel}</small><h3>{t.pythonTitle}</h3><p>{t.pythonText}</p><strong>{t.pythonCta}<Arrow /></strong><code>&gt;_</code></a>
      </section>

      <section className="neo-final" id="contact">
        <div className="neo-shell"><p className="neo-kicker">{t.finalKicker}</p><h2>{t.finalTitle}</h2><p>{t.finalText}</p><div className="neo-social-actions"><a href="https://wa.me/18259250075" target="_blank" rel="noreferrer"><WhatsAppIcon/><span>{t.whatsapp}</span><Arrow /></a><a href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer"><InstagramIcon/><span>{t.instagram}</span><Arrow /></a></div></div>
      </section>

      <footer className="neo-footer">
        <div className="neo-shell"><a href="#top" className="neo-logo"><Brand /></a><p>{t.footerLine}</p><div className="neo-footer-socials"><a href="https://wa.me/18259250075" target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon/></a><a href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon/></a></div><a href="#top" className="neo-top">{t.top} ↑</a></div>
      </footer>
    </main>
  );
}
