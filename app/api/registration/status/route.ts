import { capacityStatus } from "../../../../db/registrations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await capacityStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "امکان دریافت ظرفیت وجود ندارد." }, { status: 500 });
  }
}
