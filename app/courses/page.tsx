import Image from "next/image";
import Link from "next/link";
import "./courses.css";

const courses = [
  {
    id: "coding",
    title: "دوره کدینگ و وایب‌کدینگ",
    provider: "حامد سمیع‌زاده × دکتر هادی روشن",
    summary: "از اولین پرامپت تا اولین پروژه پایتون",
    meta: "از صفر · پروژه‌محور · دوره ضبط‌شده",
    badges: ["ثبت‌نام فعال", "پایتون + AI"],
    image: "/images/hero-laptop-clean.webp",
    href: "/coding-vibe-coding",
    imagePosition: "center",
  },
  {
    id: "video",
    title: "دوره تخصصی ساخت ویدیو با هوش مصنوعی",
    provider: "مج بهرامی · Mage Bahrami",
    summary: "از پرامپت و کارگردانی تا تدوین و کنترل کیفیت",
    meta: "۱۵ فصل · تخصصی · پروژه‌محور",
    badges: ["دوره جدید", "ثبت‌نام به‌زودی"],
    image: "/images/slide-video-ad.png",
    href: "/ai-video-creation",
    imagePosition: "center",
  },
];

export default function CoursesPage() {
  return (
    <main className="catalog-page" dir="rtl">
      <header className="catalog-header">
        <Link href="/" className="catalog-brand" aria-label="SAMIZ AI">
          <span>S</span>
          <div><strong>SAMIZ AI</strong><small>ACADEMY</small></div>
        </Link>
        <Link href="/" className="catalog-home">بازگشت به خانه <span>↗</span></Link>
      </header>

      <section className="catalog-heading">
        <p>SAMIZ AI ACADEMY</p>
        <div>
          <h1>دوره‌های تخصصی هوش مصنوعی</h1>
          <span>دوره موردنظرت را انتخاب کن و جزئیات کامل، سرفصل‌ها و شرایط ثبت‌نام را ببین.</span>
        </div>
      </section>

      <section className="catalog-panel">
        <nav className="catalog-filters" aria-label="دسته‌بندی دوره‌ها">
          <a className="active" href="#course-grid">همه دوره‌ها</a>
          <a href="#coding">کدینگ و برنامه‌نویسی</a>
          <a href="#video">ساخت ویدیو</a>
          <a href="#course-grid">پرامپت‌نویسی</a>
          <a href="#course-grid">هوش مصنوعی</a>
        </nav>

        <div className="catalog-grid" id="course-grid">
          {courses.map((course) => (
            <article className="catalog-card" id={course.id} key={course.id}>
              <Link href={course.href} className="catalog-card-link" aria-label={`مشاهده ${course.title}`}>
                <div className="catalog-image">
                  <Image
                    src={course.image}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 50vw"
                    style={{ objectPosition: course.imagePosition }}
                    priority={course.id === "coding"}
                  />
                  <span className="catalog-arrow">↗</span>
                </div>

                <div className="catalog-card-body">
                  <div className="catalog-provider">
                    <span className="catalog-provider-mark">S</span>
                    <strong>{course.provider}</strong>
                  </div>
                  <h2>{course.title}</h2>
                  <p>{course.summary}</p>
                  <div className="catalog-meta"><span aria-hidden="true">★</span>{course.meta}</div>
                  <div className="catalog-badges">
                    {course.badges.map((badge, index) => <span className={index === 0 ? "highlight" : ""} key={badge}>{badge}</span>)}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="catalog-footer">
        <span>SAMIZ AI ACADEMY</span>
        <p>یاد بگیر. بساز. دیده شو.</p>
        <Link href="/">samizai.com</Link>
      </footer>
    </main>
  );
}
