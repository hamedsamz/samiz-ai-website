import { challengeCapacityStatus } from "../../../../db/calorie-challenge";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await challengeCapacityStatus(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("challenge capacity error", error); return Response.json({ error: "امکان دریافت ظرفیت وجود ندارد." }, { status: 500 }); }
}
