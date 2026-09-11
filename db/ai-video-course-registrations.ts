import { db } from "./registrations";

export type AiVideoCourseLocation = "iran" | "international";

export async function ensureAiVideoCourseSchema() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS ai_video_course_registrations (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    telegram_username TEXT,
    paid_amount BIGINT NOT NULL,
    payment_currency TEXT NOT NULL,
    receipt_name TEXT NOT NULL,
    receipt_type TEXT NOT NULL,
    receipt_data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    confirmation_email_sent_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ai_video_course_registrations_phone_idx ON ai_video_course_registrations(phone)`;
  await sql`CREATE INDEX IF NOT EXISTS ai_video_course_registrations_email_idx ON ai_video_course_registrations(email)`;
  await sql`CREATE INDEX IF NOT EXISTS ai_video_course_registrations_status_idx ON ai_video_course_registrations(status)`;
}

export async function aiVideoCourseStats() {
  await ensureAiVideoCourseSchema();
  const rows = await db()`SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
    COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
    COUNT(*) FILTER (WHERE location = 'iran' AND status IN ('pending', 'approved'))::int AS iran,
    COUNT(*) FILTER (WHERE location = 'international' AND status IN ('pending', 'approved'))::int AS international
    FROM ai_video_course_registrations`;
  const row = rows[0] ?? {};
  return {
    pending: Number(row.pending ?? 0),
    approved: Number(row.approved ?? 0),
    iran: Number(row.iran ?? 0),
    international: Number(row.international ?? 0),
  };
}
