export const CODING_COURSE_NAME = "کدینگ، وایب‌کدینگ";
export const CODING_COURSE_START_DATE = "۱ مهر";
export const CODING_COURSE_IRAN_FEE = 3_000_000;
export const CODING_COURSE_IRAN_DISCOUNT_FEE = 2_000_000;
export const CODING_COURSE_DISCOUNT_CODE = "Mehr";
export function isCodingCourseDiscountCode(code: string) {
  return code.trim().toLowerCase() === CODING_COURSE_DISCOUNT_CODE.toLowerCase();
}
export const CODING_COURSE_INTERNATIONAL_FEE = 45;
export const CODING_COURSE_CARD_NUMBER = process.env.NEXT_PUBLIC_CODING_COURSE_CARD_NUMBER ?? "6104338929517668";
export const CODING_COURSE_CARD_HOLDER = process.env.NEXT_PUBLIC_CODING_COURSE_CARD_HOLDER ?? "هاجر سمیع‌زاده";
export const CODING_COURSE_PAYMENT_TELEGRAM_URL = "https://t.me/hamedsamiz";
export const CODING_COURSE_CHANNEL_URL = process.env.CODING_COURSE_CHANNEL_URL ?? "";
