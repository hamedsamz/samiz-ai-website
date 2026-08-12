"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Status = "pending" | "approved" | "rejected" | "expired";
type Registration = {
  id: string;
  slotId: number;
  fullName: string;
  email: string;
  phone: string;
  receiptName: string;
  receiptType: string;
  status: Status;
  createdAt: number;
  emailSentAt: number | null;
};

const labels: Record<Status, string> = {
  pending: "در انتظار بررسی",
  approved: "تأییدشده",
  rejected: "ردشده",
  expired: "منقضی‌شده",
};

export default function ChallengeAdminPanel() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/calorie-challenge", { cache: "no-store" });
      if (response.status === 401) {
        setAuthenticated(false);
        setRegistrations([]);
        return;
      }
      const result = await response.json() as { registrations?: Registration[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "خطا در دریافت ثبت‌نام‌ها");
      setAuthenticated(true);
      setRegistrations(result.registrations ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطا در دریافت اطلاعات", error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    pending: registrations.filter(item => item.status === "pending").length,
    approved: registrations.filter(item => item.status === "approved").length,
    active: registrations.filter(item => item.status === "pending" || item.status === "approved").length,
  }), [registrations]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoginBusy(false);
    if (!response.ok) {
      setMessage({ text: "رمز مدیریت صحیح نیست.", error: true });
      return;
    }
    setPassword("");
    await load();
  }

  async function review(id: string, status: "approved" | "rejected") {
    const action = status === "approved" ? "تأیید این رسید و ارسال ایمیل" : "رد این ثبت‌نام";
    if (!window.confirm(`از ${action} مطمئن هستید؟`)) return;
    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/calorie-challenge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json() as { error?: string; emailSent?: boolean };
    setBusyId(null);
    if (!response.ok) {
      setMessage({ text: result.error ?? "عملیات انجام نشد.", error: true });
      return;
    }
    setMessage({
      text: status === "approved"
        ? (result.emailSent ? "رسید تأیید و ایمیل تأیید ارسال شد." : "رسید تأیید شد، اما ارسال ایمیل ناموفق بود؛ می‌توانید دوباره ارسال کنید.")
        : "ثبت‌نام رد و ظرفیت آن آزاد شد.",
      error: status === "approved" && !result.emailSent,
    });
    await load();
  }

  async function resend(id: string) {
    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/calorie-challenge/${id}`, { method: "POST" });
    const result = await response.json() as { error?: string };
    setBusyId(null);
    if (!response.ok) {
      setMessage({ text: result.error ?? "ارسال ایمیل انجام نشد.", error: true });
      return;
    }
    setMessage({ text: "ایمیل تأیید دوباره ارسال شد." });
    await load();
  }

  async function emailTool(event: FormEvent<HTMLFormElement>, action: "test" | "manual") {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setEmailBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/calorie-challenge/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        email: String(data.get("email") ?? ""),
        fullName: action === "manual" ? String(data.get("fullName") ?? "") : "کاربر آزمایشی",
      }),
    });
    const result = await response.json() as { message?: string; error?: string };
    setEmailBusy(false);
    setMessage({ text: result.message ?? result.error ?? "عملیات انجام نشد.", error: !response.ok });
    if (response.ok) form.reset();
  }

  if (authenticated === false) return <main className="challenge-admin login-view" dir="rtl">
    <form className="admin-login-card" onSubmit={login}>
      <span className="admin-kicker">SAMIZ AI</span>
      <h1>ورود مدیر چالش</h1>
      <p>برای بررسی رسیدها و تأیید ثبت‌نام‌ها وارد شوید.</p>
      <label htmlFor="adminPassword">رمز مدیریت</label>
      <input id="adminPassword" type="password" value={password} onChange={event => setPassword(event.target.value)} required autoFocus />
      <button disabled={loginBusy}>{loginBusy ? "در حال ورود…" : "ورود به پنل"}</button>
      {message && <p className={message.error ? "admin-message error" : "admin-message"}>{message.text}</p>}
    </form>
  </main>;

  return <main className="challenge-admin" dir="rtl">
    <header className="admin-header">
      <div><span className="admin-kicker">SAMIZ AI</span><h1>ثبت‌نام چالش کالری‌شماری</h1><p>بررسی رسیدها، مدیریت ظرفیت و ارسال ایمیل تأیید</p></div>
      <div className="admin-header-actions"><a href="/calorie-challenge" target="_blank" rel="noreferrer">مشاهده صفحه ثبت‌نام</a><button onClick={() => void load()} disabled={loading}>به‌روزرسانی</button></div>
    </header>

    <section className="admin-stats">
      <article><span>در انتظار بررسی</span><strong>{counts.pending}</strong></article>
      <article><span>تأییدشده</span><strong>{counts.approved}</strong></article>
      <article><span>ظرفیت استفاده‌شده</span><strong>{counts.active}<small> / ۳۰</small></strong></article>
      <article><span>ظرفیت باقی‌مانده</span><strong>{Math.max(0, 30 - counts.active)}</strong></article>
    </section>

    {message && <p className={message.error ? "admin-message error" : "admin-message success"}>{message.text}</p>}

    <section className="challenge-email-tools">
      <div className="email-tools-heading"><div><span className="admin-kicker">ایمیل عضویت</span><h2>ارسال تأیید و لینک کانال تلگرام</h2><p>ایمیل شامل تأیید ثبت‌نام و دکمه مستقیم ورود به کانال چالش است.</p></div><a href="https://t.me/+TeP6f6GhlFIyY2Nk" target="_blank" rel="noreferrer">مشاهده کانال</a></div>
      <div className="email-tool-grid">
        <form onSubmit={event => void emailTool(event, "test")}><span>۱</span><h3>ارسال آزمایشی</h3><p>قبل از ارسال برای اعضا، ظاهر و لینک ایمیل را روی ایمیل خودت بررسی کن.</p><input name="email" type="email" required placeholder="ایمیل تست" dir="ltr"/><button disabled={emailBusy}>{emailBusy ? "در حال ارسال…" : "ارسال ایمیل تستی"}</button></form>
        <form onSubmit={event => void emailTool(event, "manual")}><span>۲</span><h3>ارسال دستی</h3><p>برای فردی که خارج از فرم سایت ثبت‌نام کرده، ایمیل عضویت را دستی بفرست.</p><input name="fullName" required minLength={2} placeholder="نام و نام خانوادگی"/><input name="email" type="email" required placeholder="ایمیل فرد" dir="ltr"/><button disabled={emailBusy}>{emailBusy ? "در حال ارسال…" : "ارسال و ثبت ایمیل"}</button></form>
      </div>
    </section>

    <section className="admin-list">
      {loading ? <div className="admin-empty">در حال دریافت اطلاعات…</div> : registrations.length === 0 ? <div className="admin-empty">هنوز ثبت‌نامی دریافت نشده است.</div> : registrations.map(item => <article className="registration-card" key={item.id}>
        <div className="registration-top">
          <div><span className={`status status-${item.status}`}>{labels[item.status]}</span><h2>{item.fullName}</h2><small>شماره ظرفیت {item.slotId}</small></div>
          <time>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(Number(item.createdAt)))}</time>
        </div>
        <div className="registration-details">
          <div><span>ایمیل</span><a href={`mailto:${item.email}`}>{item.email}</a></div>
          <div><span>شماره تماس</span><a href={`tel:${item.phone}`}>{item.phone}</a></div>
          <div><span>رسید پرداخت</span><a className="receipt-link" href={`/api/admin/calorie-challenge/receipts/${item.id}`} target="_blank" rel="noreferrer">مشاهده {item.receiptType === "application/pdf" ? "PDF" : "تصویر"}</a></div>
          <div><span>وضعیت ایمیل</span><b className={item.emailSentAt ? "email-ok" : "email-wait"}>{item.emailSentAt ? "ارسال شده" : "ارسال نشده"}</b></div>
        </div>
        <div className="registration-actions">
          {item.status === "pending" && <><button className="approve" disabled={busyId === item.id} onClick={() => void review(item.id, "approved")}>تأیید رسید و ارسال ایمیل</button><button className="reject" disabled={busyId === item.id} onClick={() => void review(item.id, "rejected")}>رد ثبت‌نام</button></>}
          {item.status === "approved" && <button className="resend" disabled={busyId === item.id} onClick={() => void resend(item.id)}>{busyId === item.id ? "در حال ارسال…" : "ارسال دوباره ایمیل تأیید"}</button>}
        </div>
      </article>)}
    </section>
  </main>;
}
