import { db } from "./registrations";

export const COURSE2_CAPACITY = 100;
export const COURSE2_CHARITY_CAPACITY = 20;
export const COURSE2_FEE_TOMAN = 2_000_000;
export const COURSE2_HOLD_MS = 24 * 60 * 60 * 1000;

export type Course2PaymentType = "charity" | "card";

export async function ensureCourse2Schema() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS course2_registrations (
    id TEXT PRIMARY KEY,
    slot_id INTEGER NOT NULL UNIQUE,
    payment_type TEXT NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    education TEXT NOT NULL,
    specialty TEXT,
    occupation TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    charity_name TEXT,
    paid_amount BIGINT NOT NULL,
    receipt_name TEXT NOT NULL,
    receipt_type TEXT NOT NULL,
    receipt_data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    confirmation_email_sent_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS course2_registration_slots (id INTEGER PRIMARY KEY, registration_id TEXT UNIQUE, reserved_at BIGINT)`;
  await sql`CREATE TABLE IF NOT EXISTS course2_external_confirmation_emails (email TEXT PRIMARY KEY, full_name TEXT NOT NULL, sent_at BIGINT NOT NULL)`;
  await sql`CREATE INDEX IF NOT EXISTS course2_registrations_phone_idx ON course2_registrations(phone)`;
  await sql`CREATE INDEX IF NOT EXISTS course2_registrations_email_idx ON course2_registrations(email)`;
  await sql`INSERT INTO course2_registration_slots (id) SELECT generate_series(1, ${COURSE2_CAPACITY}) ON CONFLICT (id) DO NOTHING`;
}

export async function releaseExpiredCourse2Holds(now = Date.now()) {
  const sql = db();
  const cutoff = now - COURSE2_HOLD_MS;
  await sql.transaction([
    sql`UPDATE course2_registrations SET status = 'expired', updated_at = ${now} WHERE status = 'pending' AND created_at < ${cutoff}`,
    sql`UPDATE course2_registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id IN (SELECT id FROM course2_registrations WHERE status IN ('expired', 'rejected'))`,
  ]);
}

export async function course2CapacityStatus() {
  await ensureCourse2Schema();
  await releaseExpiredCourse2Holds();
  const rows = await db()`SELECT
    COUNT(*) FILTER (WHERE slot_id <= ${COURSE2_CHARITY_CAPACITY} AND status IN ('pending', 'approved'))::int AS "charityUsed",
    COUNT(*) FILTER (WHERE slot_id > ${COURSE2_CHARITY_CAPACITY} AND status IN ('pending', 'approved'))::int AS "cardUsed",
    COUNT(*) FILTER (WHERE status IN ('pending', 'approved'))::int AS used,
    COUNT(*) FILTER (WHERE slot_id <= ${COURSE2_CHARITY_CAPACITY} AND status = 'approved')::int AS "charityApproved",
    COALESCE(SUM(paid_amount) FILTER (WHERE slot_id <= ${COURSE2_CHARITY_CAPACITY} AND status = 'approved'), 0)::bigint AS "charityApprovedTotal"
    FROM course2_registrations`;
  const row = rows[0] ?? {};
  const charityUsed = Number(row.charityUsed ?? 0);
  const cardUsed = Number(row.cardUsed ?? 0);
  const used = Number(row.used ?? 0);
  const charityApproved = Number(row.charityApproved ?? 0);
  const charityApprovedTotal = Number(row.charityApprovedTotal ?? 0);
  const charityFull = charityUsed >= COURSE2_CHARITY_CAPACITY;
  return {
    capacity: COURSE2_CAPACITY,
    used,
    remaining: Math.max(0, COURSE2_CAPACITY - used),
    full: used >= COURSE2_CAPACITY,
    paymentType: (charityFull ? "card" : "charity") as Course2PaymentType,
    charityCapacity: COURSE2_CHARITY_CAPACITY,
    charityUsed,
    charityRemaining: Math.max(0, COURSE2_CHARITY_CAPACITY - charityUsed),
    charityFull,
    charityApproved,
    charityApprovedTotal,
    cardCapacity: COURSE2_CAPACITY - COURSE2_CHARITY_CAPACITY,
    cardUsed,
    cardRemaining: Math.max(0, COURSE2_CAPACITY - COURSE2_CHARITY_CAPACITY - cardUsed),
  };
}
