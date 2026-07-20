import { neon } from "@neondatabase/serverless";

export const CAPACITY = 40;
export const HOLD_MS = 24 * 60 * 60 * 1000;

export function db() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function ensureRegistrationSchema() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS registrations (id TEXT PRIMARY KEY, slot_id INTEGER NOT NULL UNIQUE, full_name TEXT NOT NULL, phone TEXT NOT NULL, receipt_name TEXT NOT NULL, receipt_type TEXT NOT NULL, receipt_data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL)`;
  await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`CREATE TABLE IF NOT EXISTS registration_slots (id INTEGER PRIMARY KEY, registration_id TEXT UNIQUE, reserved_at BIGINT)`;
  await sql`CREATE INDEX IF NOT EXISTS registrations_phone_idx ON registrations(phone)`;
  await sql`INSERT INTO registration_slots (id) SELECT generate_series(1, ${CAPACITY}) ON CONFLICT (id) DO NOTHING`;
}

export async function releaseExpiredHolds(now = Date.now()) {
  const sql = db();
  const cutoff = now - HOLD_MS;
  await sql.transaction([
    sql`UPDATE registrations SET status = 'expired', updated_at = ${now} WHERE status = 'pending' AND created_at < ${cutoff}`,
    sql`UPDATE registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id IN (SELECT id FROM registrations WHERE status IN ('expired', 'rejected'))`,
  ]);
}

export async function capacityStatus() {
  await ensureRegistrationSchema();
  await releaseExpiredHolds();
  const rows = await db()`SELECT COUNT(*)::int AS used FROM registrations WHERE status IN ('pending', 'approved')`;
  const used = Number(rows[0]?.used ?? 0);
  return { capacity: CAPACITY, used, remaining: Math.max(0, CAPACITY - used), full: used >= CAPACITY };
}
