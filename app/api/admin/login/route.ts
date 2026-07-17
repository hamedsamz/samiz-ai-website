import { createAdminSession } from "../../../../lib/admin-auth";
export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string };
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return Response.json({ error: "رمز مدیریت اشتباه است." }, { status: 401 });
  await createAdminSession(); return Response.json({ ok: true });
}
