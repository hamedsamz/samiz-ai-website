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
const formatNumber = (value: number, maximumFractionDigits = 0) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits }).format(value);

function countValues(values: string[]) {
  return Array.from(values.reduce((counts, value) => {
    const cleanValue = value.trim().replace(/\s+/g, " ");
    if (cleanValue) counts.set(cleanValue, (counts.get(cleanValue) ?? 0) + 1);
    return counts;
  }, new Map<string, number>())).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fa"));
}

function StatBars({ rows, total }: { rows: [string, number][]; total: number }) {
  if (!rows.length) return <p className="demographic-empty">هنوز داده‌ای ثبت نشده است.</p>;
  const highest = Math.max(...rows.map(([, count]) => count), 1);
  return <div className="demographic-bars">{rows.map(([label, count]) => <div className="demographic-row" key={label}>
    <div className="demographic-label"><span>{label}</span><b>{formatNumber(count)} نفر <small>({formatNumber(total ? count * 100 / total : 0, 1)}٪)</small></b></div>
    <div className="demographic-track"><span style={{ width: `${count * 100 / highest}%` }} /></div>
  </div>)}</div>;
}

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
  const approvedItems = useMemo(() => items.filter(item => item.status === "approved"), [items]);
  const visibleItems = useMemo(() => filter === "all" ? items : items.filter(item => item.paymentType === filter), [filter, items]);
  const demographics = useMemo(() => {
    const ages = approvedItems.map(item => Number(item.age)).filter(age => Number.isFinite(age));
    const ageGroups = ([
      ["کمتر از ۲۰ سال", ages.filter(age => age < 20).length],
      ["۲۰ تا ۲۹ سال", ages.filter(age => age >= 20 && age < 30).length],
      ["۳۰ تا ۳۹ سال", ages.filter(age => age >= 30 && age < 40).length],
      ["۴۰ تا ۴۹ سال", ages.filter(age => age >= 40 && age < 50).length],
      ["۵۰ سال و بیشتر", ages.filter(age => age >= 50).length],
    ] as [string, number][]).filter(([, count]) => count > 0);
    return {
      averageAge: ages.length ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0,
      minimumAge: ages.length ? Math.min(...ages) : 0,
      maximumAge: ages.length ? Math.max(...ages) : 0,
      ageGroups,
      education: countValues(approvedItems.map(item => item.education)),
      occupations: countValues(approvedItems.map(item => item.occupation)).slice(0, 10),
      specialties: countValues(approvedItems.map(item => item.specialty?.trim() || "بدون تخصص ثبت‌شده")).slice(0, 10),
    };
  }, [approvedItems]);

  if (authorized === false) return <form className="admin-login" onSubmit={login}><h2>ورود مدیر</h2><p>رمز مدیریت را وارد کنید.</p><input name="password" type="password" required placeholder="رمز مدیریت" /><button className="gold-button">ورود به پنل</button>{loginError && <p className="form-message error">{loginError}</p>}</form>;
  return <>
    <div className="admin-stats course2-stats"><div><span>در انتظار بررسی</span><strong>{pending}</strong></div><div><span>تأییدشده از ۱۰۰ نفر</span><strong>{approved}</strong></div><div><span>ثبت‌شده خیریه</span><strong>{capacity?.charityUsed ?? "—"} / ۲۰</strong></div><div><span>مبلغ خیریه تأییدشده</span><strong>{capacity ? `${formatToman(capacity.charityApprovedTotal)} تومان` : "—"}</strong></div></div>

    <section className="demographic-section">
      <div className="demographic-heading"><div><p className="eyebrow">آمار زنده افراد تأییدشده</p><h2>سن، تحصیلات، شغل و تخصص</h2></div><span>بر اساس {formatNumber(approvedItems.length)} نفر تأییدشده</span></div>
      <div className="age-summary">
        <div><span>میانگین سن</span><strong>{demographics.averageAge ? formatNumber(demographics.averageAge, 1) : "—"}</strong><small>سال</small></div>
        <div><span>کمترین سن</span><strong>{demographics.minimumAge ? formatNumber(demographics.minimumAge) : "—"}</strong><small>سال</small></div>
        <div><span>بیشترین سن</span><strong>{demographics.maximumAge ? formatNumber(demographics.maximumAge) : "—"}</strong><small>سال</small></div>
      </div>
      <div className="demographic-grid">
        <article><h3>گروه‌های سنی</h3><StatBars rows={demographics.ageGroups} total={approvedItems.length} /></article>
        <article><h3>میزان تحصیلات</h3><StatBars rows={demographics.education} total={approvedItems.length} /></article>
        <article><h3>پرتکرارترین شغل‌ها</h3><StatBars rows={demographics.occupations} total={approvedItems.length} /></article>
        <article><h3>پرتکرارترین تخصص‌ها</h3><StatBars rows={demographics.specialties} total={approvedItems.length} /></article>
      </div>
    </section>

    <section className="email-tools"><h2>ارسال ایمیل تأیید دوره جدید</h2><p>تا قبل از تنظیم لینک کانال تلگرام جدید، ارسال ایمیل غیرفعال می‌ماند و پیام خطا نمایش داده می‌شود.</p><div className="email-tool-grid"><form onSubmit={testEmail}><h3>۱. ارسال آزمایشی</h3><input name="email" type="email" required placeholder="ایمیل خودت" /><button disabled={emailBusy}>ارسال آزمایشی</button></form><div><h3>۲. افراد تأییدشده سایت</h3><button className="bulk-email" disabled={emailBusy} onClick={bulkEmail}>ارسال به همه افراد ارسال‌نشده</button></div><form onSubmit={manualEmail}><h3>۳. ثبت‌نام خارج از سایت</h3><input name="fullName" required placeholder="نام و نام خانوادگی" /><input name="email" type="email" required placeholder="ایمیل" /><button disabled={emailBusy}>ارسال و ثبت</button></form></div>{emailMessage && <p className="email-result">{emailMessage}</p>}</section>

    <div className="admin-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>همه ({items.length})</button><button className={filter === "charity" ? "active" : ""} onClick={() => setFilter("charity")}>خیریه ({items.filter(x => x.paymentType === "charity").length})</button><button className={filter === "card" ? "active" : ""} onClick={() => setFilter("card")}>پرداخت کارت ({items.filter(x => x.paymentType === "card").length})</button></div>
    <div className="admin-list">{loading ? <p>در حال دریافت اطلاعات…</p> : visibleItems.length === 0 ? <p>درخواستی در این بخش وجود ندارد.</p> : visibleItems.map(item => <article key={item.id} className="admin-item course2-admin-item">
      <div className="admin-person"><div className="item-badges"><span className={`status ${item.status}`}>{labels[item.status]}</span><span className={`payment-badge ${item.paymentType}`}>{item.paymentType === "charity" ? "خیریه" : "پرداخت کارت"}</span><span className="slot-badge">ظرفیت {item.slotId}</span></div><h2>{item.fullName}</h2><a href={`tel:${item.phone}`}>{item.phone}</a><a className="admin-email" href={`mailto:${item.email}`}>{item.email}</a><small>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(item.createdAt)}</small></div>
      <div className="registration-profile"><span><b>سن:</b> {item.age}</span><span><b>تحصیلات:</b> {item.education}</span><span><b>تخصص:</b> {item.specialty || "—"}</span><span><b>شغل:</b> {item.occupation}</span>{item.paymentType === "charity" && <><span><b>خیریه:</b> {item.charityName}</span><span><b>مبلغ:</b> {formatToman(Number(item.paidAmount))} تومان</span></>}</div>
      <div className="admin-actions"><a className="receipt-button" href={`/api/admin/course-2/receipts/${item.id}`} target="_blank">مشاهده رسید</a>{item.status === "pending" && <><button className="approve" onClick={() => decide(item.id, "approved")}>تأیید</button><button className="reject" onClick={() => decide(item.id, "rejected")}>رد</button></>}{item.status === "approved" && (item.emailSentAt ? <span className="email-sent">ایمیل ارسال شده ✓</span> : <button disabled={emailBusy} onClick={() => emailAction({ action: "single", id: item.id })}>ارسال ایمیل تأیید</button>)}</div>
    </article>)}</div>
  </>;
}
