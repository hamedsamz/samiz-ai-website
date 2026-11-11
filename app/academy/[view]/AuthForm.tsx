"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const auth = createAuthClient({ plugins: [emailOTPClient()] });
type View = "sign-in" | "sign-up" | "recover";
type Stage = "initial" | "verify" | "reset";

export function AuthForm({ view, invited }: { view: View; invited: boolean }) {
  const [stage, setStage] = useState<Stage>("initial");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const next = invited ? "/academy/invite" : "/academy";
  const suffix = invited ? "?invite=1" : "";
  const title = stage === "verify" ? "تأیید ایمیل" : stage === "reset" ? "انتخاب رمز تازه"
    : view === "sign-up" ? "ساخت حساب هنرجو" : view === "recover" ? "بازیابی رمز" : "ورود به آکادمی";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const otp = String(data.get("otp") ?? "").trim();
    setPending(true);
    setError("");
    setStatus("");
    try {
      if (stage === "verify") {
        const result = await auth.emailOtp.verifyEmail({ email, otp });
        if (result.error) {
          setError(result.error.code === "REGISTRATION_BROWSER_REQUIRED"
            ? "تأیید را در مرورگری که ثبت‌نام کردی انجام بده یا از بازیابی رمز استفاده کن."
            : "کد تأیید معتبر نیست یا منقضی شده.");
          return;
        }
        window.location.replace("/academy/sign-in" + suffix);
      } else if (stage === "reset") {
        const result = await auth.emailOtp.resetPassword({ email, otp, password });
        if (result.error) { setError("کد یا رمز پذیرفته نشد. کد تازه بگیر و دوباره امتحان کن."); return; }
        window.location.replace("/academy/sign-in" + suffix);
      } else if (view === "recover") {
        await auth.emailOtp.requestPasswordReset({ email });
        setStage("reset");
        setStatus("اگر حسابی با این ایمیل وجود داشته باشد، کد بازیابی ارسال می‌شود.");
      } else if (view === "sign-up") {
        const result = await auth.signUp.email({ email, password, name: String(data.get("name")).trim() });
        if (result.error && result.error.status !== 422) { setError("ثبت‌نام انجام نشد. اطلاعات را بررسی کن و دوباره تلاش کن."); return; }
        setStage("verify");
        setStatus("اگر این ایمیل نیاز به تأیید داشته باشد، کد تأیید ارسال می‌شود.");
      } else {
        const result = await auth.signIn.email({ email, password });
        if (result.error?.code === "EMAIL_NOT_VERIFIED" || (result.data?.user && !result.data.user.emailVerified)) {
          setStage("verify");
          await auth.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
          setStatus("کد تأیید را در ایمیلت بررسی کن.");
          return;
        }
        if (result.error) { setError("ایمیل یا رمز پذیرفته نشد. دوباره تلاش کن."); return; }
        window.location.assign(next);
      }
    } catch {
      setError("درخواست انجام نشد. کمی بعد دوباره تلاش کن.");
    } finally {
      setPending(false);
    }
  }

  return <section className="academy-card academy-narrow">
    <p className="academy-kicker">حساب هنرجو</p>
    <h1>{title}</h1>
    <form className="academy-form" onSubmit={submit}>
      {stage === "initial" && view === "sign-up" && <label>نام<input name="name" autoComplete="name" maxLength={100} required /></label>}
      <label>ایمیل<input name="email" type="email" dir="ltr" autoComplete="email" value={email}
        onChange={event => setEmail(event.target.value)} readOnly={stage !== "initial"} maxLength={254} required /></label>
      {stage !== "initial" && <label>کد ایمیل<input name="otp" dir="ltr" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /></label>}
      {(stage === "reset" || (stage === "initial" && view !== "recover")) && <label>رمز عبور
        <input key={stage + view} name="password" type="password" dir="ltr"
          autoComplete={view === "sign-in" ? "current-password" : "new-password"}
          minLength={view === "sign-in" ? undefined : 12} maxLength={128} required />
        {view !== "sign-in" && <small className="academy-muted">حداقل ۱۲ کاراکتر</small>}
      </label>}
      {error && <p className="academy-error" role="alert">{error}</p>}
      {status && <p className="academy-status" role="status">{status}</p>}
      <button className="academy-button" disabled={pending}>{pending ? "در حال ارسال…" : title}</button>
      {stage === "verify" && <button type="button" className="academy-button secondary" disabled={pending} onClick={async () => {
        setPending(true);
        setError("");
        try {
          await auth.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
          setStatus("اگر این ایمیل نیاز به تأیید داشته باشد، کد تازه ارسال می‌شود.");
        } catch { setError("درخواست انجام نشد. کمی بعد دوباره تلاش کن."); }
        finally { setPending(false); }
      }}>ارسال دوبارهٔ کد تأیید</button>}
      {stage !== "initial" && <button type="button" className="academy-button secondary"
        onClick={() => { setStage("initial"); setError(""); setStatus(""); }}>بازگشت و درخواست دوباره</button>}
    </form>
    {view === "sign-up" && <p className="academy-muted">برای مدیریت حساب و دسترسی دوره، نام و ایمیل شما ذخیره می‌شود. ایمیل برای ارسال کد تأیید و بازیابی به سرویس ارسال ایمیل داده می‌شود.</p>}
    <div className="academy-links">
      {view !== "sign-in" && <Link href={"/academy/sign-in" + suffix}>ورود</Link>}
      {view !== "sign-up" && <Link href={"/academy/sign-up" + suffix}>ثبت‌نام</Link>}
      {view !== "recover" && <Link href={"/academy/recover" + suffix}>بازیابی رمز</Link>}
    </div>
  </section>;
}
