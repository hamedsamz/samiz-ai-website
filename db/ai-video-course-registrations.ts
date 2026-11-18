import { db } from "./registrations";
import { AI_VIDEO_SUPPORT_CAPACITY } from "../lib/ai-video-course-config";

export type AiVideoCourseLocation = "iran" | "international";

export async function ensureAiVideoCourseSchema() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS ai_video_course_registrations (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    plan TEXT,
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
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS plan TEXT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS payment_option TEXT NOT NULL DEFAULT 'full'`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS total_amount BIGINT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS first_paid_at BIGINT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS second_due_at BIGINT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS second_receipt_name TEXT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS second_receipt_type TEXT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS second_receipt_data TEXT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS second_status TEXT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS second_paid_at BIGINT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS payment_token TEXT`;
  await sql`ALTER TABLE ai_video_course_registrations ADD COLUMN IF NOT EXISTS seat_number INTEGER`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ai_video_course_seat_idx ON ai_video_course_registrations(seat_number) WHERE plan = 'with-support' AND seat_number IS NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ai_video_course_payment_token_idx ON ai_video_course_registrations(payment_token) WHERE payment_token IS NOT NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ai_video_course_current_phone_idx
    ON ai_video_course_registrations(phone) WHERE plan IS NOT NULL AND status IN ('pending', 'approved')`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ai_video_course_current_email_idx
    ON ai_video_course_registrations(email) WHERE plan IS NOT NULL AND status IN ('pending', 'approved')`;
  await sql`CREATE INDEX IF NOT EXISTS ai_video_course_registrations_phone_idx ON ai_video_course_registrations(phone)`;
  await sql`CREATE INDEX IF NOT EXISTS ai_video_course_registrations_email_idx ON ai_video_course_registrations(email)`;
  await sql`CREATE INDEX IF NOT EXISTS ai_video_course_registrations_status_idx ON ai_video_course_registrations(status)`;
}

export async function aiVideoSupportCapacity() {
  await ensureAiVideoCourseSchema();
  const rows = await db()`SELECT COUNT(*)::int AS used FROM ai_video_course_registrations WHERE plan = 'with-support' AND status = 'approved'`;
  const used = Number(rows[0]?.used ?? 0);
  return { capacity: AI_VIDEO_SUPPORT_CAPACITY, used, remaining: Math.max(0, AI_VIDEO_SUPPORT_CAPACITY - used), full: used >= AI_VIDEO_SUPPORT_CAPACITY };
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
