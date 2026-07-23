"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Status = "pending" | "approved" | "rejected" | "expired";
type Registration = {
  id: string; slotId: number; paymentType: "charity" | "card"; fullName: string; age: number; education: string;
  specialty: string | null; occupation: string; phone: string; email: string; charityName: string | null;
  paidAmount: number; receiptName: string; receiptType: string; status: Status; createdAt: number; emailSentAt: number | null;
};
type Capacity = { charityUsed: number; charityApproved: number; charityApprovedTotal: number; cardUsed: number; remaining: number };
const labels: Record<Status, string> = { pending: "در انتظار", approved: "تأیید شده", rejected: "رد شده", expired: "منقضی شده" };
const formatToman = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function Course2AdminPanel() {
  const [items, setItems] = useState<Registration[]>([]);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "charity" | "card">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/course-2/registrations", { cache: "no-store" });
    const data = await response.json();
    setAuthorized(response.ok);
    setItems(data.registrations ?? []);
    setCapacity(data.capacity ?? null);
    setLoading(false);
  }, []);
  useEffect(() => {
    // Initial data comes from the protected admin endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoginError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) });
    if (!response.ok) { const data = await response.json(); setLoginError(data.error ?? "ورود انجام نشد."); return; }
    await load();
  }
  async function decide(id: string, status: "approved" | "rejected") {
    const response = await fetch(`/api/admin/course-2/registrations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) { const data = await response.json(); alert(data.error ?? "عملیات انجام نشد."); }
    await load();
  }
  async function emailAction(payload: Record<string, string>) {
    setEmailBusy(true); setEmailMessage("");
    const response = await fetch("/api/admin/course-2/confirmation-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setEmailMessage(data.message ?? data.error ?? "عملیات انجام نشد."); setEmailBusy(false);
    if (response.ok) await load();
    return response.ok;
  }
  async function testEmail(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await emailAction({ action: "test", email: String(form.get("email") ?? ""), fullName: "کاربر آزمایشی" }); }
  async function manualEmail(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const ok = await emailAction({ action: "manual", email: String(form.get("email") ?? ""), fullName: String(form.get("fullName") ?? "") }); if (ok) event.currentTarget.reset(); }
  async function bulkEmail() { if (!confirm("ایمیل تأیید برای تمام افراد تأییدشده ارسال‌نشده فرستاده شود؟")) return; await emailAction({ action: "bulk" }); }

  const pending = items.filter(item => item.status === "pending").length;
  const approved = items.filter(item => item.status === "approved").length;
  const visibleItems = useMemo(() => filter === "all" ? items : items.filter(item => item.paymentType === filter), [filter, items]);

  if (authorized === false) return <form className="admin-login" onSubmit={login}><h2>ورود مدیر</h2><p>رمز مدیریت را وارد کنید.</p><input name="password" type="password" required placeholder="رمز مدیریت" /><button className="gold-button">ورود به پنل</button>{loginError && <p className="form-message error">{loginError}</p>}</form>;
  return <>
    <div className="admin-stats course2-stats"><div><span>در انتظار بررسی</span><strong>{pending}</strong></div><div><span>تأییدشده از ۱۰۰ نفر</span><strong>{approved}</strong></div><div><span>ثبت‌شده خیریه</span><strong>{capacity?.charityUsed ?? "—"} / ۲۰</strong></div><div><span>مبلغ خیریه تأییدشده</span><strong>{capacity ? `${formatToman(capacity.charityApprovedTotal)} تومان` : "—"}</strong></div></div>

    <section className="email-tools"><h2>ارسال ایمیل تأیید دوره جدید</h2><p>تا قبل از تنظیم لینک کانال تلگرام جدید، ارسال ایمیل غیرفعال می‌ماند و پیام خطا نمایش داده می‌شود.</p><div className="email-tool-grid"><form onSubmit={testEmail}><h3>۱. ارسال آزمایشی</h3><input name="email" type="email" required placeholder="ایمیل خودت" /><button disabled={emailBusy}>ارسال آزمایشی</button></form><div><h3>۲. افراد تأییدشده سایت</h3><button className="bulk-email" disabled={emailBusy} onClick={bulkEmail}>ارسال به همه افراد ارسال‌نشده</button></div><form onSubmit={manualEmail}><h3>۳. ثبت‌نام خارج از سایت</h3><input name="fullName" required placeholder="نام و نام خانوادگی" /><input name="email" type="email" required placeholder="ایمیل" /><button disabled={emailBusy}>ارسال و ثبت</button></form></div>{emailMessage && <p className="email-result">{emailMessage}</p>}</section>

    <div className="admin-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>همه ({items.length})</button><button className={filter === "charity" ? "active" : ""} onClick={() => setFilter("charity")}>خیریه ({items.filter(x => x.paymentType === "charity").length})</button><button className={filter === "card" ? "active" : ""} onClick={() => setFilter("card")}>پرداخت کارت ({items.filter(x => x.paymentType === "card").length})</button></div>
    <div className="admin-list">{loading ? <p>در حال دریافت اطلاعات…</p> : visibleItems.length === 0 ? <p>درخواستی در این بخش وجود ندارد.</p> : visibleItems.map(item => <article key={item.id} className="admin-item course2-admin-item">
      <div className="admin-person"><div className="item-badges"><span className={`status ${item.status}`}>{labels[item.status]}</span><span className={`payment-badge ${item.paymentType}`}>{item.paymentType === "charity" ? "خیریه" : "پرداخت کارت"}</span><span className="slot-badge">ظرفیت {item.slotId}</span></div><h2>{item.fullName}</h2><a href={`tel:${item.phone}`}>{item.phone}</a><a className="admin-email" href={`mailto:${item.email}`}>{item.email}</a><small>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(item.createdAt)}</small></div>
      <div className="registration-profile"><span><b>سن:</b> {item.age}</span><span><b>تحصیلات:</b> {item.education}</span><span><b>تخصص:</b> {item.specialty || "—"}</span><span><b>شغل:</b> {item.occupation}</span>{item.paymentType === "charity" && <><span><b>خیریه:</b> {item.charityName}</span><span><b>مبلغ:</b> {formatToman(Number(item.paidAmount))} تومان</span></>}</div>
      <div className="admin-actions"><a className="receipt-button" href={`/api/admin/course-2/receipts/${item.id}`} target="_blank">مشاهده رسید</a>{item.status === "pending" && <><button className="approve" onClick={() => decide(item.id, "approved")}>تأیید</button><button className="reject" onClick={() => decide(item.id, "rejected")}>رد</button></>}{item.status === "approved" && (item.emailSentAt ? <span className="email-sent">ایمیل ارسال شده ✓</span> : <button disabled={emailBusy} onClick={() => emailAction({ action: "single", id: item.id })}>ارسال ایمیل تأیید</button>)}</div>
    </article>)}</div>
  </>;
}
