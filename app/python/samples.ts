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
    id: "calculator",
    title: "ماشین حساب ساده",
    category: "مقدماتی",
    description: "تمرین input، عددها و چهار عمل اصلی",
    stdin: "12\n4",
    code: `number_1 = float(input("Adad aval: "))
number_2 = float(input("Adad dovom: "))

print("Jam:", number_1 + number_2)
print("Tafriq:", number_1 - number_2)
print("Zarb:", number_1 * number_2)

if number_2 != 0:
    print("Taghsim:", number_1 / number_2)
else:
    print("Taghsim bar sefr emkan-pazir nist.")`,
  },
  {
    id: "temperature",
    title: "تبدیل دما",
    category: "مقدماتی",
    description: "تبدیل سانتی‌گراد به فارنهایت",
    stdin: "25",
    code: `celsius = float(input("Dama be Celsius: "))
fahrenheit = (celsius * 9 / 5) + 32

print(f"{celsius:g} C = {fahrenheit:g} F")`,
  },
  {
    id: "word-counter",
    title: "شمارش کلمات",
    category: "مقدماتی",
    description: "کار با رشته، لیست و مجموعه",
    stdin: "python is simple and python is powerful",
    code: `text = input("Yek jomle benevis: ").lower()
words = text.split()

print("Tedade kalameha:", len(words))
print("Kalamehaye gheyr tekrari:", len(set(words)))
print("Toolani-tarin kalame:", max(words, key=len))`,
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
    id: "expense-tracker",
    title: "تحلیل مخارج هفتگی",
    category: "پروژه کوچک",
    description: "جمع، میانگین و پیدا کردن بیشترین هزینه",
    code: `expenses = {
    "Shanbe": 180000,
    "Yekshanbe": 95000,
    "Doshanbe": 240000,
    "Seshanbe": 120000,
    "Chaharshanbe": 310000,
}

total = sum(expenses.values())
average = total / len(expenses)
most_expensive_day = max(expenses, key=expenses.get)

print(f"Majmoo: {total:,} toman")
print(f"Miangin: {average:,.0f} toman")
print("Porhazine-tarin rooz:", most_expensive_day)`,
  },
  {
    id: "password-generator",
    title: "رمزساز تصادفی",
    category: "پروژه کوچک",
    description: "ساخت رمز با random و string",
    code: `import random
import string

length = 12
characters = string.ascii_letters + string.digits + "!@#$%"
password = "".join(random.choice(characters) for _ in range(length))

print("Ramze pishnahadi:", password)`,
  },
  {
    id: "quiz",
    title: "آزمون سه‌سؤالی",
    category: "پروژه کوچک",
    description: "تمرین ورودی، شرط و امتیازدهی",
    stdin: "Tehran\n8\nPython",
    code: `questions = [
    ("Paytakhte Iran? ", "tehran"),
    ("4 zarbdar 2? ", "8"),
    ("Name in zaban barname-nevisi? ", "python"),
]

score = 0
for question, correct_answer in questions:
    answer = input(question).strip().lower()
    if answer == correct_answer:
        score += 1

print(f"Emtiaz: {score} az {len(questions)}")`,
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
    id: "scikit-learn",
    title: "پیش‌بینی با Scikit-learn",
    category: "کتابخانه‌ها",
    description: "یک نمونه ساده یادگیری ماشین",
    code: `import numpy as np
from sklearn.linear_model import LinearRegression

# Saat haye tamrin va nomre haye sabt shode
hours = np.array([[1], [2], [3], [4], [5]])
scores = np.array([52, 61, 69, 78, 88])

model = LinearRegression()
model.fit(hours, scores)

prediction = model.predict([[6]])[0]
print(f"Nomre pishbini shode baraye 6 saat: {prediction:.1f}")`,
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
