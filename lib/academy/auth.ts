import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { academyEnabled, academyOrigin, normalizedEmail } from "./config";
import { academyPool } from "./pool";
import { hashAcademyOtp, matchesRegistration } from "./registration";

let auth: ReturnType<typeof createAcademyAuth> | undefined;

function createAcademyAuth() {
  const origin = academyOrigin()!;
  return betterAuth({
    appName: "SAMIZ AI Academy",
    baseURL: origin,
    secret: process.env.ACADEMY_AUTH_SECRET!,
    database: academyPool(),
    trustedOrigins: [origin],
    logger: { level: "error" },
    emailVerification: {
      async beforeEmailVerification(user, request) {
        // Only the browser that initiated this registration can verify its pending credentials.
        // Recovery on another device verifies email while replacing the password.
        if (!matchesRegistration(request, user.id)) {
          throw new APIError("BAD_REQUEST", { code: "REGISTRATION_BROWSER_REQUIRED" });
        }
      },
    },
    emailAndPassword: {
      enabled: true, requireEmailVerification: true, minPasswordLength: 12, maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    advanced: {
      cookiePrefix: "samiz-academy",
      useSecureCookies: origin.startsWith("https:"),
      ipAddress: { ipAddressHeaders: process.env.VERCEL === "1" ? ["x-forwarded-for"] : [] },
    },
    rateLimit: {
      enabled: true, storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 900, max: 6 },
        "/email-otp/send-verification-otp": { window: 900, max: 5 },
        "/email-otp/request-password-reset": { window: 900, max: 5 },
        "/email-otp/reset-password": { window: 900, max: 5 },
        "/email-otp/verify-email": { window: 900, max: 5 },
      },
    },
    plugins: [emailOTP({
      expiresIn: 600, otpLength: 6, allowedAttempts: 5, storeOTP: { hash: async otp => hashAcademyOtp(otp) },
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification" && type !== "forget-password") return;
        await deliverAcademyCode(email, otp, type);
      },
    })],
  });
}

async function deliverAcademyCode(email: string, otp: string, type: "email-verification" | "forget-password") {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Academy email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [email],
      subject: type === "forget-password" ? "کد بازیابی رمز آکادمی سمیز" : "کد تأیید ایمیل آکادمی سمیز",
      text: `کد آکادمی سمیز: ${otp}\nاین کد ۱۰ دقیقه اعتبار دارد. اگر این درخواست از طرف شما نیست، این پیام را نادیده بگیرید.`,
    }),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error("Academy email delivery failed");
}

export function academyAuth() {
  if (!academyEnabled()) return null;
  auth ??= createAcademyAuth();
  return auth;
}

export async function academyUser() {
  const auth = academyAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  const email = session?.user.emailVerified && normalizedEmail(session.user.email);
  if (!session?.user.id || !session.session.id || !email) return null;
  return { id: session.user.id, sessionId: session.session.id, email, name: session.user.name };
}

export async function requireAcademyUser() {
  if (!academyEnabled()) notFound();
  const user = await academyUser();
  if (!user) redirect("/academy/sign-in");
  return user;
}

export async function sameOriginMutation() {
  const origin = academyOrigin();
  return origin !== null && (await headers()).get("origin") === origin;
}
