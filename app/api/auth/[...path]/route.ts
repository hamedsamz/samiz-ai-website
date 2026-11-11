import { academyAuth, sameOriginMutation } from "@/lib/academy/auth";
import { privateHeaders } from "@/lib/academy/config";
import { registrationCookie } from "@/lib/academy/registration";

type Context = RouteContext<"/api/auth/[...path]">;

const postEndpoints = new Set([
  "sign-in/email", "sign-up/email", "sign-out",
  "email-otp/send-verification-otp", "email-otp/verify-email",
  "email-otp/request-password-reset", "email-otp/reset-password",
]);

export async function POST(request: Request, context: Context) {
  const auth = academyAuth();
  const { path } = await context.params;
  const endpoint = path.join("/");
  if (!auth || !postEndpoints.has(endpoint)) return new Response(null, { status: 404, headers: privateHeaders });
  if (!await sameOriginMutation()) return new Response(null, { status: 403, headers: privateHeaders });
  if (endpoint === "sign-out") return auth.handler(request);

  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" ||
      Number(request.headers.get("content-length")) > 8192) {
    return new Response(null, { status: 400, headers: privateHeaders });
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 8192) return new Response(null, { status: 413, headers: privateHeaders });
    const input = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input) || "callbackURL" in input ||
        (endpoint === "email-otp/send-verification-otp" && input.type !== "email-verification")) {
      return new Response(null, { status: 400, headers: privateHeaders });
    }
    if (endpoint === "sign-up/email" && (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100)) {
      return new Response(null, { status: 400, headers: privateHeaders });
    }
    const response = await auth.handler(new Request(request.url, { method: "POST", headers: request.headers, body: raw }));
    if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json")) return response;
    const result = await response.json();
    if (!result || typeof result !== "object") return Response.json(result, { headers: privateHeaders });
    delete result.token;
    delete result.session;
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-length");
    if (endpoint === "sign-up/email" && typeof result.user?.id === "string") {
      responseHeaders.append("Set-Cookie", registrationCookie(result.user.id));
    }
    for (const [key, value] of Object.entries(privateHeaders)) responseHeaders.set(key, value);
    return Response.json(result, { status: response.status, headers: responseHeaders });
  } catch {
    return new Response(null, { status: 400, headers: privateHeaders });
  }
}
