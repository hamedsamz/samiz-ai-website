import "server-only";

export function academyOrigin() {
  const value = process.env.ACADEMY_ORIGIN;
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = url.hostname === "localhost" && process.env.VERCEL !== "1";
    return (url.protocol === "https:" || (local && url.protocol === "http:")) && url.origin === value
      ? url.origin : null;
  } catch {
    return null;
  }
}

export function academyEnabled() {
  return Boolean(
    process.env.ACADEMY_ENABLED === "true" &&
    academyOrigin() &&
    process.env.ACADEMY_DATABASE_URL &&
    (process.env.ACADEMY_AUTH_SECRET?.length ?? 0) >= 32,
  );
}

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

export function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

export function normalizedEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : null;
}
