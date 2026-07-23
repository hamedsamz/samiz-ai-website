import { course2CapacityStatus } from "../../../../../db/course2-registrations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await course2CapacityStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("course 2 status error", error);
    return Response.json({ error: "امکان دریافت ظرفیت وجود ندارد." }, { status: 500 });
  }
}
