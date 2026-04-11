import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import IngredientModerationPanel from '@/components/Admin/IngredientModerationPanel';

/**
 * 재료 관리 페이지 (관리자 전용)
 * /admin/ingredients
 */
export default async function AdminIngredientsPage() {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/ingredients');
  }

  // 2. 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IngredientModerationPanel />
      </div>
    </div>
  );
}

/**
 * 메타데이터
 */
export const metadata = {
  title: '재료 관리 | 낼름 Admin',
  description: '사용자가 추가한 재료를 승인하거나 거부합니다',
};
