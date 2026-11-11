import { academyUser } from "@/lib/academy/auth";
import { academyEnabled, privateHeaders, validId } from "@/lib/academy/config";
import { enrolledLesson } from "@/lib/academy/db";
import { readLessonAsset } from "@/lib/academy/media";
import { isSegment, PLAYLIST } from "@/lib/academy/playlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/academy-media/[lesson]/[asset]">) {
  const { lesson, asset } = await context.params;
  if (!academyEnabled() || !validId(lesson) || (asset !== PLAYLIST && !isSegment(asset))) {
    return new Response(null, { status: 404, headers: privateHeaders });
  }

  try {
    const user = await academyUser();
    if (!user) return new Response(null, { status: 401, headers: privateHeaders });
    if (!await enrolledLesson(user.id, lesson)) return new Response(null, { status: 404, headers: privateHeaders });
    const bytes = await readLessonAsset(lesson, asset);
    if (!bytes) return new Response(null, { status: 404, headers: privateHeaders });
    return new Response(bytes, { headers: {
      ...privateHeaders,
      "Content-Type": asset === PLAYLIST ? "application/vnd.apple.mpegurl" : "video/mp2t",
      "Content-Length": String(bytes.byteLength),
      "Cross-Origin-Resource-Policy": "same-origin",
    } });
  } catch {
    return new Response(null, { status: 503, headers: privateHeaders });
  }
}
