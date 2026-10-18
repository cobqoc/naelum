import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { handleReport, recipeReportConfig } from '@/lib/api/reportHandler';

// POST /api/recipes/[id]/report - 레시피 신고
// 2026-10-04 API1-35: 레시피·팁·사용자 신고 3벌 복붙 → lib/api/reportHandler 공용(메시지·사유·rate-limit 키 그대로 주입).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: recipeId } = await params;
  return handleReport(request, supabase, recipeReportConfig(recipeId));
}
