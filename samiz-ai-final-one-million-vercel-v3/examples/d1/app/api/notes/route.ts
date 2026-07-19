import { NextResponse } from "next/server";

// This legacy example is intentionally disabled in the production project.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
