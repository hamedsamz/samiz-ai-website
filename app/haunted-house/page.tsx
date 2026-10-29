import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'خانهٔ باران | بازی ترسناک سمیز',
  description: 'یک خانهٔ قدیمی در شمال؛ پنج معما، یک حضور ناشناس و راهی برای بازگشت. نسخهٔ اولیهٔ بازی اول‌شخص سمیز برای موبایل و کامپیوتر.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#090e10' };

export default function HauntedHousePage() {
  return <iframe src="/games/house-of-rain/index.html" title="خانهٔ باران — بازی اول‌شخص سمیز" allow="autoplay; fullscreen; pointer-lock" allowFullScreen style={{position:'fixed',inset:0,width:'100%',height:'100dvh',border:0,background:'#090e10',zIndex:1000}} />;
}
