"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "fa" | "en";

const content = {
  fa: {
    nav: ["خانه", "دوره‌ها", "ویدیوهای تبلیغاتی", "اخبار AI", "آزمایشگاه پایتون"],
    contact: "شروع همکاری",
    heroKicker: "آکادمی و استودیوی خلاق هوش مصنوعی",
    heroTitle: "هوش مصنوعی، از ابزار به مزیت واقعی.",
    heroText: "آموزش کاربردی هوش مصنوعی، تولید ویدیوهای تبلیغاتی با AI و مهم‌ترین اخبار این حوزه؛ برای کسانی که می‌خواهند جلوتر حرکت کنند.",
    explore: "ببینید سمیز چه کاری انجام می‌دهد",
    pillars: [["آموزش", "دوره‌های پروژه‌محور"], ["تولید", "ویدیو و اپلیکیشن AI"], ["تحلیل", "اخبار مهم و کاربردی"]],
    courseKicker: "SAMIZ ACADEMY / دوره ویژه",
    courseTitle: "مهندسی پرامپت را برای نتیجه واقعی یاد بگیرید.",
    courseText: "از اصول گفت‌وگو با مدل‌های هوش مصنوعی تا تولید محتوای حرفه‌ای و ساخت ویدیوهای تبلیغاتی؛ یک مسیر عملی برای ورود جدی به دنیای AI.",
    courseMeta: ["کلاس زنده", "آموزش پروژه‌محور", "مناسب شروع حرفه‌ای"],
    courseCta: "مشاهده و ثبت‌نام دوره",
    videoKicker: "SAMIZ CREATIVE / خدمات تولید",
    videoTitle: "تبلیغاتی که در میان اسکرول متوقف‌تان می‌کند.",
    videoText: "ایده، کارگردانی خلاق و تولید با هوش مصنوعی را ترکیب می‌کنیم تا برندها بدون فرایند سنگین تولید سنتی، حرفه‌ای دیده شوند.",
    videoCta: "مشاهده نمونه ویدیوها",
    appKicker: "AI APP STUDIO / طراحی محصول",
    appTitle: "ایده شما، به یک ابزار هوشمند واقعی تبدیل می‌شود.",
    appText: "از تعریف مسئله تا طراحی و ساخت؛ اپلیکیشن‌های مجهز به هوش مصنوعی برای نیاز واقعی شما و کسب‌وکارتان.",
    appCta: "درباره ساخت اپ گفتگو کنیم",
    portfolioKicker: "نمونه‌کارهای منتخب",
    portfolioTitle: "ویدیوهای تبلیغاتی ساخته‌شده با هوش مصنوعی",
    portfolioText: "برای پخش هر نمونه کلیک کنید. هر پروژه با هدف، ریتم و هویت بصری مخصوص همان برند ساخته می‌شود.",
    newsKicker: "SAMIZ INTELLIGENCE / تازه‌های AI",
    newsTitle: "خبر کمتر. درک بیشتر.",
    newsText: "مهم‌ترین تغییرات هوش مصنوعی را انتخاب و ساده می‌کنیم تا بدانید چه اتفاقی افتاده و چرا برای شما مهم است.",
    newsCta: "مشاهده تازه‌ترین خبرها",
    newsLabels: ["سرمایه‌گذاری AI", "محصول", "مدل‌ها"],
    newsTitles: ["مدیریت سرمایه‌گذاری در عصر عامل‌های هوش مصنوعی", "GPT-5.6 مدل منتخب Microsoft 365 Copilot شد", "معرفی GPT-5.6؛ هوش مرزی با بهره‌وری بیشتر"],
    founderKicker: "درباره بنیان‌گذار",
    founderTitle: "فناوری پیچیده، با زبان روشن و کاربرد واقعی.",
    founderText: "من حامد سمیع‌زاده‌ام. در سمیز کمک می‌کنم هوش مصنوعی را نه به‌عنوان یک موج زودگذر، بلکه به‌عنوان یک مهارت عملی برای ساختن، یادگرفتن و رشد کسب‌وکار به کار بگیرید.",
    founderQuote: "هوش مصنوعی جای شما را نمی‌گیرد؛ کسی که استفاده از آن را بلد است، احتمالاً این کار را می‌کند.",
    pythonKicker: "ابزار رایگان",
    pythonTitle: "کد پایتون را همین‌جا بنویسید و اجرا کنید.",
    pythonText: "یک محیط ساده و فارسی برای تمرین برنامه‌نویسی، اجرای نمونه‌ها و یادگیری قدم‌به‌قدم.",
    pythonCta: "ورود به آزمایشگاه پایتون",
    finalTitle: "برای یادگیری، ساختن یا همکاری آماده‌اید؟",
    finalText: "دوره مناسب خود را پیدا کنید یا درباره پروژه تبلیغاتی و اپلیکیشن هوشمندتان با ما صحبت کنید.",
    finalPrimary: "مشاهده دوره‌ها",
    finalSecondary: "تماس با سمیز",
    footer: "آکادمی و استودیوی خلاق هوش مصنوعی — آلبرتا، کانادا",
    backTop: "بازگشت به بالا",
  },
  en: {
    nav: ["Home", "Courses", "AI Video", "AI News", "Python Lab"],
    contact: "Start a project",
    heroKicker: "AI ACADEMY & CREATIVE STUDIO",
    heroTitle: "Turn artificial intelligence into a real advantage.",
    heroText: "Practical AI education, high-impact AI video production, and the news that matters — for people ready to move ahead.",
    explore: "Discover what Samiz does",
    pillars: [["LEARN", "Project-based courses"], ["CREATE", "AI video and applications"], ["UNDERSTAND", "Useful AI intelligence"]],
    courseKicker: "SAMIZ ACADEMY / FEATURED COURSE",
    courseTitle: "Learn prompt engineering for real-world results.",
    courseText: "From communicating clearly with AI models to professional content and advertising video production — a practical path into the world of AI.",
    courseMeta: ["Live cohort", "Project-based", "Built for serious beginners"],
    courseCta: "View course and register",
    videoKicker: "SAMIZ CREATIVE / PRODUCTION",
    videoTitle: "Advertising made to stop the scroll.",
    videoText: "We combine concept, creative direction, and AI production so brands can look exceptional without the weight of a traditional shoot.",
    videoCta: "Watch selected work",
    appKicker: "AI APP STUDIO / PRODUCT DESIGN",
    appTitle: "Your idea, transformed into a useful intelligent product.",
    appText: "From problem definition to design and delivery, we build AI-powered applications around real business needs.",
    appCta: "Discuss your app idea",
    portfolioKicker: "SELECTED WORK",
    portfolioTitle: "Advertising videos created with AI",
    portfolioText: "Select a film to play. Every project is shaped around the brand's own objective, rhythm, and visual language.",
    newsKicker: "SAMIZ INTELLIGENCE / AI UPDATES",
    newsTitle: "Less noise. More understanding.",
    newsText: "We select and simplify the most important AI developments, so you know what changed and why it matters.",
    newsCta: "Read the latest updates",
    newsLabels: ["AI INVESTMENT", "PRODUCT", "MODELS"],
    newsTitles: ["Managing AI investments in the agentic era", "GPT-5.6 becomes the preferred model in Microsoft 365 Copilot", "Introducing GPT-5.6: frontier intelligence at scale"],
    founderKicker: "MEET THE FOUNDER",
    founderTitle: "Complex technology, explained clearly and used practically.",
    founderText: "I'm Hamed Sami Zadeh. At Samiz, I help people use AI not as a passing trend, but as a practical skill for creating, learning, and growing a business.",
    founderQuote: "AI will not replace you. Someone who knows how to use it probably will.",
    pythonKicker: "FREE TOOL",
    pythonTitle: "Write and run Python code right here.",
    pythonText: "A simple learning environment for practicing code, running examples, and improving one step at a time.",
    pythonCta: "Open Python Lab",
    finalTitle: "Ready to learn, create, or collaborate?",
    finalText: "Find the right course or tell us about your next advertising or intelligent application project.",
    finalPrimary: "Explore courses",
    finalSecondary: "Contact Samiz",
    footer: "AI academy and creative studio — Alberta, Canada",
    backTop: "Back to top",
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

function BrandMark() {
  return <span className="home-mark" aria-hidden="true"><span>S</span><b>AI</b></span>;
}

function Arrow() {
  return <span className="home-arrow" aria-hidden="true">↗</span>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("fa");
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const t = content[lang];

  useEffect(() => {
    const saved = localStorage.getItem("samiz-lang");
    if (saved === "fa" || saved === "en") setLang(saved);
  }, []);

  const changeLanguage = (next: Lang) => {
    setLang(next);
    localStorage.setItem("samiz-lang", next);
    setMenuOpen(false);
  };

  const links = ["#top", "#courses", "#video", "#news", "/python"];

  return (
    <main id="top" className={`home ${lang === "fa" ? "home-fa" : "home-en"}`} lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>
      <header className="home-header">
        <a className="home-logo" href="#top" aria-label="Samiz AI home"><BrandMark /><span>SAMIZ AI</span></a>
        <nav className={`home-nav ${menuOpen ? "is-open" : ""}`} aria-label={lang === "fa" ? "منوی اصلی" : "Main navigation"}>
          {t.nav.map((item, index) => <a key={item} href={links[index]} onClick={() => setMenuOpen(false)}>{item}</a>)}
        </nav>
        <div className="home-header-actions">
          <div className="home-language" aria-label={lang === "fa" ? "انتخاب زبان" : "Language selector"}>
            <button className={lang === "fa" ? "active" : ""} onClick={() => changeLanguage("fa")}>فا</button><span>/</span>
            <button className={lang === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
          </div>
          <a className="home-header-cta" href="#contact">{t.contact}</a>
          <button className={`home-menu ${menuOpen ? "is-open" : ""}`} type="button" aria-label={lang === "fa" ? "باز کردن منو" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-media" aria-hidden="true"><img src="/images/hero-laptop-clean.webp" alt="" /></div>
        <div className="home-hero-brain" aria-hidden="true">
          <span className="home-hero-brain-glow" />
          <img src="/images/ai-brain-header.webp" alt="" />
        </div>
        <div className="home-shade" />
        <div className="home-hero-content home-shell">
          <p className="home-kicker">{t.heroKicker}</p><h1>{t.heroTitle}</h1><p className="home-lead">{t.heroText}</p>
          <a className="home-button home-button-light" href="#overview"><span>{t.explore}</span><Arrow /></a>
        </div>
        <div className="home-scroll" aria-hidden="true"><span />SCROLL</div>
      </section>

      <section className="home-overview" id="overview">
        <div className="home-shell home-pillars">
          {t.pillars.map(([label, value], index) => <article key={label}><span>0{index + 1}</span><small>{label}</small><strong>{value}</strong></article>)}
        </div>
      </section>

      <section className="home-panel home-course" id="courses">
        <div className="home-course-art" aria-hidden="true"><div className="home-orbit orbit-one" /><div className="home-orbit orbit-two" /><div className="home-prompt-window"><span>PROMPT / 01</span><i /><i /><i /><b>AI</b></div></div>
        <div className="home-panel-shade" />
        <div className="home-panel-content home-shell">
          <p className="home-kicker">{t.courseKicker}</p><h2>{t.courseTitle}</h2><p>{t.courseText}</p>
          <div className="home-meta">{t.courseMeta.map(item => <span key={item}>{item}</span>)}</div>
          <a className="home-button" href="/register-2"><span>{t.courseCta}</span><Arrow /></a>
        </div>
      </section>

      <section className="home-panel home-media-panel" id="video">
        <img className="home-panel-image" src="/images/slide-video-ad.png" alt={lang === "fa" ? "تولید ویدیوی تبلیغاتی با هوش مصنوعی" : "AI advertising video production"} />
        <div className="home-panel-shade" />
        <div className="home-panel-content home-shell">
          <p className="home-kicker">{t.videoKicker}</p><h2>{t.videoTitle}</h2><p>{t.videoText}</p>
          <a className="home-button" href="#portfolio"><span>{t.videoCta}</span><Arrow /></a>
        </div>
      </section>

      <section className="home-panel home-app-panel">
        <img className="home-panel-image" src="/images/slide-ai-app-studio.webp" alt={lang === "fa" ? "طراحی و ساخت اپلیکیشن هوش مصنوعی" : "AI application design and development"} />
        <div className="home-panel-shade" />
        <div className="home-panel-content home-shell">
          <p className="home-kicker">{t.appKicker}</p><h2>{t.appTitle}</h2><p>{t.appText}</p>
          <a className="home-button" href="#contact"><span>{t.appCta}</span><Arrow /></a>
        </div>
      </section>

      <section className="home-portfolio" id="portfolio">
        <div className="home-shell">
          <div className="home-section-heading"><div><p className="home-kicker">{t.portfolioKicker}</p><h2>{t.portfolioTitle}</h2></div><p>{t.portfolioText}</p></div>
          <div className="home-video-grid">
            {["01", "02", "03"].map((id, index) => (
              <article className="home-video-card" key={id}><span className="home-video-number">0{index + 1}</span>
                <video ref={(video) => { videoRefs.current[index] = video; }} controls loop playsInline preload="metadata" poster={`/videos/video-${id}.jpg`} aria-label={`${t.portfolioTitle} ${index + 1}`} onPlay={(event) => videoRefs.current.forEach(video => { if (video && video !== event.currentTarget) video.pause(); })}>
                  <source src={`/videos/video-${id}.mp4`} type="video/mp4" />
                </video>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-panel home-news-panel" id="news">
        <img className="home-panel-image" src="/images/slide-ai-news.png" alt={lang === "fa" ? "اخبار و تحلیل هوش مصنوعی" : "Artificial intelligence news and analysis"} />
        <div className="home-panel-shade" />
        <div className="home-panel-content home-shell">
          <p className="home-kicker">{t.newsKicker}</p><h2>{t.newsTitle}</h2><p>{t.newsText}</p>
          <a className="home-button" href="#latest-news"><span>{t.newsCta}</span><Arrow /></a>
        </div>
      </section>

      <section className="home-latest" id="latest-news">
        <div className="home-shell home-news-grid">
          {newsLinks.map((link, index) => (
            <a href={link} target="_blank" rel="noreferrer" className="home-news-card" key={link}>
              <div className="home-news-image"><img src={newsImages[index]} alt="" /></div>
              <div className="home-news-copy"><span>{t.newsLabels[index]}</span><h3>{t.newsTitles[index]}</h3><Arrow /></div>
            </a>
          ))}
        </div>
      </section>

      <section className="home-founder">
        <div className="home-founder-image"><img src="/images/hamed-sami-zadeh.jpg" alt={lang === "fa" ? "حامد سمیع‌زاده، بنیان‌گذار سمیز" : "Hamed Sami Zadeh, founder of Samiz"} /></div>
        <div className="home-founder-copy">
          <p className="home-kicker">{t.founderKicker}</p><h2>{t.founderTitle}</h2><p>{t.founderText}</p><blockquote>{t.founderQuote}</blockquote>
          <strong>{lang === "fa" ? "حامد سمیع‌زاده" : "Hamed Sami Zadeh"}</strong><small>FOUNDER / SAMIZ AI</small>
        </div>
      </section>

      <section className="home-python">
        <div className="home-shell home-python-inner">
          <div><p className="home-kicker">{t.pythonKicker}</p><h2>{t.pythonTitle}</h2><p>{t.pythonText}</p><a className="home-button" href="/python"><span>{t.pythonCta}</span><Arrow /></a></div>
          <div className="home-code" aria-hidden="true"><div><i /><i /><i /><span>python-lab.py</span></div><pre><b>idea</b> = <em>"build with AI"</em>{"\n"}<b>for</b> step <b>in</b> journey:{"\n"}    learn(step){"\n"}    create(step){"\n\n"}<strong>print</strong>(<em>"You are ready."</em>)</pre></div>
        </div>
      </section>

      <section className="home-final" id="contact">
        <div className="home-shell"><p className="home-kicker">SAMIZ AI</p><h2>{t.finalTitle}</h2><p>{t.finalText}</p><div className="home-final-actions"><a className="home-button home-button-light" href="/register-2"><span>{t.finalPrimary}</span><Arrow /></a><a className="home-text-link" href="https://wa.me/18259250075" target="_blank" rel="noreferrer">{t.finalSecondary}<Arrow /></a></div></div>
      </section>

      <footer className="home-footer">
        <div className="home-shell"><a className="home-logo" href="#top"><BrandMark /><span>SAMIZ AI</span></a><p>{t.footer}</p><div><a href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer">INSTAGRAM</a><a href="#top">{t.backTop} ↑</a></div></div>
      </footer>
    </main>
  );
}
