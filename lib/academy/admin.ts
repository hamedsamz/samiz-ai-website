import "server-only";
import { notFound } from "next/navigation";
import { academyUser } from "./auth";
import { academyDb } from "./db";

export async function adminIdentity() {
  const id = process.env.ACADEMY_ADMIN_USER_ID;
  if (!id || !process.env.ACADEMY_ADMIN_TOTP_SECRET) return null;
  const user = await academyUser();
  return user?.id === id ? user : null;
}

export async function adminIsElevated(user: NonNullable<Awaited<ReturnType<typeof adminIdentity>>>) {
  const rows = await academyDb()`SELECT 1 FROM academy.admin_sessions
    WHERE user_id = ${user.id} AND session_id = ${user.sessionId} AND expires_at > now()`;
  return rows.length === 1;
}

export async function requireAcademyAdmin() {
  const user = await adminIdentity();
  if (!user || !await adminIsElevated(user)) notFound();
  return user;
}
