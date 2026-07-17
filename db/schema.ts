export const registrationTableSql = `
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  slot_id INTEGER NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  receipt_key TEXT NOT NULL,
  receipt_name TEXT NOT NULL,
  receipt_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

export const slotsTableSql = `
CREATE TABLE IF NOT EXISTS registration_slots (
  id INTEGER PRIMARY KEY,
  registration_id TEXT UNIQUE,
  reserved_at INTEGER
)`;

export const phoneIndexSql = `
CREATE INDEX IF NOT EXISTS registrations_phone_idx ON registrations(phone)
`;
