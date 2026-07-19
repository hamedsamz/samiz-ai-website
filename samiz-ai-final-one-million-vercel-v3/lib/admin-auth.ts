import { cookies } from "next/headers";

const COOKIE_NAME = "samiz_admin";

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function signature() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("samiz-admin-session-v1")));
}

export async function isAdmin() {
  const expected = await signature();
  const actual = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

export async function createAdminSession() {
  (await cookies()).set(COOKIE_NAME, await signature(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 43200 });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
