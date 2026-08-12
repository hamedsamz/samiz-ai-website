import { neon } from "@neondatabase/serverless";

export const CHALLENGE_CAPACITY = 30;
export const CHALLENGE_HOLD_MS = 24 * 60 * 60 * 1000;

export function challengeDb() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function ensureChallengeSchema() {
  const sql = challengeDb();
  await sql`CREATE TABLE IF NOT EXISTS calorie_challenge_registrations (
    id TEXT PRIMARY KEY, slot_id INTEGER NOT NULL, full_name TEXT NOT NULL, email TEXT NOT NULL,
    phone TEXT NOT NULL, receipt_name TEXT NOT NULL, receipt_type TEXT NOT NULL, receipt_data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', confirmation_email_sent_at BIGINT,
    created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS calorie_challenge_slots (id INTEGER PRIMARY KEY, registration_id TEXT UNIQUE, reserved_at BIGINT)`;
  await sql`CREATE INDEX IF NOT EXISTS calorie_challenge_email_idx ON calorie_challenge_registrations(email)`;
  await sql`CREATE INDEX IF NOT EXISTS calorie_challenge_phone_idx ON calorie_challenge_registrations(phone)`;
  await sql`INSERT INTO calorie_challenge_slots (id) SELECT generate_series(1, ${CHALLENGE_CAPACITY}) ON CONFLICT (id) DO NOTHING`;
}

export async function releaseExpiredChallengeHolds(now = Date.now()) {
  const sql = challengeDb(); const cutoff = now - CHALLENGE_HOLD_MS;
  await sql.transaction([
    sql`UPDATE calorie_challenge_registrations SET status = 'expired', updated_at = ${now} WHERE status = 'pending' AND created_at < ${cutoff}`,
    sql`UPDATE calorie_challenge_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id IN (SELECT id FROM calorie_challenge_registrations WHERE status IN ('expired', 'rejected'))`,
  ]);
}

export async function challengeCapacityStatus() {
  await ensureChallengeSchema(); await releaseExpiredChallengeHolds();
  const rows = await challengeDb()`SELECT COUNT(*)::int AS used FROM calorie_challenge_registrations WHERE status IN ('pending', 'approved')`;
  const used = Number(rows[0]?.used ?? 0);
  return { capacity: CHALLENGE_CAPACITY, used, remaining: Math.max(0, CHALLENGE_CAPACITY - used), full: used >= CHALLENGE_CAPACITY };
}
