"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Registration = { id: string; slotId: number; fullName: string; phone: string; email: string | null; receiptName: string; receiptType: string; status: "pending" | "approved" | "rejected" | "expired"; createdAt: number };
const labels = { pending: "در انتظار", approved: "تأیید شده", rejected: "رد شده", expired: "منقضی شده" };

export default function AdminPanel() {
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState("");
  const load = useCallback(async () => { setLoading(true); const response = await fetch("/api/admin/registrations", { cache: "no-store" }); const data = await response.json(); setAuthorized(response.ok); setItems(data.registrations ?? []); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  async function login(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoginError(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) }); if (!response.ok) { const data = await response.json(); setLoginError(data.error ?? "ورود انجام نشد."); return; } await load(); }
  async function decide(id: string, status: "approved" | "rejected") { await fetch(`/api/admin/registrations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); await load(); }
  const pending = items.filter(x => x.status === "pending").length;
  const approved = items.filter(x => x.status === "approved").length;
  if (authorized === false) return <form className="admin-login" onSubmit={login}><h2>ورود مدیر</h2><p>رمز مدیریت را وارد کنید.</p><input name="password" type="password" required placeholder="رمز مدیریت" /><button className="gold-button">ورود به پنل</button>{loginError && <p className="form-message error">{loginError}</p>}</form>;
  return <>
    <div className="admin-stats"><div><span>در انتظار بررسی</span><strong>{pending}</strong></div><div><span>تأییدشده از ۵۰ نفر</span><strong>{approved}</strong></div><div><span>کل درخواست‌ها</span><strong>{items.length}</strong></div></div>
    <div className="admin-list">{loading ? <p>در حال دریافت اطلاعات…</p> : items.length === 0 ? <p>هنوز درخواستی ثبت نشده است.</p> : items.map(item => <article key={item.id} className="admin-item">
      <div className="admin-person"><span className={`status ${item.status}`}>{labels[item.status]}</span><h2>{item.fullName}</h2><a href={`tel:${item.phone}`}>{item.phone}</a>{item.email && <a className="admin-email" href={`mailto:${item.email}`}>{item.email}</a>}<small>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(item.createdAt)}</small></div>
      <div className="admin-actions"><a className="receipt-button" href={`/api/admin/receipts/${item.id}`} target="_blank">مشاهده رسید</a>{item.status === "pending" && <><button className="approve" onClick={() => decide(item.id, "approved")}>تأیید</button><button className="reject" onClick={() => decide(item.id, "rejected")}>رد</button></>}</div>
    </article>)}</div>
  </>;
}
