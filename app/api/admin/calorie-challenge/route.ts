import { challengeDb, ensureChallengeSchema, releaseExpiredChallengeHolds } from "../../../../db/calorie-challenge";
import { isAdmin } from "../../../../lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureChallengeSchema(); await releaseExpiredChallengeHolds();
  const rows = await challengeDb()`SELECT id, slot_id AS "slotId", full_name AS "fullName", email, phone, receipt_name AS "receiptName", receipt_type AS "receiptType", status, created_at AS "createdAt", confirmation_email_sent_at AS "emailSentAt" FROM calorie_challenge_registrations ORDER BY created_at DESC`;
  return Response.json({ registrations: rows }, { headers: { "Cache-Control": "no-store" } });
}
