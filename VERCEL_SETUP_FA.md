# راه‌اندازی روی Vercel

1. پروژه را در GitHub قرار دهید و در Vercel به همان مخزن متصل کنید.
2. در Vercel وارد **Storage** شوید و یک دیتابیس **Neon Postgres** بسازید و به پروژه وصل کنید.
3. در **Settings → Environment Variables** مطمئن شوید `DATABASE_URL` ساخته شده است.
4. دو متغیر زیر را برای Production, Preview, Development اضافه کنید:
   - `ADMIN_PASSWORD`: رمز دلخواه ورود به پنل مدیریت
   - `ADMIN_SESSION_SECRET`: یک عبارت تصادفی و طولانی حداقل ۳۲ کاراکتری
5. از بخش Deployments روی Redeploy بزنید.
6. فرم عمومی در `/register` و پنل مدیریت در `/admin/registrations` است.
