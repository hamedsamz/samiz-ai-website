import Image from "next/image";
import Link from "next/link";
import "./courses.css";

const courses = [
  {
    number: "01",
    eyebrow: "CODING × AI × PYTHON",
    title: "کدینگ و وایب‌کدینگ",
    description: "از اولین پرامپت تا اولین پروژه پایتون؛ یک مسیر عملی و بدون پیش‌نیاز برای یادگیری هوش مصنوعی، مهندسی پرامپت و ساخت پروژه با AI.",
    teachers: "حامد سمیع‌زاده × دکتر هادی روشن",
    facts: ["شروع از صفر", "پروژه‌محور", "ثبت‌نام فعال"],
    image: "/images/hero-laptop-clean.webp",
    href: "/coding-vibe-coding",
    accent: "lime",
    cta: "جزئیات و ثبت‌نام",
  },
  {
    number: "02",
    eyebrow: "DIRECTING × MOTION × GENERATIVE VIDEO",
    title: "ساخت ویدیو با هوش مصنوعی",
    description: "یاد بگیرید مثل یک کارگردان حرفه‌ای، تصویر، حرکت، دوربین، نور، صدا، بازی، رفرنس و تدوین را در مدل‌های پیشرفته ویدیوساز کنترل کنید.",
    teachers: "مدرس: مج بهرامی · Mage Bahrami",
    facts: ["۱۵ فصل تخصصی", "پروژه عملی", "اطلاعات ثبت‌نام به‌زودی"],
    image: "/images/slide-video-ad.png",
    href: "/ai-video-creation",
    accent: "cyan",
    cta: "مشاهده سرفصل‌ها",
  },
];

export default function CoursesPage() {
  return (
    <main className="courses-page" dir="rtl">
      <header className="courses-header">
        <Link href="/" className="courses-brand" aria-label="SAMIZ AI">
          <span>S</span><strong>SAMIZ AI</strong><small>ACADEMY</small>
        </Link>
        <Link href="/" className="courses-home-link">بازگشت به خانه <span>↗</span></Link>
      </header>

      <section className="courses-intro">
        <p className="courses-kicker">SAMIZ AI ACADEMY / COURSES</p>
        <div>
          <h1>مسیر خودت را<br/><em>انتخاب کن.</em></h1>
          <p>دوره‌های پروژه‌محور برای یادگیری مهارت‌هایی که همین امروز می‌توانی با آن‌ها بسازی، تجربه کنی و حرفه‌ای‌تر کار کنی.</p>
        </div>
      </section>

      <section className="courses-list" aria-label="فهرست دوره‌ها">
        {courses.map((course) => (
          <article className={`course-choice ${course.accent}`} key={course.number}>
            <Link href={course.href} className="course-choice-image" aria-label={`مشاهده ${course.title}`}>
              <Image src={course.image} alt="" fill sizes="(max-width: 800px) 100vw, 50vw" priority={course.number === "01"} />
              <span className="course-choice-number">{course.number}</span>
              <span className="course-choice-open">↗</span>
            </Link>
            <div className="course-choice-copy">
              <p>{course.eyebrow}</p>
              <h2>{course.title}</h2>
              <p className="course-choice-description">{course.description}</p>
              <strong className="course-choice-teacher">{course.teachers}</strong>
              <div className="course-choice-facts">
                {course.facts.map((fact) => <span key={fact}>{fact}</span>)}
              </div>
              <Link href={course.href} className="course-choice-cta">{course.cta}<span>↗</span></Link>
            </div>
          </article>
        ))}
      </section>

      <footer className="courses-footer">
        <span>SAMIZ AI ACADEMY</span>
        <p>یاد بگیر. بساز. دیده شو.</p>
        <Link href="/">samizai.com</Link>
      </footer>
    </main>
  );
}
