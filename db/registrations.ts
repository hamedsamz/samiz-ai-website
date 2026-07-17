import { phoneIndexSql, registrationTableSql, slotsTableSql } from "./schema";

export const CAPACITY = 50;
export const HOLD_MS = 24 * 60 * 60 * 1000;

type RuntimeEnv = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

export async function bindings() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as RuntimeEnv;
}

export async function ensureRegistrationSchema() {
  const { DB } = await bindings();
  await DB.batch([
    DB.prepare(registrationTableSql),
    DB.prepare(slotsTableSql),
    DB.prepare(phoneIndexSql),
  ]);
  const statements = Array.from({ length: CAPACITY }, (_, index) =>
    DB.prepare("INSERT OR IGNORE INTO registration_slots (id) VALUES (?)").bind(index + 1),
  );
  await DB.batch(statements);
}

export async function releaseExpiredHolds(now = Date.now()) {
  const { DB } = await bindings();
  const cutoff = now - HOLD_MS;
  await DB.batch([
    DB.prepare("UPDATE registrations SET status = 'expired', updated_at = ? WHERE status = 'pending' AND created_at < ?").bind(now, cutoff),
    DB.prepare(`UPDATE registration_slots SET registration_id = NULL, reserved_at = NULL
      WHERE registration_id IN (SELECT id FROM registrations WHERE status IN ('expired', 'rejected'))`).bind(),
  ]);
}

export async function capacityStatus() {
  await ensureRegistrationSchema();
  await releaseExpiredHolds();
  const { DB } = await bindings();
  const row = await DB.prepare("SELECT COUNT(*) AS used FROM registration_slots WHERE registration_id IS NOT NULL").first<{ used: number }>();
  const used = Number(row?.used ?? 0);
  return { capacity: CAPACITY, used, remaining: Math.max(0, CAPACITY - used), full: used >= CAPACITY };
}

export async function isAdminRequest() {
  const { headers } = await import("next/headers");
  const email = (await headers()).get("oai-authenticated-user-email");
  return email?.toLowerCase() === "samizadehhamed24@gmail.com";
}
