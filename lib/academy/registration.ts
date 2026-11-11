import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { academyOrigin } from "./config";

const lifetime = 30 * 60;

function secure() {
  return academyOrigin()?.startsWith("https:") === true;
}

function cookieName() {
  return secure() ? "__Host-samiz-academy-registration" : "samiz-academy-registration";
}

function sign(value: string) {
  return createHmac("sha256", process.env.ACADEMY_AUTH_SECRET!).update(value).digest("base64url");
}

export function hashAcademyOtp(otp: string) {
  return sign(`email-otp:${otp}`);
}

export function registrationCookie(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + lifetime;
  const signature = sign(`registration:${userId}:${expires}`);
  return `${cookieName()}=${expires}.${signature}; Max-Age=${lifetime}; Path=/; HttpOnly; SameSite=Strict${secure() ? "; Secure" : ""}`;
}

export function matchesRegistration(request: Request | undefined, userId: string) {
  const cookie = request?.headers.get("cookie")?.split(";")
    .map(value => value.trim()).find(value => value.startsWith(cookieName() + "="));
  const value = cookie?.slice(cookieName().length + 1);
  if (!value || !/^\d{10,12}\.[A-Za-z0-9_-]{43}$/.test(value)) return false;

  const [expires, supplied] = value.split(".");
  const now = Math.floor(Date.now() / 1000);
  if (Number(expires) <= now || Number(expires) > now + lifetime) return false;
  const expected = sign(`registration:${userId}:${expires}`);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
