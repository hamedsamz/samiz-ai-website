"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Lang = "fa" | "en";
type CategoryId = "all" | "prompt" | "content" | "video" | "apps";

const copy = {
  fa: {
    nav: ["دوره‌ها", "مسیر یادگیری", "نمونه‌کارها", "درباره سمیز"],
    login: "ورود",
    signup: "ساخت حساب",
    authSoon: "سیستم ورود و ساخت حساب به‌زودی فعال می‌شود.",
    authHint: "فعلاً می‌توانی دوره‌ها و نمونه‌کارها را ببینی؛ در مرحله بعدی ثبت‌نام کاربران را باهم طراحی می‌کنیم.",
    heroBadge: "SAMIZ ACADEMY · آموزش کاربردی هوش مصنوعی",
    heroTitle: "هوش مصنوعی را یاد بگیر؛ ",
    heroAccent: "واقعی بساز و اثرگذار باش.",
    heroText: "یک مسیر آموزشی فارسی و پروژه‌محور برای کسانی که می‌خواهند هوش مصنوعی را از یک ابزار پیچیده، به مهارتی کاربردی برای کار و درآمد تبدیل کنند.",
    explore: "مشاهده دوره‌ها",
    portfolioCta: "دیدن نمونه‌کارها",
    searchPlaceholder: "دوست داری چه چیزی یاد بگیری؟",
    searchButton: "جست‌وجو",
    principles: ["آموزش فارسی", "پروژه‌محور", "از شروع تا اجرا"],
    featuredLabel: "دوره‌های داغ آکادمی",
    featuredSummary: "خلاصه دوره",
    previousSlide: "دوره قبلی",
    nextSlide: "دوره بعدی",
    categoriesKicker: "موضوعات آموزشی",
    categoriesTitle: "از کجا می‌خواهی شروع کنی؟",
    categoriesLead: "مسیر مناسب خودت را انتخاب کن؛ از مبانی پرامپت‌نویسی تا تولید محتوا، ویدیو و ساخت محصولات هوشمند.",
    categories: [
      ["prompt", "مهندسی پرامپت", "گفت‌وگوی درست با مدل‌های هوش مصنوعی", "⌘"],
      ["content", "تولید محتوا با AI", "ایده، سناریو و محتوای حرفه‌ای", "✦"],
      ["video", "ویدیوهای تبلیغاتی", "از کانسپت تا ویدیوی قابل انتشار", "▶"],
      ["apps", "اپ و اتوماسیون", "ساخت ابزارهای کاربردی بدون پیچیدگی", "◇"],
    ],
    coursesKicker: "دوره‌های آکادمی",
    coursesTitle: "یادگیری برای نتیجه واقعی",
    coursesLead: "دوره‌ها کوتاه، روشن و پروژه‌محور طراحی می‌شوند؛ یعنی فقط ابزار نمی‌شناسی، بلکه با آن چیزی می‌سازی.",
    all: "همه دوره‌ها",
    noResults: "دوره‌ای با این جست‌وجو پیدا نشد.",
    current: "ظرفیت تکمیل",
    soon: "به‌زودی",
    details: "مشاهده جزئیات دوره",
    notify: "اطلاع از زمان انتشار",
    courses: [
      {
        id: "prompt",
        category: "مهندسی پرامپت",
        title: "ورود به دنیای هوش مصنوعی با یادگیری مهندسی پرامپت",
        description: "از اصول پرامپت‌نویسی و تولید محتوا تا کاربرد پرامپت در ساخت ویدیوهای تبلیغاتی.",
        instructor: "حامد سمیع‌زاده، دکتر ابوطالب مرادی و میج بهرامی",
        meta: "ضبط‌شده · همراه با پشتیبانی",
        status: "active",
        href: "/register-2",
        image: "/images/courses/prompt-engineering.webp",
      },
      {
        id: "content",
        category: "تولید محتوا",
        title: "سیستم تولید محتوای حرفه‌ای با هوش مصنوعی",
        description: "ساخت یک جریان منظم برای ایده‌پردازی، سناریونویسی و تولید محتوای شبکه‌های اجتماعی.",
        instructor: "SAMIZ ACADEMY",
        meta: "پروژه‌محور · فارسی",
        status: "soon",
        href: "#contact",
        image: "/images/courses/ai-content.webp",
      },
      {
        id: "video",
        category: "ویدیوی هوش مصنوعی",
        title: "ساخت ویدیوهای تبلیغاتی با AI",
        description: "تبدیل ایده و پرامپت به یک ویدیوی تبلیغاتی حرفه‌ای، از تصویر تا خروجی نهایی.",
        instructor: "SAMIZ ACADEMY",
        meta: "کاربردی · پروژه نهایی",
        status: "soon",
        href: "#contact",
        image: "/images/courses/ai-video.webp",
      },
      {
        id: "apps",
        category: "اپ و اتوماسیون",
        title: "از ایده تا ساخت اپ هوشمند",
        description: "یاد بگیر چطور ایده‌ات را با کمک هوش مصنوعی به یک ابزار آنلاین کاربردی تبدیل کنی.",
        instructor: "SAMIZ ACADEMY",
        meta: "مناسب شروع · بدون پیچیدگی",
        status: "soon",
        href: "#contact",
        image: "/images/courses/ai-apps.webp",
      },
    ],
    pathKicker: "نقشه راه سمیز",
    pathTitle: "یک مسیر روشن؛ از یادگیری تا ساختن",
    pathLead: "لازم نیست همه ابزارها را هم‌زمان یاد بگیری. قدم‌به‌قدم جلو می‌رویم تا مهارتت به یک خروجی واقعی تبدیل شود.",
    paths: [
      ["01", "پایه را درست بساز", "درک درست هوش مصنوعی، پرامپت‌نویسی و انتخاب ابزار مناسب."],
      ["02", "با پروژه تمرین کن", "هر آموزش با تمرینی همراه است که به نیاز واقعی تو نزدیک باشد."],
      ["03", "مهارتت را ارائه کن", "ساخت نمونه‌کار، اجرای پروژه و پیدا کردن کاربرد مناسب برای درآمدزایی."],
    ],
    studioKicker: "SAMIZ STUDIO · نمونه‌کارها",
    studioTitle: "چیزی که آموزش می‌دهیم، خودمان هم می‌سازیم.",
    studioLead: "بخش ویدیوهای تبلیغاتی Samiz AI همچنان فعال است. اینجا نمونه‌هایی از خروجی‌های ویدیویی ساخته‌شده با هوش مصنوعی را می‌بینی.",
    sample: "نمونه ویدیوی تبلیغاتی",
    studioContact: "سفارش ویدیوی تبلیغاتی",
    aboutKicker: "درباره آکادمی",
    aboutTitle: "آموزش ساده، کاربردی و به‌روز برای فارسی‌زبان‌ها.",
    aboutText: "من حامد سمیع‌زاده‌ام. در Samiz Academy کمک می‌کنم هوش مصنوعی را نه با اصطلاحات پیچیده، بلکه با تمرین، پروژه و تجربه واقعی یاد بگیری. هدف این است که بعد از آموزش بتوانی چیزی بسازی که به کارت، محتوایت یا کسب‌وکارت کمک کند.",
    quote: "هوش مصنوعی قرار نیست جای شما را بگیرد؛ اما کسی که بلد است از آن استفاده کند، احتمالاً این کار را می‌کند.",
    founder: "حامد سمیع‌زاده",
    founderRole: "بنیان‌گذار SAMIZ AI",
    ctaTitle: "برای شروع مسیرت آماده‌ای؟",
    ctaText: "اولین دوره فعال آکادمی را ببین یا برای همکاری و پروژه‌های آموزشی با سمیز در ارتباط باش.",
    ctaCourse: "مشاهده دوره فعال",
    ctaContact: "ارتباط با سمیز",
    footerText: "آکادمی و استودیوی خلاقیت هوش مصنوعی در آلبرتا، کانادا.",
  },
  en: {
    nav: ["Courses", "Learning Path", "Portfolio", "About Samiz"],
    login: "Log in",
    signup: "Sign up",
    authSoon: "Login and account creation are coming soon.",
    authHint: "For now, explore the courses and portfolio. We will design the full member experience next.",
    heroBadge: "SAMIZ ACADEMY · PRACTICAL AI EDUCATION",
    heroTitle: "Learn AI, ",
    heroAccent: "build for the real world.",
    heroText: "A practical, project-based learning path for people who want to turn artificial intelligence from a complex tool into a useful skill for work and business.",
    explore: "Explore Courses",
    portfolioCta: "View Portfolio",
    searchPlaceholder: "What would you like to learn?",
    searchButton: "Search",
    principles: ["Clear education", "Project based", "From idea to launch"],
    featuredLabel: "HOT ACADEMY COURSES",
    featuredSummary: "Course summary",
    previousSlide: "Previous course",
    nextSlide: "Next course",
    categoriesKicker: "LEARNING TOPICS",
    categoriesTitle: "Where do you want to begin?",
    categoriesLead: "Choose the path that fits you — from prompting foundations to content, video, and intelligent products.",
    categories: [
      ["prompt", "Prompt Engineering", "Communicate clearly with AI models", "⌘"],
      ["content", "AI Content", "Ideas, scripts, and professional content", "✦"],
      ["video", "Advertising Video", "From concept to publish-ready video", "▶"],
      ["apps", "Apps & Automation", "Build useful tools without the complexity", "◇"],
    ],
    coursesKicker: "ACADEMY COURSES",
    coursesTitle: "Learn for a real outcome",
    coursesLead: "Courses are clear and project-based. You do not just discover tools — you use them to build something useful.",
    all: "All courses",
    noResults: "No courses matched your search.",
    current: "Enrollment closed",
    soon: "Coming soon",
    details: "View course details",
    notify: "Get release updates",
    courses: [
      {
        id: "prompt",
        category: "Prompt Engineering",
        title: "Start with AI through Prompt Engineering",
        description: "From prompting principles and content creation to using prompts in AI advertising video production.",
        instructor: "Hamed Sami Zadeh, Dr. Abutaleb Moradi & Mage Bahrami",
        meta: "Recorded · Support included",
        status: "active",
        href: "/register-2",
        image: "/images/courses/prompt-engineering.webp",
      },
      {
        id: "content",
        category: "AI Content",
        title: "A professional AI content system",
        description: "Create a repeatable workflow for ideation, scripting, and social media content production.",
        instructor: "SAMIZ ACADEMY",
        meta: "Project based · Persian",
        status: "soon",
        href: "#contact",
        image: "/images/courses/ai-content.webp",
      },
      {
        id: "video",
        category: "AI Video",
        title: "Create advertising videos with AI",
        description: "Turn an idea and a prompt into a polished advertising video, from visuals to final delivery.",
        instructor: "SAMIZ ACADEMY",
        meta: "Practical · Final project",
        status: "soon",
        href: "#contact",
        image: "/images/courses/ai-video.webp",
      },
      {
        id: "apps",
        category: "Apps & Automation",
        title: "From idea to an intelligent app",
        description: "Learn how to turn an idea into a useful online tool with the help of artificial intelligence.",
        instructor: "SAMIZ ACADEMY",
        meta: "Beginner friendly · Practical",
        status: "soon",
        href: "#contact",
        image: "/images/courses/ai-apps.webp",
      },
    ],
    pathKicker: "THE SAMIZ ROADMAP",
    pathTitle: "A clear path from learning to building",
    pathLead: "You do not need to learn every tool at once. We move step by step until your knowledge becomes a real output.",
    paths: [
      ["01", "Build the foundation", "Understand AI, prompting, and how to choose the right tool."],
      ["02", "Practice through projects", "Every lesson leads to an exercise connected to a real need."],
      ["03", "Put your skill to work", "Build a portfolio, deliver projects, and discover a practical path to income."],
    ],
    studioKicker: "SAMIZ STUDIO · PORTFOLIO",
    studioTitle: "We build with the same skills we teach.",
    studioLead: "Samiz AI's advertising video service remains active. Here are selected AI-generated video samples from the studio.",
    sample: "Advertising video sample",
    studioContact: "Order an advertising video",
    aboutKicker: "ABOUT THE ACADEMY",
    aboutTitle: "Clear, practical AI education for Persian speakers.",
    aboutText: "I’m Hamed Sami Zadeh. At Samiz Academy, I make AI approachable through practice, projects, and real experience. The goal is simple: after learning, you should be able to build something that helps your work, content, or business.",
    quote: "AI is not going to replace you. But someone who knows how to use it probably will.",
    founder: "Hamed Sami Zadeh",
    founderRole: "Founder of SAMIZ AI",
    ctaTitle: "Ready to start your path?",
    ctaText: "Explore the academy's available course or connect with Samiz for educational and creative collaborations.",
    ctaCourse: "View available course",
    ctaContact: "Connect with Samiz",
    footerText: "AI academy and creative studio based in Alberta, Canada.",
  },
};

function Mark() {
  return <span className="mark" aria-hidden="true"><i>S</i><b>AI</b></span>;
}

function Arrow({ rtl }: { rtl: boolean }) {
  return <span aria-hidden="true">{rtl ? "←" : "→"}</span>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="icon-dot" cx="17.4" cy="6.7" r="1" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.6Z" /><path d="M8.2 7.6c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4-.1.7.5 1 1.3 1.8 2.3 2.3.3.2.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .3-.2 1.4-1 2-.7.6-1.6.8-2.6.5-1.4-.4-2.8-1.1-4.1-2.3-1.1-1-2.1-2.4-2.5-3.8-.4-1.2 0-2.4.6-3Z" /></svg>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("fa");
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [authNotice, setAuthNotice] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const t = copy[lang];
  const isRtl = lang === "fa";

  useEffect(() => {
    const saved = localStorage.getItem("samiz-lang");
    if (saved !== "fa" && saved !== "en") return;
    const frame = requestAnimationFrame(() => setLang(saved));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % 3);
    }, 6500);
    return () => window.clearInterval(interval);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    localStorage.setItem("samiz-lang", next);
  };

  const normalizedQuery = query.trim().toLocaleLowerCase(lang === "fa" ? "fa" : "en");
  const featuredCourses = t.courses.slice(0, 3);
  const filteredCourses = t.courses.filter((course) => {
    const categoryMatch = category === "all" || course.id === category;
    const textMatch = !normalizedQuery || `${course.title} ${course.category} ${course.description}`.toLocaleLowerCase(lang === "fa" ? "fa" : "en").includes(normalizedQuery);
    return categoryMatch && textMatch;
  });

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.querySelector("#courses")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className={`academy-site ${isRtl ? "fa" : "en"}`} dir={isRtl ? "rtl" : "ltr"} lang={lang}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Samiz Academy home">
          <Mark />
          <span><strong>SAMIZ</strong><small>ACADEMY <i>by</i> SAMIZ AI</small></span>
        </a>
        <nav className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Main navigation">
          {t.nav.map((item, index) => (
            <a key={item} href={["#courses", "#learning-path", "#portfolio", "#about"][index]} onClick={() => setMenuOpen(false)}>{item}</a>
          ))}
          <div className="mobile-auth-actions">
            <button type="button" onClick={() => { setAuthNotice(true); setMenuOpen(false); }}>{t.login}</button>
            <button type="button" onClick={() => { setAuthNotice(true); setMenuOpen(false); }}>{t.signup}</button>
          </div>
        </nav>
        <div className="header-tools">
          <div className="language-switch" aria-label="Language selector">
            <button className={lang === "fa" ? "active" : ""} onClick={() => changeLang("fa")}>فا</button>
            <span>/</span>
            <button className={lang === "en" ? "active" : ""} onClick={() => changeLang("en")}>EN</button>
          </div>
          <div className="auth-actions">
            <button className="login-button" type="button" onClick={() => setAuthNotice(true)}>{t.login}</button>
            <button className="signup-button" type="button" onClick={() => setAuthNotice(true)}>{t.signup}</button>
          </div>
          <button className="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><span></span><span></span></button>
        </div>
      </header>

      <section className="academy-hero" id="top">
        <div className="hero-main">
          <p className="eyebrow">{t.heroBadge}</p>
          <h1>{t.heroTitle}<em>{t.heroAccent}</em></h1>
          <p className="hero-lead">{t.heroText}</p>
          <div className="hero-actions">
            <a className="gold-button" href="#courses">{t.explore}<Arrow rtl={isRtl} /></a>
            <a className="soft-button" href="#portfolio">{t.portfolioCta}</a>
          </div>
          <ul className="principle-list">
            {t.principles.map(item => <li key={item}><span>✓</span>{item}</li>)}
          </ul>
        </div>

        <div className="hero-visual">
          <div className="featured-slider" aria-roledescription="carousel" aria-label={t.featuredLabel}>
            <div className="featured-topline"><span>{t.featuredLabel}</span><b>0{activeSlide + 1} / 03</b></div>
            <div className="featured-slides" aria-live="polite">
              {featuredCourses.map((course, index) => (
                <article className={index === activeSlide ? "featured-course active" : "featured-course"} key={course.id} aria-hidden={index !== activeSlide}>
                  <div className="featured-image">
                    <Image src={course.image} alt="" fill priority={index === 0} sizes="(max-width: 820px) 92vw, 560px" />
                    <span className={course.status === "active" ? "featured-status active" : "featured-status"}>{course.status === "active" ? t.current : t.soon}</span>
                  </div>
                  <div className="featured-copy">
                    <small>{course.category} · {t.featuredSummary}</small>
                    <h2>{course.title}</h2>
                    <p>{course.description}</p>
                    <a href={course.href}>{course.status === "active" ? t.details : t.notify}<Arrow rtl={isRtl} /></a>
                  </div>
                </article>
              ))}
            </div>
            <div className="slider-controls">
              <div className="slider-dots">
                {featuredCourses.map((course, index) => <button key={course.id} type="button" className={index === activeSlide ? "active" : ""} aria-label={`${t.featuredLabel} ${index + 1}`} aria-current={index === activeSlide ? "true" : undefined} onClick={() => setActiveSlide(index)} />)}
              </div>
              <div className="slider-arrows">
                <button type="button" aria-label={t.previousSlide} onClick={() => setActiveSlide((activeSlide + 2) % 3)}>‹</button>
                <button type="button" aria-label={t.nextSlide} onClick={() => setActiveSlide((activeSlide + 1) % 3)}>›</button>
              </div>
            </div>
          </div>
        </div>

        <form className="course-search" onSubmit={submitSearch} role="search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
          <button type="submit">{t.searchButton}</button>
        </form>
      </section>

      <section className="academy-section category-section" aria-labelledby="category-heading">
        <div className="section-heading">
          <div><p className="eyebrow">{t.categoriesKicker}</p><h2 id="category-heading">{t.categoriesTitle}</h2></div>
          <p>{t.categoriesLead}</p>
        </div>
        <div className="category-grid">
          {t.categories.map(([id, title, description, icon]) => (
            <button key={id} className={category === id ? "category-card active" : "category-card"} type="button" onClick={() => { setCategory(id as CategoryId); document.querySelector("#courses")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span className="category-icon">{icon}</span>
              <span><strong>{title}</strong><small>{description}</small></span>
              <i><Arrow rtl={isRtl} /></i>
            </button>
          ))}
        </div>
      </section>

      <section className="academy-section course-catalog" id="courses" aria-labelledby="courses-heading">
        <div className="section-heading">
          <div><p className="eyebrow">{t.coursesKicker}</p><h2 id="courses-heading">{t.coursesTitle}</h2></div>
          <p>{t.coursesLead}</p>
        </div>
        <div className="course-filters" role="group" aria-label={t.coursesKicker}>
          <button className={category === "all" ? "active" : ""} type="button" onClick={() => setCategory("all")}>{t.all}</button>
          {t.categories.map(([id, title]) => <button className={category === id ? "active" : ""} key={id} type="button" onClick={() => setCategory(id as CategoryId)}>{title}</button>)}
        </div>
        {filteredCourses.length ? <div className="course-grid">
          {filteredCourses.map((course, index) => (
            <article className={`course-card course-${course.id}`} key={course.id}>
              <div className="course-cover">
                <Image src={course.image} alt="" fill sizes="(max-width: 820px) 82vw, (max-width: 1180px) 50vw, 25vw" />
                <span className={course.status === "active" ? "course-status active" : "course-status"}>{course.status === "active" ? t.current : t.soon}</span>
                <span className="course-index">0{index + 1}</span>
                <small>{course.category}</small>
              </div>
              <div className="course-body">
                <small className="course-category">{course.category}</small>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-instructor"><span>{course.instructor.slice(0, 1)}</span><div><small>{course.instructor}</small><b>{course.meta}</b></div></div>
                <a className={course.status === "active" ? "course-link active" : "course-link"} href={course.href}>{course.status === "active" ? t.details : t.notify}<Arrow rtl={isRtl} /></a>
              </div>
            </article>
          ))}
        </div> : <p className="empty-state">{t.noResults}</p>}
      </section>

      <section className="learning-path" id="learning-path">
        <div className="path-intro">
          <p className="eyebrow">{t.pathKicker}</p>
          <h2>{t.pathTitle}</h2>
          <p>{t.pathLead}</p>
        </div>
        <div className="path-steps">
          {t.paths.map(([number, title, text], index) => (
            <article key={number}><div><span>{number}</span>{index < t.paths.length - 1 ? <i></i> : null}</div><section><h3>{title}</h3><p>{text}</p></section></article>
          ))}
        </div>
      </section>

      <section className="studio-section" id="portfolio">
        <div className="studio-heading">
          <div><p className="eyebrow">{t.studioKicker}</p><h2>{t.studioTitle}</h2></div>
          <div><p>{t.studioLead}</p><a href="https://wa.me/18259250075" target="_blank" rel="noreferrer">{t.studioContact}<Arrow rtl={isRtl} /></a></div>
        </div>
        <div className="studio-grid">
          {["01", "02", "03"].map((id, index) => (
            <article className="video-project" key={id}>
              <div className="video-frame">
                <video
                  ref={video => { videoRefs.current[index] = video; }}
                  controls
                  loop
                  playsInline
                  preload="metadata"
                  poster={`/videos/video-${id}.jpg`}
                  aria-label={`${t.sample} ${index + 1}`}
                  onPlay={event => videoRefs.current.forEach(video => { if (video && video !== event.currentTarget) video.pause(); })}
                >
                  <source src={`/videos/video-${id}.mp4`} type="video/mp4" />
                </video>
              </div>
              <div><span>{t.sample}</span><b>0{index + 1}</b></div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-photo"><Image src="/images/hamed-sami-zadeh.jpg" alt={t.founder} fill sizes="(max-width: 820px) 100vw, 520px" /><span>SAMIZ<br />ACADEMY</span></div>
        <div className="about-copy">
          <p className="eyebrow">{t.aboutKicker}</p>
          <h2>{t.aboutTitle}</h2>
          <p>{t.aboutText}</p>
          <blockquote>“{t.quote}”</blockquote>
          <div><strong>{t.founder}</strong><small>{t.founderRole}</small></div>
        </div>
      </section>

      <section className="final-cta" id="contact">
        <div><p className="eyebrow">SAMIZ ACADEMY</p><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p></div>
        <div className="final-actions"><a className="gold-button" href="/register-2">{t.ctaCourse}<Arrow rtl={isRtl} /></a><a className="soft-button" href="https://wa.me/18259250075" target="_blank" rel="noreferrer">{t.ctaContact}</a></div>
      </section>

      <footer className="site-footer">
        <a className="brand" href="#top"><Mark /><span><strong>SAMIZ</strong><small>ACADEMY <i>by</i> SAMIZ AI</small></span></a>
        <p>{t.footerText}</p>
        <div className="footer-socials">
          <a href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon /></a>
          <a href="https://wa.me/18259250075" target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon /></a>
        </div>
      </footer>

      {authNotice ? (
        <div className="auth-notice" role="dialog" aria-modal="true" aria-labelledby="auth-notice-title" onClick={() => setAuthNotice(false)}>
          <div onClick={(event) => event.stopPropagation()}>
            <button className="auth-close" type="button" aria-label="Close" onClick={() => setAuthNotice(false)}>×</button>
            <Mark />
            <h2 id="auth-notice-title">{t.authSoon}</h2>
            <p>{t.authHint}</p>
            <button className="gold-button" type="button" onClick={() => setAuthNotice(false)}>{isRtl ? "متوجه شدم" : "Got it"}</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
