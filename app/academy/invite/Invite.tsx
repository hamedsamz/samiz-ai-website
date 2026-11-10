"use client";

import Link from "next/link";
import { useState } from "react";
import { redeemInvitation } from "./actions";

const key = "samiz-academy-invitation";

export function Invite({ verifiedEmail }: { verifiedEmail: string | null }) {
  const [status, setStatus] = useState("");

  function saveInvitation() {
    const hash = window.location.hash.slice(1);
    if (/^[A-Za-z0-9_-]{43}$/.test(hash)) {
      sessionStorage.setItem(key, hash);
      window.history.replaceState(null, "", window.location.pathname);
    }
    return sessionStorage.getItem(key) ?? "";
  }

  return <section className="academy-card academy-narrow">
    <p className="academy-kicker">دعوت‌نامهٔ هنرجو</p><h1>فعال‌سازی دسترسی دوره</h1>
    {verifiedEmail ? <>
      <p>حساب فعلی <bdi>{verifiedEmail}</bdi> است. دعوت‌نامه باید برای همین ایمیل صادر شده باشد.</p>
      <button className="academy-button" disabled={status === "working"} onClick={async () => {
        setStatus("working");
        try {
          const token = saveInvitation();
          if (token && await redeemInvitation(token)) {
            sessionStorage.removeItem(key);
            window.location.replace("/academy");
          } else setStatus("invalid");
        } catch { setStatus("invalid"); }
      }}>{status === "working" ? "در حال بررسی…" : "پذیرش دعوت‌نامه"}</button>
      {status === "invalid" && <p className="academy-error" role="alert">دعوت‌نامه قابل فعال‌سازی نیست. ایمیل حساب، اعتبار لینک یا دسترسی فعلی در «دوره‌های من» را بررسی کن.</p>}
      <div className="academy-links"><Link href="/academy/sign-in?invite=1" onClick={saveInvitation}>ورود با حساب دیگر</Link></div>
    </> : <>
      <p>با همون ایمیلی که دعوت‌نامه برایش صادر شده، وارد شو یا حساب تازه بساز.</p>
      <div className="academy-links">
        <Link className="academy-button" href="/academy/sign-in?invite=1" onClick={saveInvitation}>ورود</Link>
        <Link className="academy-button secondary" href="/academy/sign-up?invite=1" onClick={saveInvitation}>ثبت‌نام</Link>
      </div>
    </>}
  </section>;
}
