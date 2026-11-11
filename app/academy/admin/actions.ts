"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { verify } from "otplib";
import { academyOrigin, normalizedEmail, validId } from "@/lib/academy/config";
import { adminIdentity, requireAcademyAdmin } from "@/lib/academy/admin";
import { sameOriginMutation } from "@/lib/academy/auth";
import { academyDb, invitationHash, withCourseLock } from "@/lib/academy/db";
import { lessonFilesReady } from "@/lib/academy/media";

type ActionState = { error?: string; message?: string; link?: string };
const invalid = { error: "اطلاعات فرم معتبر نیست." };

export async function unlockAdmin(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!await sameOriginMutation()) return invalid;
  const user = await adminIdentity();
  if (!user) return invalid;

  const code = String(form.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return invalid;

  const sql = academyDb();
  try {
    const [attempt] = await sql`INSERT INTO academy.admin_totp AS t (user_id, bucket, attempts)
      VALUES (${user.id}, floor(extract(epoch from now()) / 900)::bigint, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        attempts = CASE WHEN t.bucket = excluded.bucket THEN t.attempts + 1 ELSE 1 END,
        bucket = excluded.bucket
      WHERE t.bucket <> excluded.bucket OR t.attempts < 8
      RETURNING last_step`;
    if (!attempt) return { error: "تعداد تلاش‌ها به سقف رسید. کمی بعد دوباره امتحان کن." };

    const result = await verify({ secret: process.env.ACADEMY_ADMIN_TOTP_SECRET!, token: code,
      epochTolerance: 30, afterTimeStep: Number(attempt.last_step) >= 0 ? Number(attempt.last_step) : undefined });
    if (!result.valid || !("timeStep" in result)) return { error: "کد پذیرفته نشد. کد تازه را وارد کن." };

    const rows = await sql`WITH verified AS (
      UPDATE academy.admin_totp SET last_step = ${result.timeStep}
      WHERE user_id = ${user.id} AND last_step < ${result.timeStep} RETURNING user_id
    )
    INSERT INTO academy.admin_sessions (user_id, session_id, expires_at)
      SELECT user_id, ${user.sessionId}, now() + interval '15 minutes' FROM verified
    ON CONFLICT (user_id) DO UPDATE SET session_id = excluded.session_id, expires_at = excluded.expires_at
    RETURNING user_id`;
    if (rows.length !== 1) return { error: "کد پذیرفته نشد. کد تازه را وارد کن." };
  } catch {
    return { error: "تأیید مدیر انجام نشد." };
  }
  revalidatePath("/academy/admin");
  return { message: "دسترسی مدیریت فعال شد." };
}

export async function editAcademy(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!await sameOriginMutation()) return invalid;
  const admin = await requireAcademyAdmin();
  const operation = form.get("operation");
  const course = String(form.get("course") ?? "");
  const item = String(form.get("item") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const sql = academyDb();

  try {
    switch (operation) {
      case "course":
        if (!title || title.length > 160) return invalid;
        await sql`INSERT INTO academy.courses (title) VALUES (${title})`;
        break;
      case "lesson": {
        const position = Number(form.get("position"));
        if (!validId(course) || !title || title.length > 160 ||
            !Number.isInteger(position) || position < 1 || position > 10000) return invalid;
        const rows = await sql`INSERT INTO academy.lessons (course_id, title, position)
          VALUES (${course}, ${title}, ${position}) ON CONFLICT (course_id, position) DO NOTHING RETURNING id`;
        if (!rows.length) return { error: "این شماره قبلاً برای یک جلسه استفاده شده." };
        break;
      }
      case "publish":
      case "unpublish": {
        if (!validId(item)) return invalid;
        const publish = operation === "publish";
        if (publish && !await lessonFilesReady(item)) {
          return { error: "فایل‌های پخش این جلسه در فضای خصوصی پیدا یا تأیید نشدند." };
        }
        await sql`WITH updated AS (
          UPDATE academy.lessons SET published = ${publish} WHERE id = ${item} AND published <> ${publish} RETURNING course_id
        ) INSERT INTO academy.audit (actor_id, course_id, event, subject)
          SELECT ${admin.id}, course_id, ${operation}, ${item} FROM updated`;
        break;
      }
      case "invite": {
        const email = normalizedEmail(String(form.get("email") ?? ""));
        const origin = academyOrigin();
        if (!validId(course) || !email || !origin) return invalid;
        const token = randomBytes(32).toString("base64url");
        const rows = await withCourseLock(course, locked => locked`WITH invitation AS (
          INSERT INTO academy.invitations (course_id, email, token_hash)
          SELECT ${course}::uuid, ${email}, ${invitationHash(token)} WHERE NOT EXISTS (
            SELECT 1 FROM academy.enrollments WHERE course_id = ${course} AND email = ${email}
          )
          ON CONFLICT (course_id, email) DO UPDATE
            SET token_hash = excluded.token_hash, expires_at = excluded.expires_at
          RETURNING id, course_id
        ) INSERT INTO academy.audit (actor_id, course_id, event, subject)
          SELECT ${admin.id}, course_id, 'invite', id::text FROM invitation RETURNING id`);
        if (!rows.length) return { error: "این هنرجو همین حالا به دوره دسترسی دارد." };
        revalidatePath("/academy/admin");
        return { message: "دعوت‌نامه برای ۷ روز صادر شد. لینک را برای همین هنرجو بفرست.",
          link: `${origin}/academy/invite#${token}` };
      }
      case "cancel-invite":
        if (!validId(item)) return invalid;
        await sql`WITH cancelled AS (DELETE FROM academy.invitations WHERE id = ${item} RETURNING course_id)
          INSERT INTO academy.audit (actor_id, course_id, event, subject)
          SELECT ${admin.id}, course_id, 'cancel-invite', ${item} FROM cancelled`;
        break;
      case "revoke":
        if (!validId(course) || !item || item.length > 128) return invalid;
        await withCourseLock(course, locked => locked`WITH revoked AS (
          DELETE FROM academy.enrollments WHERE course_id = ${course} AND user_id = ${item} RETURNING course_id, email
        ), cancelled AS (
          DELETE FROM academy.invitations i USING revoked r
          WHERE i.course_id = r.course_id AND i.email = r.email
        ) INSERT INTO academy.audit (actor_id, course_id, event, subject)
          SELECT ${admin.id}, course_id, 'revoke', ${item} FROM revoked`);
        break;
      default:
        return invalid;
    }
  } catch {
    return { error: "تغییر ذخیره نشد. دوباره تلاش کن." };
  }
  revalidatePath("/academy/admin");
  return { message: "تغییر ذخیره شد." };
}
