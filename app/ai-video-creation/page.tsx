import Link from "next/link";
import "./video-course.css";

const modules = [
  {
    number: "01",
    title: "شناخت مدل‌ها و حالت‌های تولید",
    text: "شناخت Seedance 2.5 و Gemini Omni Flash 1.1 و انتخاب دقیق میان Text to Video، Image to Video، Multi-Reference، First/Last Frame، Extend و Edit.",
    tags: ["Seedance 2.5", "Gemini", "Generation Modes"],
  },
  {
    number: "02",
    title: "پرامپت‌نویسی حرفه‌ای برای هر شات",
    text: "تبدیل ایده به دستور اجرایی قابل‌سنجش؛ تعریف وضعیت شروع و پایان، کنش علت‌ومعلولی، محدودیت‌های هدفمند و اصلاح خروجی با تغییر کنترل‌شده متغیرها.",
    tags: ["Prompt Architecture", "Constraints", "Iteration"],
  },
  {
    number: "03",
    title: "معماری روایت و زمان‌بندی",
    text: "طراحی Hook، Setup، Progression، Proof، Payoff و Exit Hold؛ تقسیم اتفاق‌ها در طول زمان و ساخت پرامپت‌های چندمرجعی و زمان‌بندی‌شده.",
    tags: ["Shot Design", "Timeline", "Storytelling"],
  },
  {
    number: "04",
    title: "قاب، زاویه، فوکوس و لنز",
    text: "کاربرد روایی نسبت تصویر، اندازه نما، زاویه دوربین، عمق میدان و لنزهای ۱۴ تا ۲۰۰ میلی‌متری؛ همراه با کنترل پرسپکتیو و فرم چهره.",
    tags: ["Composition", "Lenses", "Focus"],
  },
  {
    number: "05",
    title: "حرکت دوربین و کنترل زمان",
    text: "طراحی فیزیکی Dolly، Pan، Tilt، Truck، Orbit، Tracking، Handheld، Gimbal، FPV، Dolly Zoom و حرکت‌های زمانی مثل Slow Motion و Speed Ramp.",
    tags: ["Camera Motion", "Blocking", "Timing"],
  },
  {
    number: "06",
    title: "نور، رنگ، بافت و متریال",
    text: "تعریف منبع و وظیفه نور، ساخت نورهای سینمایی و کنترل رنگ و جنس محصول؛ با تمرین‌های مقایسه‌ای که در هر آزمایش فقط یک متغیر را تغییر می‌دهند.",
    tags: ["Lighting", "Color", "Material"],
  },
  {
    number: "07",
    title: "سامانه رفرنس و حفظ تداوم",
    text: "ساخت Character، Product، Wardrobe، Location و Lighting Sheet؛ نقش‌گذاری رفرنس‌ها، قفل‌کردن هویت و محصول و طراحی First Frame، Last Frame و استوری‌بورد.",
    tags: ["Reference System", "Continuity", "Sheets"],
  },
  {
    number: "08",
    title: "حرکت طبیعی، بازی و فیزیک",
    text: "کنترل نگاه، تنفس، انتقال وزن، تماس دست و جسم، Secondary Motion و رفتار متریال‌ها؛ همراه با Previs سه‌بعدی، ویدیوی مرجع و جایگزینی محیط با پرده سبز.",
    tags: ["Performance", "Physics", "Previs"],
  },
  {
    number: "09",
    title: "صدا، دیالوگ و موزیک‌ویدیو",
    text: "لایه‌بندی Ambience، Foley، SFX، دیالوگ و موسیقی؛ ساخت صدای فارسی با ElevenLabs، کنترل لب‌خوانی و هماهنگ‌کردن تصویر با ساختار آهنگ.",
    tags: ["Audio", "Dialogue", "Music Video"],
  },
  {
    number: "10",
    title: "پروژه، تدوین و کنترل کیفیت",
    text: "اجرای پروژه چندشاته VAREL / 01، طراحی ترنزیشن، Extend و Edit هدفمند، تعمیر خطاهای هویت و حرکت و تحویل پروژه پایانی با چک‌لیست حرفه‌ای.",
    tags: ["VAREL / 01", "Edit & Extend", "Quality Control"],
  },
];

const outcomes = [
  "تبدیل یک ایده فارسی به پرامپت اجرایی انگلیسی",
  "کنترل دقیق قاب، لنز، دوربین، نور و حرکت",
  "حفظ هویت شخصیت، محصول و لوکیشن میان شات‌ها",
  "ساخت صدا، دیالوگ و موزیک‌ویدیوی هماهنگ",
  "عیب‌یابی و تعمیر خروجی به‌جای تولید تصادفی دوباره",
  "طراحی و تحویل یک ویدیوی چندشاته کامل",
];

export default function AiVideoCreationPage() {
  return (
    <main className="avc-page" dir="rtl">
      <header className="avc-header">
        <Link href="/" className="avc-brand" aria-label="SAMIZ AI">
          <span>S</span><strong>SAMIZ AI</strong><small>ACADEMY</small>
        </Link>
        <nav aria-label="مسیر صفحه">
          <Link href="/courses">همه دوره‌ها</Link>
          <a href="#curriculum">سرفصل‌ها</a>
        </nav>
      </header>

      <section className="avc-hero">
        <div className="avc-hero-copy">
          <div className="avc-status"><span/> دوره تخصصی جدید</div>
          <p className="avc-overline">AI VIDEO DIRECTION · GENERATIVE FILMMAKING</p>
          <h1>ساخت ویدیو<br/><em>با هوش مصنوعی</em></h1>
          <p className="avc-lead">فقط کار با یک ابزار را یاد نمی‌گیرید؛ یاد می‌گیرید مثل یک کارگردان حرفه‌ای برای تصویر، حرکت، دوربین، نور، صدا، بازی، رفرنس و تدوین تصمیم دقیق بگیرید.</p>
          <div className="avc-teacher"><small>مدرس دوره</small><strong>مج بهرامی</strong><span>Mage Bahrami</span></div>
          <div className="avc-actions">
            <a href="#curriculum" className="avc-primary">مشاهده مسیر دوره <span>↙</span></a>
            <a href="#notify" className="avc-secondary">اطلاع از ثبت‌نام</a>
          </div>
        </div>
        <div className="avc-hero-visual">
          <video autoPlay muted loop playsInline preload="metadata" poster="/videos/video-01.jpg" aria-label="نمونه ویدیوی ساخته‌شده با هوش مصنوعی">
            <source src="/videos/video-01.mp4" type="video/mp4" />
          </video>
          <div className="avc-frame-corners" aria-hidden="true"><span/><span/><span/><span/></div>
          <div className="avc-visual-meta"><span>SCENE / 01</span><strong>DIRECT THE MODEL</strong><span>9:16 · 16:9 · 2.39:1</span></div>
        </div>
      </section>

      <section className="avc-facts" aria-label="مشخصات دوره">
        <div><small>مدرس</small><strong>مج بهرامی</strong></div>
        <div><small>ساختار</small><strong>۱۵ فصل تخصصی</strong></div>
        <div><small>رویکرد</small><strong>کارگردانی + پروژه عملی</strong></div>
        <div><small>ثبت‌نام</small><strong>به‌زودی اعلام می‌شود</strong></div>
      </section>

      <section className="avc-positioning">
        <p className="avc-section-label">بیشتر از آموزش یک ابزار</p>
        <div>
          <h2>از «تولید تصادفی» به <em>کنترل حرفه‌ای خروجی.</em></h2>
          <p>این دوره اصول ثابت کارگردانی را کنار قابلیت‌های مدل‌های روز قرار می‌دهد. در پایان، به‌جای آزمون‌وخطای کور، می‌دانید هر شات را چطور طراحی، تولید، ارزیابی و اصلاح کنید.</p>
        </div>
      </section>

      <section className="avc-curriculum" id="curriculum">
        <div className="avc-section-head">
          <div><p className="avc-section-label">خلاصه سرفصل‌ها</p><h2>۱۵ فصل در ۱۰ محور کاربردی</h2></div>
          <p>مسیر دوره از شناخت مدل و پرامپت شروع می‌شود و به ساخت یک پروژه چندشاته، تدوین هدفمند و کنترل کیفیت حرفه‌ای می‌رسد.</p>
        </div>
        <div className="avc-module-grid">
          {modules.map((item) => (
            <article key={item.number}>
              <div className="avc-module-top"><span>{item.number}</span><i>↙</i></div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <footer>{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</footer>
            </article>
          ))}
        </div>
      </section>

      <section className="avc-project">
        <div className="avc-project-copy">
          <p className="avc-section-label">پروژه عملی VAREL / 01</p>
          <h2>یک روایت چندشاته؛ از مرجع مادر تا قاب نهایی.</h2>
          <p>در پروژه «آستانه حافظه»، هویت شخصیت، فرم محصول و معماری لوکیشن قفل می‌شوند و شات‌ها با زمان‌بندی، تماس، حرکت دوربین، صدا و ترنزیشن‌های هدفمند به یک روایت منسجم تبدیل می‌شوند.</p>
        </div>
        <div className="avc-shot-list" aria-label="شات‌های پروژه">
          {["معرفی و قلاب تصویری", "ورود شخصیت و سنجش فضا", "آماده‌شدن دست و نخستین تماس", "گذار آستانه و اتصال شات‌ها", "قاب نهایی محصول و Exit Hold"].map((shot,index) => <div key={shot}><span>0{index+1}</span><strong>{shot}</strong></div>)}
        </div>
      </section>

      <section className="avc-outcomes">
        <div className="avc-section-head"><div><p className="avc-section-label">خروجی دوره</p><h2>در پایان چه چیزی بلد هستید؟</h2></div></div>
        <div className="avc-outcome-grid">
          {outcomes.map((outcome,index) => <div key={outcome}><span>0{index+1}</span><p>{outcome}</p></div>)}
        </div>
      </section>

      <section className="avc-notify" id="notify">
        <div>
          <p className="avc-section-label">ثبت‌نام دوره</p>
          <h2>جزئیات ثبت‌نام<br/>به‌زودی اعلام می‌شود.</h2>
          <p>برای اینکه زمان شروع، قیمت و روش ثبت‌نام را از دست ندهید، صفحه اینستاگرام سمیز را دنبال کنید یا از طریق واتساپ پیام بدهید.</p>
        </div>
        <div className="avc-contact-actions">
          <a href="https://www.instagram.com/hamedsamizadeh/" target="_blank" rel="noreferrer">اینستاگرام سمیز <span>↗</span></a>
          <a href="https://wa.me/18259250075" target="_blank" rel="noreferrer">پرسش در واتساپ <span>↗</span></a>
        </div>
      </section>

      <footer className="avc-footer"><span>SAMIZ AI ACADEMY</span><p>دوره تخصصی ساخت ویدیو با هوش مصنوعی · مج بهرامی</p><Link href="/courses">مشاهده همه دوره‌ها</Link></footer>
    </main>
  );
}
