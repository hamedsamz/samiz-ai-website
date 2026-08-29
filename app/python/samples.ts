export type PythonSample = {
  id: string;
  title: string;
  category: "مقدماتی" | "پروژه کوچک" | "کتابخانه‌ها";
  description: string;
  code: string;
  stdin?: string;
};

export const PYTHON_SAMPLES: PythonSample[] = [
  {
    id: "hello",
    title: "شروع سریع",
    category: "مقدماتی",
    description: "متغیر، حلقه و چاپ خروجی",
    code: `name = "SAMIZ AI"
print("Salam az", name)

for number in range(1, 6):
    print(number, "× 2 =", number * 2)`,
  },
  {
    id: "input",
    title: "دریافت ورودی",
    category: "مقدماتی",
    description: "کار با input و شرط",
    stdin: "Hamed\n18",
    code: `name = input("نام شما: ")
score = int(input("نمره شما: "))

if score >= 12:
    print(name, "قبول شدی 🎉")
else:
    print(name, "دوباره تلاش کن")`,
  },
  {
    id: "collections",
    title: "لیست و دیکشنری",
    category: "مقدماتی",
    description: "مرتب‌سازی و پیمایش داده‌ها",
    code: `students = {
    "سارا": 19,
    "علی": 16,
    "رضا": 18,
}

for name, score in sorted(students.items(), key=lambda item: item[1], reverse=True):
    print(f"{name}: {score}")`,
  },
  {
    id: "functions",
    title: "تابع‌ها",
    category: "مقدماتی",
    description: "ساخت تابع و استفاده دوباره از آن",
    code: `def toman(price):
    return f"{price:,.0f} تومان"

prices = [125000, 890000, 2450000]

for price in prices:
    print(toman(price))`,
  },
  {
    id: "guess",
    title: "بازی حدس عدد",
    category: "پروژه کوچک",
    description: "یک بازی ساده با ورودی کاربر",
    stdin: "7",
    code: `secret = 7
guess = int(input("یک عدد بین ۱ تا ۱۰ حدس بزن: "))

if guess == secret:
    print("آفرین! درست حدس زدی 🎯")
elif guess < secret:
    print("عدد بزرگ‌تری امتحان کن")
else:
    print("عدد کوچک‌تری امتحان کن")`,
  },
  {
    id: "numpy",
    title: "محاسبات با NumPy",
    category: "کتابخانه‌ها",
    description: "تحلیل سریع یک آرایه عددی",
    code: `import numpy as np

scores = np.array([12, 17, 19, 15, 20, 18])

print("میانگین:", scores.mean())
print("بیشترین:", scores.max())
print("نمره‌های بالاتر از میانگین:", scores[scores > scores.mean()])`,
  },
  {
    id: "pandas",
    title: "جدول Pandas",
    category: "کتابخانه‌ها",
    description: "نمایش نتیجه به شکل جدول",
    code: `import pandas as pd

students = pd.DataFrame({
    "نام": ["سارا", "علی", "رضا", "مهسا"],
    "نمره": [19, 16, 18, 20],
    "دوره": ["پایتون", "هوش مصنوعی", "پایتون", "هوش مصنوعی"],
})

students["وضعیت"] = students["نمره"].apply(lambda score: "عالی" if score >= 18 else "خوب")
students`,
  },
  {
    id: "matplotlib",
    title: "نمودار Matplotlib",
    category: "کتابخانه‌ها",
    description: "ساخت و نمایش نمودار داخل خروجی",
    code: `import matplotlib.pyplot as plt

months = ["Far", "Ord", "Kho", "Tir", "Mor", "Sha"]
visits = [120, 180, 160, 240, 310, 380]

plt.figure(figsize=(8, 4))
plt.plot(months, visits, marker="o", linewidth=3, color="#d6a84b")
plt.fill_between(months, visits, alpha=0.15, color="#d6a84b")
plt.title("Website visits")
plt.xlabel("Month")
plt.ylabel("Visits")
plt.grid(alpha=0.2)
plt.tight_layout()`,
  },
  {
    id: "pillow",
    title: "تصویر با Pillow",
    category: "کتابخانه‌ها",
    description: "تولید تصویر با کد پایتون",
    code: `from PIL import Image, ImageDraw

image = Image.new("RGB", (640, 360), "#0d0e0e")
draw = ImageDraw.Draw(image)

for radius in range(160, 10, -18):
    color = (214, max(80, 168 - radius // 3), 75)
    draw.ellipse((320-radius, 180-radius, 320+radius, 180+radius), outline=color, width=5)

draw.text((24, 24), "SAMIZ AI · PYTHON", fill="#f5d98a")
image`,
  },
];

export const STARTER_SAMPLE = PYTHON_SAMPLES[0];
