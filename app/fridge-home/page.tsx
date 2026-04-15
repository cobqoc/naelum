import type { Metadata } from 'next';
import FridgeHomeClient from './FridgeHomeClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '냉장고 홈 (실험)',
  description: '냉장고 중심 실험 홈 — 재료를 등록하고, 시들기 전에 비워보세요.',
  robots: { index: false, follow: false },
};

export default function FridgeHomePage() {
  return <FridgeHomeClient />;
}
