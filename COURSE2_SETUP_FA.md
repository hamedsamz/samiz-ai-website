# تنظیمات دوره جدید

صفحه ثبت‌نام دوره جدید:

`/register-2`

پنل مدیریت دوره جدید:

`/admin/registrations-2`

این صفحه و پنل از همان `DATABASE_URL`، `ADMIN_PASSWORD`، `RESEND_API_KEY` و `RESEND_FROM_EMAIL` فعلی استفاده می‌کنند؛ اما اطلاعات و ظرفیت دوره جدید در جدول‌های جدا ذخیره می‌شود.

## اطلاعاتی که بعداً باید در Vercel اضافه شوند

در Project Settings > Environment Variables این سه متغیر را اضافه کنید:

```text
NEXT_PUBLIC_COURSE2_CARD_NUMBER=شماره کارت بدون فاصله
NEXT_PUBLIC_COURSE2_CARD_HOLDER=نام صاحب حساب
COURSE2_TELEGRAM_URL=https://t.me/...
```

پس از افزودن یا تغییر متغیرها، پروژه را Redeploy کنید.

شماره کارت و نام صاحب حساب فعلی به‌عنوان مقدار پیش‌فرض در پروژه قرار گرفته‌اند. در صورت نیاز می‌توان با دو متغیر `NEXT_PUBLIC_COURSE2_CARD_NUMBER` و `NEXT_PUBLIC_COURSE2_CARD_HOLDER` آن‌ها را بدون تغییر کد جایگزین کرد.

تا زمانی که `COURSE2_TELEGRAM_URL` تنظیم نشده باشد، ارسال ایمیل دوره جدید انجام نمی‌شود تا لینک دوره قبلی اشتباهی ارسال نشود.
