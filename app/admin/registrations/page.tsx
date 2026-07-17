import { requireChatGPTUser, chatGPTSignOutPath } from "../../chatgpt-auth";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const user = await requireChatGPTUser("/admin/registrations");
  if (user.email.toLowerCase() !== "samizadehhamed24@gmail.com") return <main className="admin-page fa" dir="rtl"><div className="access-denied"><h1>دسترسی مجاز نیست</h1><p>این صفحه فقط برای مدیر ثبت‌نام‌ها در دسترس است.</p><a href={chatGPTSignOutPath("/")}>خروج از حساب</a></div></main>;
  return <main className="admin-page fa" dir="rtl"><header className="admin-header"><div><p className="eyebrow">SAMIZ AI ACADEMY</p><h1>مدیریت ثبت‌نام‌ها</h1></div><div><span>{user.email}</span><a href={chatGPTSignOutPath("/")}>خروج</a></div></header><AdminPanel /></main>;
}
