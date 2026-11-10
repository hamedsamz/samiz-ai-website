"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AI_VIDEO_COURSE_PLANS, type AiVideoCoursePlan } from "../../../lib/ai-video-course-config";

type RegistrationPlan = AiVideoCoursePlan | "legacy";
type Status = "pending" | "approved" | "rejected";
type Registration = {
  id: string;
  plan?: AiVideoCoursePlan | null;
  location: "iran" | "international";
  fullName: string;
  age: number;
  phone: string;
  email: string;
  telegramUsername: string | null;
  paidAmount: number;
  paymentCurrency: "toman" | "usdt";
  receiptName: string;
  receiptType: string;
  status: Status;
  emailSentAt: number | null;
  createdAt: number;
};
type Stats = { pending: number; approved: number; iran: number; international: number };
const statusLabels: Record<Status, string> = { pending: "در انتظار", approved: "تأییدشده", rejected: "ردشده" };
const number = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function CodingCourseAdminPanel({
  apiBase = "/api/admin/coding-course",
  enableReminder = false,
}: {
  apiBase?: string;
  enableReminder?: boolean;
}) {
  const [items, setItems] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RegistrationPlan>("without-support");
  const [filter, setFilter] = useState<"all" | "iran" | "international">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`${apiBase}/registrations`, { cache: "no-store" });
    const data = await response.json();
    setAuthorized(response.ok);
    setItems(data.registrations ?? []);
    setStats(data.stats ?? null);
    setLoading(false);
  }, [apiBase]);

  useEffect(() => {
    // Initial data comes from the protected admin endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) });
    if (!response.ok) {
      const data = await response.json();
      setLoginError(data.error ?? "ورود انجام نشد.");
      return;
    }
    await load();
  }

  async function decide(id: string, status: "approved" | "rejected") {
    setNotice("");
    const response = await fetch(`${apiBase}/registrations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    setNotice(data.message ?? data.warning ?? data.error ?? "عملیات انجام شد.");
    await load();
  }

  async function emailAction(payload: Record<string, string>) {
    setEmailBusy(true);
    setNotice("");
    const response = await fetch(`${apiBase}/confirmation-emails`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setNotice(data.message ?? data.error ?? "عملیات انجام نشد.");
    setEmailBusy(false);
    if (response.ok) await load();
  }

  async function testEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await emailAction({ action: enableReminder ? "test-reminder" : "test", email: String(form.get("email") ?? ""), ...(enableReminder ? { plan: selectedPlan } : {}) });
  }

  async function bulkEmail() {
    const target = enableReminder ? selectedPlanLabel : "همه افراد تأییدشده";
    if (!confirm(`ایمیل ورود به کانال برای دریافت‌کنندگان ارسال‌نشدهٔ «${target}» فرستاده شود؟`)) return;
    await emailAction({ action: "bulk", ...(enableReminder ? { plan: selectedPlan } : {}) });
  }

  async function reminderEmail() {
    if (!confirm(`ایمیل یادآوری ورود به کانال برای ${number(approvedForEmail.length)} نفر تأییدشدهٔ «${selectedPlanLabel}» ارسال شود؟`)) return;
    await emailAction({ action: "reminder", plan: selectedPlan });
  }

  const selectedPlanLabel = selectedPlan === "legacy" ? "نوبت قبلی" : AI_VIDEO_COURSE_PLANS[selectedPlan].label;
  const planItems = enableReminder ? items.filter(item => (item.plan ?? "legacy") === selectedPlan) : items;
  const visibleItems = filter === "all" ? planItems : planItems.filter(item => item.location === filter);
  const approvedForEmail = planItems.filter(item => item.status === "approved");
  const iranItems = planItems.filter(item => item.location === "iran");
  const internationalItems = planItems.filter(item => item.location === "international");
  const displayStats = enableReminder && stats ? {
    pending: planItems.filter(item => item.status === "pending").length,
    approved: approvedForEmail.length,
    iran: iranItems.filter(item => item.status !== "rejected").length,
    international: internationalItems.filter(item => item.status !== "rejected").length,
  } : stats;
  const approvedWithoutEmail = approvedForEmail.filter(item => !item.emailSentAt).length;

  if (authorized === false) return <form className="admin-login" onSubmit={login}><h2>ورود مدیر</h2><p>رمز مدیریت را وارد کنید.</p><input name="password" type="password" required placeholder="رمز مدیریت" /><button className="gold-button">ورود به پنل</button>{loginError && <p className="form-message error">{loginError}</p>}</form>;

  return (
    <>
      {enableReminder && (
        <label className="coding-plan-picker">
          پلن ثبت‌نام
          <select value={selectedPlan} onChange={event => {
            setSelectedPlan(event.target.value as RegistrationPlan);
            setFilter("all");
            setNotice("");
          }} disabled={emailBusy}>
            <option value="without-support">{AI_VIDEO_COURSE_PLANS["without-support"].label}</option>
            <option value="with-support">{AI_VIDEO_COURSE_PLANS["with-support"].label}</option>
            <option value="legacy">نوبت قبلی</option>
          </select>
        </label>
      )}

      <div className="admin-stats coding-stats">
        <div><span>در انتظار بررسی</span><strong>{displayStats?.pending ?? "—"}</strong></div>
        <div><span>تأییدشده</span><strong>{displayStats?.approved ?? "—"}</strong></div>
        <div><span>ثبت‌نام داخل ایران</span><strong>{displayStats?.iran ?? "—"}</strong></div>
        <div><span>ثبت‌نام خارج ایران</span><strong>{displayStats?.international ?? "—"}</strong></div>
      </div>

      <section className="coding-email-tools">
        <div><p className="eyebrow">ایمیل کانال دوره</p><h2>ارسال لینک ورود</h2><span>{number(approvedWithoutEmail)} نفر تأییدشده هنوز ایمیل نگرفته‌اند.</span></div>
        <form onSubmit={testEmail}><input name="email" type="email" required placeholder="ایمیل آزمایشی" /><button disabled={emailBusy}>{enableReminder ? "تست ایمیل یادآوری" : "ارسال تست"}</button></form>
        <div className="coding-email-actions">
          <button className="coding-bulk" disabled={emailBusy || approvedWithoutEmail === 0} onClick={bulkEmail}>{enableReminder ? "ارسال به افراد این پلن که ایمیل نگرفته‌اند" : "ارسال به همه افراد ارسال‌نشده"}</button>
          {enableReminder && <button className="coding-reminder" disabled={emailBusy || approvedForEmail.length === 0} onClick={reminderEmail}>ارسال یادآوری به تأییدشده‌های این پلن</button>}
        </div>
      </section>

      {notice && <p className="coding-admin-notice">{notice}</p>}

      <div className="admin-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>همه ({number(planItems.length)})</button>
        <button className={filter === "iran" ? "active" : ""} onClick={() => setFilter("iran")}>داخل ایران ({number(iranItems.length)})</button>
        <button className={filter === "international" ? "active" : ""} onClick={() => setFilter("international")}>خارج ایران ({number(internationalItems.length)})</button>
      </div>

      <div className="admin-list">
        {loading ? <p>در حال دریافت اطلاعات…</p> : visibleItems.length === 0 ? <p>هنوز درخواستی در این بخش ثبت نشده است.</p> : visibleItems.map(item => (
          <article key={item.id} className="admin-item coding-admin-item">
            <div className="admin-person">
              <div className="coding-item-badges"><span className={`status ${item.status}`}>{statusLabels[item.status]}</span><span className={`coding-location ${item.location}`}>{item.location === "iran" ? "داخل ایران" : "خارج ایران"}</span></div>
              <h2>{item.fullName}</h2>
              <a href={`tel:${item.phone}`}>{item.phone}</a>
              <a className="admin-email" href={`mailto:${item.email}`}>{item.email}</a>
              <small>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(item.createdAt)}</small>
            </div>
            <div className="coding-registration-details">
              {enableReminder && <span><b>پلن:</b> {item.plan ? AI_VIDEO_COURSE_PLANS[item.plan].label : "نوبت قبلی"}</span>}
              <span><b>سن:</b> {number(item.age)} سال</span>
              <span><b>مبلغ:</b> {item.paymentCurrency === "toman" ? `${number(Number(item.paidAmount))} تومان` : `${number(Number(item.paidAmount))} USDT`}</span>
              <span><b>تلگرام:</b> {item.telegramUsername ? <a href={`https://t.me/${item.telegramUsername}`} target="_blank" rel="noreferrer">@{item.telegramUsername}</a> : "—"}</span>
              <span><b>ایمیل کانال:</b> {item.emailSentAt ? "ارسال شده ✓" : "ارسال نشده"}</span>
            </div>
            <div className="admin-actions">
              <a className="receipt-button" href={`${apiBase}/receipts/${item.id}`} target="_blank">مشاهده رسید</a>
              {item.status === "pending" && <><button className="approve" onClick={() => decide(item.id, "approved")}>تأیید</button><button className="reject" onClick={() => decide(item.id, "rejected")}>رد</button></>}
              {item.status === "approved" && !item.emailSentAt && <button disabled={emailBusy} onClick={() => emailAction({ action: "single", id: item.id })}>ارسال ایمیل</button>}
              {item.emailSentAt && <span className="email-sent">ایمیل ارسال شد ✓</span>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
