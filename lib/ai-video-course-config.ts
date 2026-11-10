export const AI_VIDEO_COURSE_NAME = "ساخت ویدیو با هوش مصنوعی";
export const AI_VIDEO_COURSE_START_DATE = "۱ آذر";
export const AI_VIDEO_COURSE_PLANS = {
  "without-support": { label: "بدون پشتیبانی", fee: 4_000_000 },
  "with-support": { label: "با پشتیبانی", fee: 14_000_000 },
} as const;

export type AiVideoCoursePlan = keyof typeof AI_VIDEO_COURSE_PLANS;

export function isAiVideoCoursePlan(value: unknown): value is AiVideoCoursePlan {
  return value === "without-support" || value === "with-support";
}

export function normalizeAiVideoCourseEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

export const AI_VIDEO_COURSE_CARD_NUMBER = process.env.NEXT_PUBLIC_AI_VIDEO_COURSE_CARD_NUMBER ?? "6104338929517668";
export const AI_VIDEO_COURSE_CARD_HOLDER = process.env.NEXT_PUBLIC_AI_VIDEO_COURSE_CARD_HOLDER ?? "هاجر سمیع‌زاده";
export const AI_VIDEO_COURSE_PAYMENT_TELEGRAM_URL = "https://t.me/hamedsamiz";
