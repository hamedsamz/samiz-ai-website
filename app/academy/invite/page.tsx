import { notFound } from "next/navigation";
import { academyUser } from "@/lib/academy/auth";
import { academyEnabled } from "@/lib/academy/config";
import { Invite } from "./Invite";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  if (!academyEnabled()) notFound();
  const user = await academyUser();
  return <Invite verifiedEmail={user?.email ?? null} />;
}
