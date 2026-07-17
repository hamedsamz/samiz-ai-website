import { bindings, capacityStatus } from "../../../db/registrations";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  let uploadedKey: string | null = null;
  let registrationId: string | null = null;
  try {
    const current = await capacityStatus();
    if (current.full) return Response.json({ error: "ظرفیت دوره تکمیل شده است." }, { status: 409 });

    const form = await request.formData();
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/[\s()-]/g, "").trim();
    const receipt = form.get("receipt");
    if (fullName.length < 3 || fullName.length > 80) return Response.json({ error: "نام و نام خانوادگی را کامل وارد کنید." }, { status: 400 });
    if (!/^\+?[0-9۰-۹]{7,15}$/.test(phone)) return Response.json({ error: "شماره تماس معتبر وارد کنید." }, { status: 400 });
    if (!(receipt instanceof File) || receipt.size === 0) return Response.json({ error: "تصویر رسید را انتخاب کنید." }, { status: 400 });
    if (!allowedTypes.has(receipt.type) || receipt.size > 8 * 1024 * 1024) return Response.json({ error: "رسید باید JPG، PNG، WEBP یا PDF و حداکثر ۸ مگابایت باشد." }, { status: 400 });

    const { DB, BUCKET } = await bindings();
    const duplicate = await DB.prepare("SELECT id FROM registrations WHERE phone = ? AND status IN ('pending', 'approved') LIMIT 1").bind(phone).first();
    if (duplicate) return Response.json({ error: "با این شماره تماس قبلاً ثبت‌نام شده است." }, { status: 409 });

    registrationId = crypto.randomUUID();
    const extension = receipt.type === "application/pdf" ? "pdf" : receipt.type.split("/")[1].replace("jpeg", "jpg");
    uploadedKey = `receipts/${registrationId}.${extension}`;
    await BUCKET.put(uploadedKey, await receipt.arrayBuffer(), { httpMetadata: { contentType: receipt.type } });

    const now = Date.now();
    const slot = await DB.prepare(`UPDATE registration_slots SET registration_id = ?, reserved_at = ?
      WHERE id = (SELECT id FROM registration_slots WHERE registration_id IS NULL ORDER BY id LIMIT 1)
      RETURNING id`).bind(registrationId, now).first<{ id: number }>();
    if (!slot) {
      await BUCKET.delete(uploadedKey);
      return Response.json({ error: "ظرفیت دوره تکمیل شده است." }, { status: 409 });
    }

    await DB.prepare(`INSERT INTO registrations
      (id, slot_id, full_name, phone, receipt_key, receipt_name, receipt_type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
      .bind(registrationId, slot.id, fullName, phone, uploadedKey, receipt.name.slice(0, 160), receipt.type, now, now).run();
    return Response.json({ ok: true, message: "رسید شما ثبت شد و تا ۲۴ ساعت آینده بررسی می‌شود." }, { status: 201 });
  } catch {
    if (registrationId) {
      try { const { DB } = await bindings(); await DB.prepare("UPDATE registration_slots SET registration_id = NULL, reserved_at = NULL WHERE registration_id = ?").bind(registrationId).run(); } catch {}
    }
    if (uploadedKey) {
      try { const { BUCKET } = await bindings(); await BUCKET.delete(uploadedKey); } catch {}
    }
    return Response.json({ error: "ثبت اطلاعات انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
