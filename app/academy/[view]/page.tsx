import { notFound } from "next/navigation";
import { academyEnabled } from "@/lib/academy/config";
import { AuthForm } from "./AuthForm";

export const dynamic = "force-dynamic";

export default async function AuthPage({ params, searchParams }: PageProps<"/academy/[view]">) {
  const [{ view }, query] = await Promise.all([params, searchParams]);
  if (!academyEnabled() || (view !== "sign-in" && view !== "sign-up" && view !== "recover")) notFound();
  return <AuthForm view={view} invited={query.invite === "1"} />;
}
