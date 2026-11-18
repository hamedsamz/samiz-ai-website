"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AI_VIDEO_COURSE_CARD_HOLDER } from "../../../lib/ai-video-course-config";
import "../video-course.css";

type Details = { fullName: string; dueAt: number; secondStatus: "pending" | "approved" | "rejected" | null; amount: number; cardNumber: string };
const format = new Intl.NumberFormat("fa-IR");

export default function SecondPaymentPage() {
  const token = useRef("");
  const [details, setDetails] = useState<Details | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const currentToken = new URLSearchParams(window.location.search).get("token") ?? "";
    token.current = currentToken;
    fetch(`/api/ai-video-course/second-payment?token=${encodeURIComponent(currentToken)}`, { cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setDetails(data); })
      .catch(cause => setError(cause instanceof Error ? cause.message : "دریافت اطلاعات پرداخت انجام نشد."));
  }, []);

  function selectReceipt(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file && (file.size > 2.5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type))) {
      event.currentTarget.value = "";
      setError("رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۲.۵ مگابایت باشد.");
      setFileName("");
      return;
    }
    setFileName(file?.name ?? "");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      data.set("token", token.current);
      const response = await fetch("/api/ai-video-course/second-payment", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ارسال رسید انجام نشد.");
      setMessage(result.message);
      setDetails(previous => previous ? { ...previous, secondStatus: "pending" } : previous);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ارسال رسید انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="avc-page avc-second-page" dir="rtl"><section className="avc-form-card">
    <p className="avc-section-label">SAMIZ AI ACADEMY</p><h1>پرداخت قسط دوم دوره ساخت ویدیو</h1>
    {!details && !error && <p>در حال دریافت اطلاعات پرداخت…</p>}
    {error && <p className="avc-message error" role="alert">{error}</p>}
    {details && <>
      <p>{details.fullName} عزیز، مبلغ قسط دوم <strong>{format.format(details.amount)} تومان</strong> است. موعد پرداخت: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(details.dueAt)}.</p>
      {details.secondStatus === "approved" ? <p className="avc-message success">قسط دوم تأیید شده و ثبت‌نام شما تسویه شده است.</p> : details.secondStatus === "pending" ? <p className="avc-message success">رسید شما دریافت شده و در انتظار بررسی است.</p> : <>
        {details.secondStatus === "rejected" && <p className="avc-message error">رسید قبلی تأیید نشده است. می‌توانید رسید جدید بارگذاری کنید.</p>}
        <div className="avc-payment-card iran"><p>مبلغ {format.format(details.amount)} تومان را به کارت زیر واریز کنید.</p><div className="avc-card-number" dir="ltr"><code>{details.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}</code><button type="button" onClick={() => navigator.clipboard.writeText(details.cardNumber)}>کپی شماره کارت</button></div><small className="avc-holder">به نام {AI_VIDEO_COURSE_CARD_HOLDER}</small></div>
        <form onSubmit={submit}><div className="avc-field full"><label htmlFor="secondReceipt">رسید قسط دوم</label><label className="avc-upload" htmlFor="secondReceipt"><span>{fileName || "انتخاب رسید"}</span><small>JPG، PNG، WEBP یا PDF — حداکثر ۲.۵ مگابایت</small></label><input className="avc-file-input" id="secondReceipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={selectReceipt} /></div><button className="avc-submit" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال رسید قسط دوم"}</button></form>
      </>}
      {message && <p className="avc-message success" role="status">{message}</p>}
    </>}
  </section></main>;
}
