"use server";

import { academyUser, sameOriginMutation } from "@/lib/academy/auth";
import { acceptInvitation } from "@/lib/academy/db";

export async function redeemInvitation(token: string) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token) || !await sameOriginMutation()) return false;
  const user = await academyUser();
  if (!user) return false;
  try {
    return await acceptInvitation(token, user);
  } catch {
    return false;
  }
}
